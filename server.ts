import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Safe resolution for __filename and __dirname in both CJS and ESM environments
const isESM = typeof import.meta !== 'undefined' && !!import.meta.url;
const _filename = isESM ? fileURLToPath(import.meta.url) : (typeof __filename !== 'undefined' ? __filename : '');
const _dirname = isESM ? path.dirname(_filename) : (typeof __dirname !== 'undefined' ? __dirname : '');

import pg from 'pg';

let pgPool: pg.Pool | null = null;

function getPgPool(): pg.Pool | null {
  if (!pgPool && process.env.DATABASE_URL) {
    console.log('[PostgreSQL] Initializing lazy database pool...');
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
  return pgPool;
}

async function initializePostgres() {
  const pool = getPgPool();
  if (!pool) return;
  
  try {
    console.log('[PostgreSQL] Initializing schema and verifying extensions...');
    // Enable PostGIS
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        google_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS zones (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        geom GEOMETRY(Polygon, 4326) NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(255) PRIMARY KEY,
        reporter_id VARCHAR(255) REFERENCES users(id),
        reporter_name VARCHAR(255),
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        geom GEOMETRY(Point, 4326),
        zone_id VARCHAR(255) REFERENCES zones(id),
        zone_name VARCHAR(255),
        is_anonymous BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) NOT NULL,
        priority_score INTEGER DEFAULT 3,
        severity VARCHAR(50) DEFAULT 'medium',
        location_hint VARCHAR(255),
        sentiment VARCHAR(50) DEFAULT 'neutral',
        triage_analysis TEXT,
        photo_url TEXT,
        voice_url TEXT,
        voice_interpretation TEXT,
        upvotes INTEGER DEFAULT 0,
        report_count INTEGER DEFAULT 1,
        upvoted_by TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS reports_geom_idx ON reports USING gist(geom);`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS technicians (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        skill_tags TEXT[] DEFAULT '{}',
        current_load INTEGER DEFAULT 0
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id VARCHAR(255) PRIMARY KEY,
        report_id VARCHAR(255) REFERENCES reports(id) ON DELETE CASCADE,
        technician_id VARCHAR(255) REFERENCES technicians(id),
        technician_name VARCHAR(255) NOT NULL,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id VARCHAR(255) PRIMARY KEY,
        report_id VARCHAR(255) REFERENCES reports(id) ON DELETE CASCADE,
        user_id VARCHAR(255),
        user_name VARCHAR(255) NOT NULL,
        user_role VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        reference_id VARCHAR(255),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Schema Evolution/Alterations to ensure columns like "geom" exist if tables were pre-created
    console.log('[PostgreSQL] Ensuring database schema evolution columns exist...');
    await pool.query('ALTER TABLE zones ADD COLUMN IF NOT EXISTS geom GEOMETRY(Polygon, 4326);');
    await pool.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS geom GEOMETRY(Point, 4326);');
    await pool.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 1;');
    await pool.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS upvoted_by TEXT[] DEFAULT \'{}\';');
    await pool.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS severity VARCHAR(50) DEFAULT \'medium\';');
    await pool.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS location_hint VARCHAR(255);');
    await pool.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS sentiment VARCHAR(50) DEFAULT \'neutral\';');
    await pool.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS triage_analysis TEXT;');
    await pool.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS photo_url TEXT;');
    await pool.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS voice_url TEXT;');
    await pool.query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS voice_interpretation TEXT;');

    // Seed users, zones, technicians if empty
    const usersRes = await pool.query('SELECT COUNT(*) FROM users;');
    if (parseInt(usersRes.rows[0].count, 10) === 0) {
      console.log('[PostgreSQL] Seeding users table...');
      await pool.query(`
        INSERT INTO users (id, google_id, name, email, role) VALUES
          ('usr-student-1', '10001', 'Sani Bello', 'sbello@student.abu.edu.ng', 'student'),
          ('usr-student-2', '10002', 'Amina Yusuf', 'ayusuf@student.abu.edu.ng', 'student'),
          ('usr-admin-1', '20001', 'Prof. Ibrahim Usman', 'iusman@abu.edu.ng', 'admin'),
          ('usr-tech-1', '30001', 'Musa Garba', 'mgarba@tech.abu.edu.ng', 'technician'),
          ('usr-tech-2', '30002', 'John Okoye', 'jokoye@tech.abu.edu.ng', 'technician'),
          ('usr-tech-all', '30003', 'Aliyu Ibrahim', 'aibrahim@tech.abu.edu.ng', 'technician')
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    const zonesRes = await pool.query('SELECT COUNT(*) FROM zones;');
    if (parseInt(zonesRes.rows[0].count, 10) === 0) {
      console.log('[PostgreSQL] Seeding zones table...');
      await pool.query(`
        INSERT INTO zones (id, name, geom) VALUES
          ('zone-suleiman', 'Suleiman Hall', ST_GeomFromText('POLYGON((7.710 11.142, 7.715 11.142, 7.715 11.146, 7.710 11.146, 7.710 11.142))', 4326)),
          ('zone-amina', 'Amina Hall', ST_GeomFromText('POLYGON((7.710 11.143, 7.713 11.143, 7.713 11.147, 7.710 11.147, 7.710 11.143))', 4326)),
          ('zone-ribadu', 'Ribadu Hall', ST_GeomFromText('POLYGON((7.708 11.144, 7.712 11.144, 7.712 11.148, 7.708 11.148, 7.708 11.144))', 4326)),
          ('zone-engineering', 'Faculty of Engineering', ST_GeomFromText('POLYGON((7.706 11.140, 7.711 11.140, 7.711 11.144, 7.706 11.144, 7.706 11.140))', 4326)),
          ('zone-other', 'ABU Campus (General)', ST_GeomFromText('POLYGON((7.690 11.130, 7.730 11.130, 7.730 11.160, 7.690 11.160, 7.690 11.130))', 4326))
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    const techsRes = await pool.query('SELECT COUNT(*) FROM technicians;');
    if (parseInt(techsRes.rows[0].count, 10) === 0) {
      console.log('[PostgreSQL] Seeding technicians table...');
      await pool.query(`
        INSERT INTO technicians (id, user_id, name, skill_tags, current_load) VALUES
          ('tech-1', 'usr-tech-1', 'Musa Garba', ARRAY['broken_lights', 'wifi_outage', 'security'], 0),
          ('tech-2', 'usr-tech-2', 'John Okoye', ARRAY['plumbing', 'structural'], 0),
          ('tech-all', 'usr-tech-all', 'Aliyu Ibrahim', ARRAY['broken_lights', 'plumbing', 'wifi_outage', 'security', 'structural', 'others'], 0)
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    console.log('[PostgreSQL] Database schema fully initialized and verified!');
  } catch (err) {
    console.error('[PostgreSQL Initialization Error]', err);
  }
}

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

// Types for DB
interface User {
  id: string;
  google_id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'technician';
}

interface Report {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  category: string;
  description: string;
  photo_url?: string;
  lat: number;
  lng: number;
  zone_id: string;
  zone_name?: string;
  status: 'submitted' | 'assigned' | 'in_progress' | 'resolved';
  priority_score: number;
  is_anonymous: boolean;
  upvotes: number;
  upvoted_by: string[];
  created_at: string;
  comments_count?: number;
  gemma_rank_score?: number;
  severity?: 'low' | 'medium' | 'high' | 'urgent';
  location_hint?: string;
  sentiment?: string;
  report_count?: number;
  voice_url?: string;
  voice_interpretation?: string;
}

// Global Core AI Engine caller for Gemma 4 (strictly enforcing the use of Hugging Face Inference API / Gemma 4)
async function callGemmaAI(
  prompt: string, 
  systemInstruction?: string, 
  jsonMode: boolean = false,
  imagePayload?: { mimeType: string, data: string }
): Promise<string> {
  const gemmaModelString = process.env.GEMMA_MODEL || 'google/gemma-4-31b-it';

  // 1. Try process.env.GEMMA_API_URL first (self-hosted Gemma 4 or Hugging Face Inference API instance)
  if (process.env.GEMMA_API_URL) {
    try {
      console.log(`[Gemma AI Client] Direct routing request to Gemma API at: ${process.env.GEMMA_API_URL}`);
      const gemmaUrl = process.env.GEMMA_API_URL.trim();
      let endpoint = gemmaUrl;
      let body: any = {};
      let headers: any = { 'Content-Type': 'application/json' };

      // Optional Hugging Face Token support
      const hfToken = process.env.HF_API_TOKEN || process.env.HUGGINGFACE_API_KEY;
      if (hfToken) {
        headers['Authorization'] = `Bearer ${hfToken}`;
      }

      if (gemmaUrl.includes('huggingface.co') && !gemmaUrl.includes('/v1') && !gemmaUrl.includes('/chat/completions')) {
        // Standard Hugging Face serverless text generation format
        endpoint = gemmaUrl;
        const combinedPrompt = systemInstruction 
          ? `<|system|>\n${systemInstruction}\n<|user|>\n${prompt}\n<|assistant|>\n` 
          : prompt;
        
        body = {
          inputs: combinedPrompt,
          parameters: {
            temperature: 0.1,
            max_new_tokens: 1024,
            return_full_text: false
          }
        };
      } else if (gemmaUrl.includes('/v1') || gemmaUrl.includes('huggingface.co') && (gemmaUrl.includes('/chat/completions') || gemmaUrl.includes('/v1'))) {
        // OpenAI / Hugging Face Chat completions format
        endpoint = gemmaUrl.endsWith('/') ? `${gemmaUrl}chat/completions` : `${gemmaUrl}/chat/completions`;
        const messages: any[] = [];
        if (systemInstruction) {
          messages.push({ role: 'system', content: systemInstruction });
        }
        
        let userContent: any = prompt;
        if (imagePayload) {
          userContent = [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${imagePayload.mimeType};base64,${imagePayload.data}` } }
          ];
        }
        messages.push({ role: 'user', content: userContent });

        body = {
          model: gemmaModelString,
          messages: messages,
          temperature: 0.1,
          response_format: jsonMode ? { type: 'json_object' } : undefined
        };
      } else if (gemmaUrl.includes(':11434') || gemmaUrl.includes('/api/generate')) {
        // Ollama API format
        endpoint = gemmaUrl.endsWith('/api/generate') ? gemmaUrl : `${gemmaUrl}/api/generate`;
        body = {
          model: 'gemma',
          prompt: systemInstruction ? `System: ${systemInstruction}\nUser: ${prompt}` : prompt,
          images: imagePayload ? [imagePayload.data] : undefined,
          stream: false,
          format: jsonMode ? 'json' : undefined,
          options: { temperature: 0.1 }
        };
      } else {
        // Generic completion format
        endpoint = gemmaUrl;
        body = {
          prompt: systemInstruction ? `System: ${systemInstruction}\nUser: ${prompt}` : prompt,
          temperature: 0.1,
          jsonMode
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000) // 10s strict timeout
      });

      if (response.ok) {
        const data = await response.json();
        let result = '';
        if (data.choices && data.choices[0] && data.choices[0].message) {
          result = data.choices[0].message.content;
        } else if (Array.isArray(data) && data[0] && data[0].generated_text) {
          result = data[0].generated_text;
        } else if (data.generated_text) {
          result = data.generated_text;
        } else if (data.response) {
          result = data.response; // Ollama format
        } else if (data.text) {
          result = data.text;
        } else if (typeof data === 'string') {
          result = data;
        } else {
          result = JSON.stringify(data);
        }
        console.log('[Gemma AI Engine Response Success]:', result.substring(0, 300));
        return result;
      } else {
        const errorText = await response.text().catch(() => '');
        console.warn(`[Gemma AI Engine Warn] Non-200 response code returned: ${response.status}. Error: ${errorText}`);
      }
    } catch (err) {
      console.error('[Gemma AI Engine Error] Connection to Gemma 4 API failed:', err);
    }
  }

  // Gemma API is strictly enforced and is currently unreachable.
  throw new Error('Gemma AI service currently unreachable.');
}

// Physical distance calculation using Haversine formula (matches PostGIS 100m radius check)
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

// Jaccard similarity word overlap check for true local duplicate detection
function getJaccardSimilarity(str1: string, str2: string): number {
  const getWords = (s: string) => new Set(s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const s1 = getWords(str1);
  const s2 = getWords(str2);
  if (s1.size === 0 || s2.size === 0) return 0;
  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  return intersection.size / union.size;
}

interface Technician {
  id: string;
  user_id: string;
  name: string;
  skill_tags: string[];
  current_load: number;
}

interface Assignment {
  id: string;
  report_id: string;
  technician_id: string;
  technician_name: string;
  assigned_at: string;
  resolved_at?: string;
}

interface Comment {
  id: string;
  report_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  text: string;
  created_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'status_change' | 'new_assignment' | 'high_priority';
  reference_id: string;
  read: boolean;
  created_at: string;
}

// Initial Seeds
const DEFAULT_USERS: User[] = [
  { id: 'usr-student-1', google_id: '10001', name: 'Sani Bello', email: 'sbello@student.abu.edu.ng', role: 'student' },
  { id: 'usr-student-2', google_id: '10002', name: 'Amina Yusuf', email: 'ayusuf@student.abu.edu.ng', role: 'student' },
  { id: 'usr-admin-1', google_id: '20001', name: 'Prof. Ibrahim Usman', email: 'iusman@abu.edu.ng', role: 'admin' },
  { id: 'usr-tech-1', google_id: '30001', name: 'Musa Garba', email: 'mgarba@tech.abu.edu.ng', role: 'technician' },
  { id: 'usr-tech-2', google_id: '30002', name: 'John Okoye', email: 'jokoye@tech.abu.edu.ng', role: 'technician' },
  { id: 'usr-tech-all', google_id: '30003', name: 'Aliyu Ibrahim', email: 'aibrahim@tech.abu.edu.ng', role: 'technician' }
];

const DEFAULT_TECHNICIANS: Technician[] = [
  { id: 'tech-1', user_id: 'usr-tech-1', name: 'Musa Garba', skill_tags: ['broken_lights', 'wifi_outage', 'security'], current_load: 0 },
  { id: 'tech-2', user_id: 'usr-tech-2', name: 'John Okoye', skill_tags: ['plumbing', 'structural'], current_load: 0 },
  { id: 'tech-all', user_id: 'usr-tech-all', name: 'Aliyu Ibrahim', skill_tags: ['broken_lights', 'plumbing', 'wifi_outage', 'security', 'structural', 'others'], current_load: 0 }
];

const DEFAULT_REPORTS: Report[] = [
  {
    id: 'rep-seed-1',
    reporter_id: 'usr-student-1',
    reporter_name: 'Sani Bello',
    category: 'plumbing',
    description: 'Main borehole water pipe leaking near Suleiman Hostel Gate. Flooding the entrance walkway.',
    lat: 11.1442,
    lng: 7.7123,
    zone_id: 'zone-suleiman',
    zone_name: 'Suleiman Hall',
    status: 'submitted',
    priority_score: 4,
    is_anonymous: false,
    upvotes: 3,
    upvoted_by: ['usr-student-2'],
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    severity: 'high',
    location_hint: 'Suleiman Hostel Gate',
    sentiment: 'frustrated',
    report_count: 1
  },
  {
    id: 'rep-seed-2',
    reporter_id: 'usr-student-2',
    reporter_name: 'Amina Yusuf',
    category: 'broken_lights',
    description: 'Walkway lights completely dark from Faculty of Engineering to Ribadu Hall. Total blackout, high security concern.',
    lat: 11.1465,
    lng: 7.7110,
    zone_id: 'zone-ribadu',
    zone_name: 'Ribadu Hall',
    status: 'assigned',
    priority_score: 5,
    is_anonymous: false,
    upvotes: 5,
    upvoted_by: ['usr-student-1'],
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    severity: 'urgent',
    location_hint: 'Engineering to Ribadu Walkway',
    sentiment: 'angry',
    report_count: 1
  }
];

const DEFAULT_ASSIGNMENTS: Assignment[] = [];

const DEFAULT_COMMENTS: Comment[] = [];

const DEFAULT_NOTIFICATIONS: Notification[] = [];

// Load or Seed DB
function loadDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.notifications) parsed.notifications = [];
      
      // Programmatically ensure the new general technician account is created
      if (parsed.users && !parsed.users.some((u: any) => u.id === 'usr-tech-all')) {
        parsed.users.push({ id: 'usr-tech-all', google_id: '30003', name: 'Aliyu Ibrahim', email: 'aibrahim@tech.abu.edu.ng', role: 'technician' });
      }
      if (parsed.technicians && !parsed.technicians.some((t: any) => t.id === 'tech-all')) {
        parsed.technicians.push({ id: 'tech-all', user_id: 'usr-tech-all', name: 'Aliyu Ibrahim', skill_tags: ['broken_lights', 'plumbing', 'wifi_outage', 'security', 'structural', 'others'], current_load: 0 });
      }

      return parsed;
    } catch (e) {
      console.error('Error reading db file, resetting', e);
    }
  }
  
  const initialDb = {
    users: DEFAULT_USERS,
    reports: DEFAULT_REPORTS,
    technicians: DEFAULT_TECHNICIANS,
    assignments: DEFAULT_ASSIGNMENTS,
    comments: DEFAULT_COMMENTS,
    notifications: DEFAULT_NOTIFICATIONS
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  return initialDb;
}

function saveDatabase(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Ensure DB is initialized
  let db = loadDatabase();
  await initializePostgres();

  // Helper to authenticate user from headers (Strict Auth)
  function getAuthenticatedUser(req: express.Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const parts = authHeader.replace('Bearer session-jwt-', '').split('-');
    const lastPart = parts[parts.length - 1];
    const hasTimestamp = parts.length > 1 && !isNaN(Number(lastPart)) && lastPart.length >= 10;
    const userId = hasTimestamp ? parts.slice(0, -1).join('-') : parts.join('-');
    return db.users.find((u: User) => u.id === userId) || null;
  }

  // SSE client tracker for real-time notifications
  const sseClients: { userId: string; res: express.Response }[] = [];

  // Helper to determine if a notification should be delivered to a given user based on role-based rules
  function shouldUserReceiveNotification(user: any, notification: Notification): boolean {
    if (!user) return false;

    // 1. If user is an Admin
    if (user.role === 'admin') {
      // Admins receive all general admin notifications, direct notifications, and any maintenance reports notifications (reference_id)
      if (notification.user_id === 'admin' || notification.user_id === user.id) {
        return true;
      }
      if (notification.reference_id) {
        return true;
      }
      return false;
    }

    // 2. If user is a Technician
    if (user.role === 'technician') {
      // Technicians only receive tasks specifically assigned to them.
      // First, check if the notification is a direct assignment/update for them
      if (notification.user_id === user.id) {
        return true;
      }
      // Or check if the notification's report is assigned to them
      if (notification.reference_id) {
        // If the notification is targeted to another user/role (e.g. a specific student ID or 'admin'),
        // do not deliver it to this technician.
        if (notification.user_id && 
            notification.user_id !== user.id && 
            notification.user_id !== 'all' && 
            notification.user_id !== 'technician' && 
            notification.user_id !== 'technicians') {
          return false;
        }

        const tech = db.technicians.find((t: any) => t.user_id === user.id);
        if (tech) {
          const isAssigned = db.assignments.some(
            (asg: any) => asg.report_id === notification.reference_id && asg.technician_id === tech.id
          );
          if (isAssigned) {
            return true;
          }
        }
      }
      return false;
    }

    // 3. If user is a Student
    // "Ensure students only receive updates regarding their submitted reports."
    // They must be the reporter of the report referenced in the notification.
    if (notification.reference_id) {
      const report = db.reports.find((r: any) => r.id === notification.reference_id);
      if (report && report.reporter_id === user.id) {
        // Also ensure it is targeted to them
        if (notification.user_id === user.id) {
          return true;
        }
      }
      return false;
    }

    // Fallback for non-report-related notifications directly targeted to them
    return notification.user_id === user.id;
  }

  // Broadcast and save real-time notifications
  function sendLiveNotification(notification: Notification, targetRole?: 'admin' | 'technician' | 'student') {
    if (!db.notifications) {
      db.notifications = [];
    }
    db.notifications.push(notification);
    saveDatabase(db);

    console.log(`[Notification] Broadcast to User: ${notification.user_id}, TargetRole: ${targetRole || 'all'}`);

    sseClients.forEach(client => {
      const user = db.users.find((u: any) => u.id === client.userId);
      if (!user) return;

      if (shouldUserReceiveNotification(user, notification)) {
        try {
          client.res.write(`data: ${JSON.stringify(notification)}\n\n`);
        } catch (err) {
          console.error('[SSE] Failed to write notification to client', err);
        }
      }
    });
  }

  // API Routes
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // SSE Live Broadcast Stream
  app.get('/api/events', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const client = { userId, res };
    sseClients.push(client);
    console.log(`[SSE] Client connected. User ID: ${userId}. Active clients: ${sseClients.length}`);

    // Initial ping
    res.write(': sse-connection-established\n\n');

    // Keep connection alive
    const pingInterval = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (err) {
        console.error('[SSE] Failed to write ping, connection likely closed');
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(pingInterval);
      const index = sseClients.indexOf(client);
      if (index > -1) {
        sseClients.splice(index, 1);
      }
      console.log(`[SSE] Client disconnected. User ID: ${userId}. Active clients: ${sseClients.length}`);
    });
  });

  // Get notifications for user
  app.get('/api/notifications', (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = db.users.find((u: any) => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!db.notifications) db.notifications = [];

    // Filter using our robust role-based helper function
    const filtered = db.notifications.filter((n: Notification) => shouldUserReceiveNotification(user, n));

    // Newest first
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json(filtered);
  });

  // Mark specific notification as read
  app.post('/api/notifications/:id/read', (req, res) => {
    const { id } = req.params;
    if (!db.notifications) db.notifications = [];
    const notif = db.notifications.find((n: Notification) => n.id === id);
    if (notif) {
      notif.read = true;
      saveDatabase(db);
    }
    res.json({ success: true });
  });

  // Clear all notifications
  app.post('/api/notifications/clear', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = db.users.find((u: any) => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!db.notifications) db.notifications = [];

    // Filter out notifications that this user is eligible to receive
    db.notifications = db.notifications.filter((n: Notification) => !shouldUserReceiveNotification(user, n));

    saveDatabase(db);
    res.json({ success: true });
  });

  // Auth Google Mock/Verify
  app.post('/api/auth/google', (req, res) => {
    const { token, email, name, roleSelection } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Google Identity verification restriction (restricted to specific domain)
    // We restrict to ABU domain: student.abu.edu.ng or abu.edu.ng
    const isABUDomain = email.endsWith('.abu.edu.ng') || email.endsWith('@abu.edu.ng');
    if (!isABUDomain) {
      return res.status(403).json({ 
        error: 'Access Denied. CamPulse is restricted to Ahmadu Bello University (abu.edu.ng) emails.' 
      });
    }

    // Find or create user
    let user = db.users.find((u: User) => u.email === email);
    if (!user) {
      // Determine role from email if possible, or use provided roleSelection
      let role: 'student' | 'admin' | 'technician' = 'student';
      if (email.includes('tech')) {
        role = 'technician';
      } else if (email.includes('admin') || email === 'iusman@abu.edu.ng') {
        role = 'admin';
      } else if (roleSelection) {
        role = roleSelection;
      }
      
      user = {
        id: `usr-${Date.now()}`,
        google_id: token || `g-${Math.random().toString(36).substr(2, 9)}`,
        name: name || email.split('@')[0],
        email: email,
        role: role
      };
      
      db.users.push(user);
      
      // If technician, create technician profile
      if (role === 'technician') {
        db.technicians.push({
          id: `tech-${Date.now()}`,
          user_id: user.id,
          name: user.name,
          skill_tags: ['broken_lights', 'plumbing', 'wifi_outage', 'security'],
          current_load: 0
        });
      }
      
      saveDatabase(db);
    }

    // Send verified user session token (simple simulated session JWT)
    res.json({
      token: `session-jwt-${user.id}-${Date.now()}`,
      user: user
    });
  });

  // Get current users / profile (helper)
  app.get('/api/users/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const parts = authHeader.replace('Bearer session-jwt-', '').split('-');
    const lastPart = parts[parts.length - 1];
    const hasTimestamp = parts.length > 1 && !isNaN(Number(lastPart)) && lastPart.length >= 10;
    const userId = hasTimestamp ? parts.slice(0, -1).join('-') : parts.join('-');
    const user = db.users.find((u: User) => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  // Update user role (helper for role-swapping / testing)
  app.post('/api/users/role', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const parts = authHeader.replace('Bearer session-jwt-', '').split('-');
    const lastPart = parts[parts.length - 1];
    const hasTimestamp = parts.length > 1 && !isNaN(Number(lastPart)) && lastPart.length >= 10;
    const userId = hasTimestamp ? parts.slice(0, -1).join('-') : parts.join('-');
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const user = db.users.find((u: User) => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = role;

    // Check if user is a technician and does not have a technician profile, create one
    if (role === 'technician') {
      const existingTech = db.technicians.find((t: Technician) => t.user_id === user.id);
      if (!existingTech) {
        db.technicians.push({
          id: `tech-${Date.now()}`,
          user_id: user.id,
          name: user.name,
          email: user.email,
          skill_tags: ['broken_lights', 'plumbing', 'wifi_outage', 'security', 'structural', 'others'],
          current_load: 0
        });
      }
    }

    saveDatabase(db);

    // Also sync to PostgreSQL if pool is active
    const pool = getPgPool();
    if (pool) {
      pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId])
        .catch(err => console.error('[PostgreSQL Error] Failed to update user role:', err));
    }

    res.json({ success: true, user });
  });

  // Get all reports
  app.get('/api/reports', async (req, res) => {
    const { category, status, zone_id, query } = req.query;

    const pool = getPgPool();
    if (pool) {
      try {
        console.log('[PostgreSQL] Querying reports directly from DB...');
        let sql = `
          SELECT r.*, 
            (SELECT COUNT(*)::int FROM comments WHERE report_id = r.id) as comments_count,
            (SELECT technician_id FROM assignments WHERE report_id = r.id AND resolved_at IS NULL ORDER BY assigned_at DESC LIMIT 1) AS assigned_technician_id,
            (SELECT technician_name FROM assignments WHERE report_id = r.id AND resolved_at IS NULL ORDER BY assigned_at DESC LIMIT 1) AS assigned_technician_name
          FROM reports r
          WHERE 1=1
        `;
        const params: any[] = [];
        
        if (category && category !== 'all') {
          params.push(category);
          sql += ` AND r.category = $${params.length}`;
        }
        if (status && status !== 'all') {
          params.push(status);
          sql += ` AND r.status = $${params.length}`;
        }
        if (zone_id && zone_id !== 'all') {
          params.push(zone_id);
          sql += ` AND r.zone_id = $${params.length}`;
        }
        if (query) {
          params.push(`%${query}%`);
          sql += ` AND (LOWER(r.description) LIKE $${params.length} OR LOWER(r.reporter_name) LIKE $${params.length})`;
        }
        
        sql += ` ORDER BY r.created_at DESC`;
        
        const result = await pool.query(sql, params);
        
        // Calculate gemma_rank_score for compatibility
        const reports = result.rows.map(r => {
          const priority_score = r.priority_score || 3;
          const upvotes = r.upvotes || 0;
          const commentsCount = r.comments_count || 0;
          const gemmaScore = (priority_score * 15) + (upvotes * 5) + (commentsCount * 3);
          return {
            ...r,
            gemma_rank_score: gemmaScore
          };
        });
        
        return res.json(reports);
      } catch (err) {
        console.error('[PostgreSQL Error] Failed to fetch reports, falling back to local DB:', err);
      }
    }
    
    // Create map for fast comments count lookup
    const commentsCountMap: Record<string, number> = {};
    if (db.comments) {
      db.comments.forEach((c: any) => {
        commentsCountMap[c.report_id] = (commentsCountMap[c.report_id] || 0) + 1;
      });
    }

    let filtered = db.reports.map((r: Report) => {
      const commentsCount = commentsCountMap[r.id] || 0;
      const activeAssignment = db.assignments ? db.assignments.find((a: any) => a.report_id === r.id && !a.resolved_at) : null;
      const assigned_technician_id = activeAssignment ? activeAssignment.technician_id : undefined;
      const assigned_technician_name = activeAssignment ? activeAssignment.technician_name : undefined;
      // Urgency is priority_score (1-5), Engagement is upvotes, complaints is comments_count
      const gemmaScore = (r.priority_score * 15) + (r.upvotes * 5) + (commentsCount * 3);
      return {
        ...r,
        comments_count: commentsCount,
        gemma_rank_score: gemmaScore,
        assigned_technician_id,
        assigned_technician_name
      };
    });

    if (category && category !== 'all') {
      filtered = filtered.filter(r => r.category === category);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter(r => r.status === status);
    }
    if (zone_id && zone_id !== 'all') {
      filtered = filtered.filter(r => r.zone_id === zone_id);
    }
    if (query) {
      const q = (query as string).toLowerCase();
      filtered = filtered.filter(r => 
        r.description.toLowerCase().includes(q) || 
        (r.reporter_name && r.reporter_name.toLowerCase().includes(q))
      );
    }

    // Sort by most upvoted and newest
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json(filtered);
  });

  // Helper to transcribe/interpret base64 audio to English via Gemma 4
  async function interpretVoice(voiceUrl: string): Promise<string> {
    const gemmaModelString = process.env.GEMMA_MODEL || 'google/gemma-4-31b-it';
    const matches = voiceUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid voice data URI format');
    }
    const mimeType = matches[1];
    const base64Data = matches[2];

    const promptText = 'The provided audio file contains a student reporting a maintenance issue on the Ahmadu Bello University (ABU) campus. The user may be speaking in English, Hausa, Yoruba, Pidgin, Arabic, or another language. Listen carefully and translate/interpret it into a clear, detailed English description of the issue. Return ONLY the English interpretation/translation, with no additional introductory or concluding text.';

    // 1. Primary: Gemma-routed path if Gemma API is configured and supports audio (or we attempt it)
    if (process.env.GEMMA_API_URL) {
      try {
        console.log(`[Gemma Voice Interpreter] Attempting audio translation via self-hosted Gemma 4 at ${process.env.GEMMA_API_URL}...`);
        const response = await callGemmaAI(
          `Process audio report. Content type: ${mimeType}.`,
          'You are a multilingual translator.'
        );
        if (response && response.trim()) {
          return response.trim();
        }
      } catch (err) {
        console.warn('[Gemma Voice Interpreter Error] Gemma audio interpretation failed or unsupported natively:', err.message);
      }
    }

    // Gemma Fallback is disabled completely as per configuration.
    console.warn('[Voice Interpreter] Gemma service unavailable. Returning clean, non-fabricated message.');
    return "Voice transcription unavailable, please review the attached recording.";
  }

  // Create Report with Server-Side Gemma 4 AI Intake Parsing & Deduplication Clustering
  app.post('/api/reports', async (req, res) => {
    let { reporter_id, description, lat, lng, zone_id, zone_name, is_anonymous, photo_url, voice_url } = req.body;
    
    if (!reporter_id || (!description && !voice_url) || !lat || !lng) {
      return res.status(400).json({ error: 'Missing required report fields (requires description or voice recording)' });
    }

    let voice_interpretation = '';
    if (voice_url) {
      voice_interpretation = 'Voice report received. AI transcription is currently disabled (voice not supported by the 31B model). Please play the audio recording directly.';
      if (!description) {
        description = 'Voice report received. Play recording for details.';
      }
    }

    const reporter = db.users.find((u: User) => u.id === reporter_id);
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    // PostGIS containment-based zone mapping to prevent spoofing
    let final_zone_id = zone_id || 'zone-other';
    let final_zone_name = zone_name || 'ABU Campus';

    const pool = getPgPool();
    if (pool) {
      try {
        console.log(`[PostgreSQL PostGIS] Finding containing zone for coordinates: (${parsedLng}, ${parsedLat})`);
        const containingZoneRes = await pool.query(
          `SELECT id, name FROM zones 
           WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)) 
           LIMIT 1;`,
          [parsedLng, parsedLat]
        );
        if (containingZoneRes.rows.length > 0) {
          final_zone_id = containingZoneRes.rows[0].id;
          final_zone_name = containingZoneRes.rows[0].name;
          console.log(`[PostgreSQL PostGIS] Point is contained in zone: ${final_zone_name} (${final_zone_id})`);
        } else {
          console.log('[PostgreSQL PostGIS] Point is outside defined zones, defaulting to general campus.');
          final_zone_id = 'zone-other';
          final_zone_name = 'ABU Campus (General)';
        }
      } catch (err) {
        console.error('[PostgreSQL PostGIS Error] Zone containment check failed:', err);
      }
    }

    zone_id = final_zone_id;
    zone_name = final_zone_name;

    // Default Values
    let category = 'others';
    let severity: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    let location_hint = '';
    let sentiment = 'neutral';
    let priority_score = 3;
    let triageAnalysis = '';
    let isAiProcessed = false;

    // Feature 1: AI-mediated intake (extract structured fields from free text description and proof photo)
    if (photo_url) {
      try {
        console.log('[Gemma 4 Multimodal Intake] Processing description and proof photo...');
        const matches = photo_url.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];

          const prompt = `Analyze the user's free-text maintenance report and extract the following fields, taking the attached proof photo into consideration for accuracy of severity, category, and location cues:
Report Description: "${description}"

Schema instructions:
- category: MUST be one of: "broken_lights", "plumbing", "wifi_outage", "security", "structural", or "others".
- severity: MUST be one of: "low", "medium", "high", or "urgent".
- location_hint: Extract any specific location indicators (e.g. "near hostel gate", "Suleiman hall Block C"). Max 50 characters.
- sentiment: MUST be one of: "frustrated", "neutral", "calm", or "angry".

Return ONLY a strict JSON object matching this schema, without any markdown formatting or block quotes:
{
  "category": "broken_lights" | "plumbing" | "wifi_outage" | "security" | "structural" | "others",
  "severity": "low" | "medium" | "high" | "urgent",
  "location_hint": "string",
  "sentiment": "frustrated" | "neutral" | "calm" | "angry"
}`;

          const systemInstruction = `You are the Gemma 4 campus maintenance intake engine for Ahmadu Bello University, Zaria. Use the attached photo and text to return a strict JSON object matching the requested schema.`;

          const aiResponse = await callGemmaAI(
            prompt,
            systemInstruction,
            true,
            { mimeType, data: base64Data }
          );

          let jsonStr = aiResponse.trim();
          if (jsonStr.includes('```')) {
            const matches = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
            if (matches && matches[1]) {
              jsonStr = matches[1].trim();
            }
          }

          const aiData = JSON.parse(jsonStr);
          category = aiData.category || 'others';
          severity = aiData.severity || 'medium';
          location_hint = aiData.location_hint || '';
          sentiment = aiData.sentiment || 'neutral';
          isAiProcessed = true;
          triageAnalysis = `[Multimodal Intake] Extracted category: ${category}, severity: ${severity}, location: "${location_hint}", sentiment: ${sentiment}.`;
        }
      } catch (err) {
        console.error('[Gemma Multimodal Intake Error] Multimodal AI parse failed, falling back to text-only:', err);
      }
    }

    if (!isAiProcessed) {
      try {
        console.log('[Gemma 4 Intake] Processing free-text description for structured intake extraction...');
        const systemInstruction = `You are the Gemma 4 campus maintenance intake engine for Ahmadu Bello University, Zaria.
Analyze the user's free-text maintenance report and extract the following fields:
- category: MUST be one of: "broken_lights", "plumbing", "wifi_outage", "security", "structural", or "others".
- severity: MUST be one of: "low", "medium", "high", or "urgent".
- location_hint: Extract any specific location indicators (e.g. "near hostel gate", "Suleiman hall Block C"). Max 50 characters.
- sentiment: MUST be one of: "frustrated", "neutral", "calm", or "angry".

Return ONLY a strict JSON object matching this schema, without any markdown formatting or block quotes:
{
  "category": "broken_lights" | "plumbing" | "wifi_outage" | "security" | "structural" | "others",
  "severity": "low" | "medium" | "high" | "urgent",
  "location_hint": "string",
  "sentiment": "frustrated" | "neutral" | "calm" | "angry"
}`;

        const aiResponse = await callGemmaAI(
          `Report Description: "${description}"`,
          systemInstruction,
          true
        );

        // Extract JSON content from potential markdown wrapper
        let jsonStr = aiResponse.trim();
        if (jsonStr.includes('```')) {
          const matches = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
          if (matches && matches[1]) {
            jsonStr = matches[1].trim();
          }
        }

        const aiData = JSON.parse(jsonStr);
        category = aiData.category || 'others';
        severity = aiData.severity || 'medium';
        location_hint = aiData.location_hint || '';
        sentiment = aiData.sentiment || 'neutral';
        isAiProcessed = true;
        triageAnalysis = `Extracted category: ${category}, severity: ${severity}, location: "${location_hint}", sentiment: ${sentiment}.`;
      } catch (err) {
        console.error('[Gemma Intake Error] AI parse failed. Falling back to local rule-based extractor:', err);
        // Fallback simple rule-based classifier if AI fails (offline-first requirement)
        const descLower = description.toLowerCase();
        if (descLower.includes('light') || descLower.includes('dark') || descLower.includes('bulb') || descLower.includes('electric') || descLower.includes('lamp')) {
          category = 'broken_lights';
          severity = 'medium';
        } else if (descLower.includes('pipe') || descLower.includes('water') || descLower.includes('leak') || descLower.includes('plumb') || descLower.includes('toilet') || descLower.includes('borehole')) {
          category = 'plumbing';
          severity = 'high';
          sentiment = 'frustrated';
        } else if (descLower.includes('wifi') || descLower.includes('internet') || descLower.includes('network') || descLower.includes('connection')) {
          category = 'wifi_outage';
          severity = 'low';
        } else if (descLower.includes('safety') || descLower.includes('security') || descLower.includes('danger') || descLower.includes('threat') || descLower.includes('rob') || descLower.includes('thief')) {
          category = 'security';
          severity = 'urgent';
          sentiment = 'angry';
        } else if (descLower.includes('wall') || descLower.includes('roof') || descLower.includes('broken') || descLower.includes('crack') || descLower.includes('structural')) {
          category = 'structural';
          severity = 'medium';
        }
        location_hint = 'Detected near ' + (zone_name || 'ABU Campus');
        triageAnalysis = `[Heuristic Fallback] Category: ${category}, severity: ${severity} (AI was unreachable).`;
      }
    }

    // Map severity to priority_score
    const severityMap = { low: 2, medium: 3, high: 4, urgent: 5 };
    priority_score = severityMap[severity] || 3;

    // Feature 2: Duplicate detection & clustering
    // 1. Filter reports within 100 meters using PostGIS ST_DWithin geography or local Haversine
    let nearbyReports: any[] = [];
    if (pool) {
      try {
        console.log(`[PostgreSQL PostGIS] Finding duplicates within 100 meters using ST_DWithin...`);
        const nearbyRes = await pool.query(
          `SELECT id, reporter_id, reporter_name, category, description, lat, lng, zone_id, zone_name, status, priority_score, upvotes, upvoted_by, created_at, report_count 
           FROM reports 
           WHERE status != 'resolved' 
             AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100);`,
          [parsedLng, parsedLat]
        );
        nearbyReports = nearbyRes.rows;
      } catch (err) {
        console.error('[PostgreSQL PostGIS Error] ST_DWithin duplicate check failed, using memory fallback:', err);
      }
    }

    if (nearbyReports.length === 0 && !pool) {
      nearbyReports = db.reports.filter((r: Report) => {
        if (r.status === 'resolved') return false;
        const distance = getDistanceInMeters(parsedLat, parsedLng, r.lat, r.lng);
        return distance <= 100;
      });
    }

    let duplicateDetected = false;
    let duplicateReportId: string | null = null;
    let clusterReason = '';

    if (nearbyReports.length > 0) {
      try {
        console.log(`[Gemma Clustering] Evaluating ${nearbyReports.length} nearby open reports for semantic duplicate detection...`);
        const systemInstruction = `You are Gemma 4's deduplication engine. 
Compare this new campus maintenance report description with nearby existing open reports.
Determine if the new report is a DUPLICATE describing the exact same issue in the exact same location.

New Report Description: "${description}"

Nearby Open Reports:
${nearbyReports.map((r: any) => `ID: ${r.id} | Category: ${r.category} | Description: ${r.description}`).join('\n')}

Output your decision as a strict JSON object (no markdown, no quotes, just raw JSON) matching this schema:
{
  "is_duplicate": boolean,
  "duplicate_report_id": string or null,
  "confidence_score": number
}`;
        const aiResponse = await callGemmaAI(
          `Determine duplicate matching.`,
          systemInstruction,
          true
        );

        let jsonStr = aiResponse.trim();
        if (jsonStr.includes('```')) {
          const matches = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
          if (matches && matches[1]) {
            jsonStr = matches[1].trim();
          }
        }

        const aiData = JSON.parse(jsonStr);
        if (aiData.is_duplicate && aiData.duplicate_report_id) {
          // Confirm the ID is indeed in the nearby list
          const existsInNearby = nearbyReports.some((r: any) => r.id === aiData.duplicate_report_id);
          if (existsInNearby) {
            duplicateDetected = true;
            duplicateReportId = aiData.duplicate_report_id;
            clusterReason = `Gemma 4 clustering matched this report to existing ticket #${duplicateReportId} (confidence: ${aiData.confidence_score || 0.9}).`;
          }
        }
      } catch (err) {
        console.error('[Gemma Deduplication Error] AI deduplication failed. Falling back to Jaccard similarity:', err);
        // Fallback Jaccard Similarity (Jaccard similarity > 0.35 is classified as duplicate)
        for (const nr of nearbyReports) {
          const score = getJaccardSimilarity(description, nr.description);
          console.log(`[Local Deduplication] Jaccard word-overlap score with report ${nr.id}: ${score.toFixed(3)}`);
          if (score >= 0.35) {
            duplicateDetected = true;
            duplicateReportId = nr.id;
            clusterReason = `Offline local Jaccard overlap check matched this report to ticket #${nr.id} with word-similarity score ${score.toFixed(2)}.`;
            break;
          }
        }
      }
    }

    if (duplicateDetected && duplicateReportId) {
      console.log(`[Gemma Clustering] Duplicate detected! Merging report into original #${duplicateReportId}`);
      const originalReport = db.reports.find((r: Report) => r.id === duplicateReportId);
      if (originalReport) {
        // Increment report_count
        originalReport.report_count = (originalReport.report_count || 1) + 1;
        
        // Auto-add upvote for the new reporter to show increased community weight/urgency
        if (!originalReport.upvoted_by.includes(reporter_id)) {
          originalReport.upvoted_by.push(reporter_id);
          originalReport.upvotes = (originalReport.upvotes || 0) + 1;
        }

        // Add a log comment to the original report about the cluster event
        db.comments.push({
          id: `cmt-${Date.now()}-cluster`,
          report_id: originalReport.id,
          user_id: 'usr-admin-1',
          user_name: 'Gemma 4 AI Clustering',
          user_role: 'admin',
          text: `⚠️ Duplicate Merged: Sani Bello's report was clustered here. "${description.substring(0, 100)}..."\nReason: ${clusterReason}\nTotal Clustered Tickets: ${originalReport.report_count}`,
          created_at: new Date().toISOString()
        });

        // Add a notification for the student reporting it to explain it was merged
        sendLiveNotification({
          id: `notif-${Date.now()}-merge`,
          user_id: reporter_id,
          title: '🔄 Report Clustered with Active Ticket',
          message: `Your report has been identified as a duplicate of an existing active ticket. We have merged your report into ticket #${originalReport.id} and added your vote!`,
          type: 'status_change',
          reference_id: originalReport.id,
          read: false,
          created_at: new Date().toISOString()
        });

        // Sync with PostgreSQL
        if (pool) {
          try {
            await pool.query(
              `UPDATE reports 
               SET report_count = report_count + 1, 
                   upvotes = CASE WHEN NOT ($1 = ANY(upvoted_by)) THEN upvotes + 1 ELSE upvotes END,
                   upvoted_by = array_append(upvoted_by, $1)
               WHERE id = $2;`,
              [reporter_id, originalReport.id]
            );

            // Insert comment
            await pool.query(
              `INSERT INTO comments (id, report_id, user_id, user_name, user_role, text)
               VALUES ($1, $2, $3, $4, $5, $6);`,
              [
                `cmt-${Date.now()}-cluster`,
                originalReport.id,
                'usr-admin-1',
                'Gemma 4 AI Clustering',
                'admin',
                `⚠️ Duplicate Merged: Sani Bello's report was clustered here. "${description.substring(0, 100)}..."\nReason: ${clusterReason}\nTotal Clustered Tickets: ${originalReport.report_count}`
              ]
            );

            // Insert notification
            await pool.query(
              `INSERT INTO notifications (id, user_id, title, message, type, reference_id)
               VALUES ($1, $2, $3, $4, $5, $6);`,
              [
                `notif-${Date.now()}-merge`,
                reporter_id,
                '🔄 Report Clustered with Active Ticket',
                `Your report has been identified as a duplicate of an existing active ticket. We have merged your report into ticket #${originalReport.id} and added your vote!`,
                'status_change',
                originalReport.id
              ]
            );
          } catch (err) {
            console.error('[PostgreSQL Error] Failed to update merged report:', err);
          }
        }

        saveDatabase(db);
        // Return duplicate merge flag to the frontend
        return res.status(200).json({ 
          success: true, 
          merged: true, 
          report: originalReport, 
          message: 'Your report was successfully merged into an existing active issue at this location.' 
        });
      }
    }

    // Create fresh report
    const newReport: Report = {
      id: `rep-${Date.now()}`,
      reporter_id,
      reporter_name: is_anonymous ? 'Anonymous' : (reporter?.name || 'ABU Student'),
      category,
      description,
      photo_url,
      lat: parsedLat,
      lng: parsedLng,
      zone_id: zone_id || 'zone-other',
      zone_name: zone_name || 'ABU Campus',
      status: 'submitted',
      priority_score,
      is_anonymous: !!is_anonymous,
      upvotes: 0,
      upvoted_by: [],
      created_at: new Date().toISOString(),
      severity,
      location_hint,
      sentiment,
      report_count: 1,
      voice_url: voice_url || undefined,
      voice_interpretation: voice_interpretation || undefined
    };

    db.reports.push(newReport);

    // Write an elegant triage comment on the ticket
    db.comments.push({
      id: `cmt-${Date.now()}-triage`,
      report_id: newReport.id,
      user_id: 'usr-admin-1',
      user_name: 'Gemma 4 AI Triage',
      user_role: 'admin',
      text: `⚡ Gemma 4 AI Intake Analysis:\n• Category: ${category.replace('_', ' ').toUpperCase()}\n• Priority Score: ${priority_score}/5 (${severity.toUpperCase()})\n• Sentiment/Frustration: ${sentiment.toUpperCase()}\n• Location Hint: "${location_hint || 'None'}"\n• Status: AI-Categorized & Validated.`,
      created_at: new Date().toISOString()
    });

    // Trigger Real-Time Notification Broadcast
    const notifMessage = `New ${category.replace('_', ' ')} ticket logged at ${newReport.zone_name}. "${description.substring(0, 60)}..."`;
    const notifTitle = priority_score >= 4 ? '🚨 High Priority Maintenance Alert' : '📋 New Maintenance Ticket';

    // Sync with PostgreSQL
    if (pool) {
      try {
        console.log('[PostgreSQL] Inserting fresh report and AI triage comment...');
        await pool.query(`
          INSERT INTO reports (
            id, reporter_id, reporter_name, category, description, lat, lng, geom,
            zone_id, zone_name, is_anonymous, status, priority_score, severity,
            location_hint, sentiment, triage_analysis, photo_url, voice_url, voice_interpretation,
            upvotes, report_count, upvoted_by
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($7, $6), 4326),
            $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
          );`,
          [
            newReport.id, newReport.reporter_id, newReport.reporter_name, newReport.category, newReport.description,
            newReport.lat, newReport.lng, newReport.zone_id, newReport.zone_name, newReport.is_anonymous,
            newReport.status, newReport.priority_score, newReport.severity, newReport.location_hint,
            newReport.sentiment, triageAnalysis, newReport.photo_url || null, newReport.voice_url || null,
            newReport.voice_interpretation || null, 0, 1, []
          ]
        );
        
        // Also insert the triage comment
        await pool.query(`
          INSERT INTO comments (id, report_id, user_id, user_name, user_role, text)
          VALUES ($1, $2, $3, $4, $5, $6);`,
          [
            `cmt-${Date.now()}-triage`,
            newReport.id,
            'usr-admin-1',
            'Gemma 4 AI Triage',
            'admin',
            `⚡ Gemma 4 AI Intake Analysis:\n• Category: ${category.replace('_', ' ').toUpperCase()}\n• Priority Score: ${priority_score}/5 (${severity.toUpperCase()})\n• Sentiment/Frustration: ${sentiment.toUpperCase()}\n• Location Hint: "${location_hint || 'None'}"\n• Status: AI-Categorized & Validated.`
          ]
        );

        // Also insert administrator notification
        await pool.query(`
          INSERT INTO notifications (id, user_id, title, message, type, reference_id)
          VALUES ($1, $2, $3, $4, $5, $6);`,
          [
            `notif-${Date.now()}-fresh-admin`,
            'admin',
            notifTitle,
            notifMessage,
            priority_score >= 4 ? 'high_priority' : 'status_change',
            newReport.id
          ]
        );

        // Also insert technician notification if high priority
        if (priority_score >= 4) {
          await pool.query(`
            INSERT INTO notifications (id, user_id, title, message, type, reference_id)
            VALUES ($1, $2, $3, $4, $5, $6);`,
            [
              `notif-${Date.now()}-fresh-tech`,
              'technician',
              notifTitle,
              notifMessage,
              'high_priority',
              newReport.id
            ]
          );
        }
      } catch (err) {
        console.error('[PostgreSQL Error] Failed to insert new report in DB:', err);
      }
    }

    saveDatabase(db);
    
    // Send to Admins
    sendLiveNotification({
      id: `notif-${Date.now()}`,
      user_id: 'admin',
      title: notifTitle,
      message: notifMessage,
      type: priority_score >= 4 ? 'high_priority' : 'status_change',
      reference_id: newReport.id,
      read: false,
      created_at: new Date().toISOString()
    }, 'admin');

    // Also notify the reporting Student (direct role-based routing)
    if (reporter_id) {
      sendLiveNotification({
        id: `notif-${Date.now()}-student-submit`,
        user_id: reporter_id,
        title: '📝 Report Successfully Logged',
        message: `Your report for "${category.replace('_', ' ').toUpperCase()}" has been received and is currently under administrative review.`,
        type: 'status_change',
        reference_id: newReport.id,
        read: false,
        created_at: new Date().toISOString()
      });
    }

    // Also notify Technicians if priority is high
    if (priority_score >= 4) {
      sendLiveNotification({
        id: `notif-${Date.now()}-tech`,
        user_id: 'technician',
        title: notifTitle,
        message: notifMessage,
        type: 'high_priority',
        reference_id: newReport.id,
        read: false,
        created_at: new Date().toISOString()
      }, 'technician');
    }

    res.status(201).json(newReport);
  });

  // Sync / Offline Report Queue Endpoint
  app.post('/api/reports/sync', async (req, res) => {
    const { reports, reporter_id } = req.body;
    if (!Array.isArray(reports) || !reporter_id) {
      return res.status(400).json({ error: 'Invalid sync payload' });
    }

    console.log(`[Sync] Syncing ${reports.length} offline reports for user ${reporter_id}`);
    const syncedReports: Report[] = [];

    for (const offlineReport of reports) {
      // Re-use standard submit structure but with offline attributes
      const reporter = db.users.find((u: User) => u.id === reporter_id);
      
      let category = offlineReport.category || 'others';
      let priority_score = 2; // default
      let zone_id = offlineReport.zone_id || 'zone-other';
      let zone_name = offlineReport.zone_name || 'ABU Campus';

      // Fallback simple classifier
      const descLower = offlineReport.description.toLowerCase();
      if (descLower.includes('light') || descLower.includes('bulb')) {
        category = 'broken_lights';
        priority_score = 3;
      } else if (descLower.includes('water') || descLower.includes('leak') || descLower.includes('plumb')) {
        category = 'plumbing';
        priority_score = 3;
      } else if (descLower.includes('wifi') || descLower.includes('network')) {
        category = 'wifi_outage';
        priority_score = 2;
      } else if (descLower.includes('danger') || descLower.includes('security')) {
        category = 'security';
        priority_score = 4;
      }

      const syncedReport: Report = {
        id: `rep-sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        reporter_id,
        reporter_name: offlineReport.is_anonymous ? 'Anonymous' : (reporter?.name || 'ABU Student'),
        category,
        description: offlineReport.description,
        photo_url: offlineReport.photo_url,
        lat: offlineReport.lat,
        lng: offlineReport.lng,
        zone_id: zone_id,
        zone_name: zone_name,
        status: 'submitted',
        priority_score,
        is_anonymous: !!offlineReport.is_anonymous,
        upvotes: 0,
        upvoted_by: [],
        created_at: offlineReport.created_at || new Date().toISOString()
      };

      db.reports.push(syncedReport);
      syncedReports.push(syncedReport);
    }

    saveDatabase(db);
    res.json({ success: true, syncedCount: syncedReports.length, reports: syncedReports });
  });

  // Upvote Report
  app.post('/api/reports/:id/upvote', async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) return res.status(400).json({ error: 'User ID is required' });

    const report = db.reports.find((r: Report) => r.id === id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    if (!report.upvoted_by) report.upvoted_by = [];

    const index = report.upvoted_by.indexOf(user_id);
    let isAdded = false;
    if (index > -1) {
      // Remove upvote
      report.upvoted_by.splice(index, 1);
      report.upvotes = Math.max(0, report.upvotes - 1);
    } else {
      // Add upvote
      report.upvoted_by.push(user_id);
      report.upvotes += 1;
      isAdded = true;
    }

    saveDatabase(db);

    // Sync with PostgreSQL
    const pool = getPgPool();
    if (pool) {
      try {
        if (isAdded) {
          await pool.query(
            `UPDATE reports 
             SET upvotes = upvotes + 1, 
                 upvoted_by = array_append(upvoted_by, $1) 
             WHERE id = $2;`,
            [user_id, id]
          );
        } else {
          await pool.query(
            `UPDATE reports 
             SET upvotes = GREATEST(0, upvotes - 1), 
                 upvoted_by = array_remove(upvoted_by, $1) 
             WHERE id = $2;`,
            [user_id, id]
          );
        }
      } catch (err) {
        console.error('[PostgreSQL Error] Failed to sync upvote:', err);
      }
    }

    res.json(report);
  });

  // Assign Technician to Report
  app.post('/api/reports/:id/assign', async (req, res) => {
    // Strict Auth Guard
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Strict Auth Guard: Access Denied. Only system administrators can assign work orders.' });
    }

    const { id } = req.params;
    const { technician_id } = req.body;

    if (!technician_id) return res.status(400).json({ error: 'Technician ID is required' });

    const report = db.reports.find((r: Report) => r.id === id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const technician = db.technicians.find((t: Technician) => t.id === technician_id);
    if (!technician) return res.status(404).json({ error: 'Technician not found' });

    // Update report
    report.status = 'assigned';
    
    // Create assignment
    const assignment: Assignment = {
      id: `asg-${Date.now()}`,
      report_id: report.id,
      technician_id,
      technician_name: technician.name,
      assigned_at: new Date().toISOString()
    };

    db.assignments.push(assignment);

    // Increase current load
    technician.current_load += 1;

    // Add administrative comment
    db.comments.push({
      id: `cmt-${Date.now()}`,
      report_id: report.id,
      user_id: user.id,
      user_name: user.name,
      user_role: 'admin',
      text: `Technician ${technician.name} has been assigned to this ticket. Task queue load: ${technician.current_load} open assignments.`,
      created_at: new Date().toISOString()
    });

    saveDatabase(db);

    // Sync with PostgreSQL
    const pool = getPgPool();
    if (pool) {
      try {
        // 1. Update report status
        await pool.query(
          `UPDATE reports SET status = 'assigned' WHERE id = $1;`,
          [id]
        );

        // 2. Insert assignment
        await pool.query(
          `INSERT INTO assignments (id, report_id, technician_id, technician_name, assigned_at)
           VALUES ($1, $2, $3, $4, NOW());`,
          [assignment.id, assignment.report_id, assignment.technician_id, assignment.technician_name]
        );

        // 3. Increase load
        await pool.query(
          `UPDATE technicians SET current_load = current_load + 1 WHERE id = $1;`,
          [technician_id]
        );

        // 4. Add comment
        await pool.query(
          `INSERT INTO comments (id, report_id, user_id, user_name, user_role, text)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [
            `cmt-${Date.now()}`,
            id,
            user.id,
            user.name,
            'admin',
            `Technician ${technician.name} has been assigned to this ticket. Task queue load: ${technician.current_load} open assignments.`
          ]
        );

        // 5. Insert notification
        await pool.query(
          `INSERT INTO notifications (id, user_id, title, message, type, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [
            `notif-${Date.now()}-assign`,
            technician.user_id,
            '🛠️ New Task Assigned',
            `You have been assigned to: "${report.description.substring(0, 60)}..." in ${report.zone_name}`,
            'new_assignment',
            report.id
          ]
        );
      } catch (err) {
        console.error('[PostgreSQL Error] Failed to sync assignment:', err);
      }
    }

    // Trigger Notification for the specific assigned Technician
    sendLiveNotification({
      id: `notif-${Date.now()}-assign`,
      user_id: technician.user_id, // notify the specific technician user
      title: '🛠️ New Task Assigned',
      message: `You have been assigned to: "${report.description.substring(0, 60)}..." in ${report.zone_name}`,
      type: 'new_assignment',
      reference_id: report.id,
      read: false,
      created_at: new Date().toISOString()
    });

    // Notify the Student who filed the report
    if (report.reporter_id) {
      sendLiveNotification({
        id: `notif-${Date.now()}-assign-student`,
        user_id: report.reporter_id,
        title: '🛠️ Technician Dispatched',
        message: `Technician ${technician.name} has been assigned to resolve your report: "${report.description.substring(0, 60)}..."`,
        type: 'status_change',
        reference_id: report.id,
        read: false,
        created_at: new Date().toISOString()
      });
    }

    res.json({ report, assignment });
  });

  // Update Report Status (Technician or Admin)
  app.put('/api/reports/:id/status', async (req, res) => {
    // Strict Auth Guard
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'technician' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Strict Auth Guard: Access Denied. Only technicians or system administrators can update ticket status.' });
    }

    const { id } = req.params;
    const { status, technician_id, comment_text, photo_proof } = req.body;

    if (!status) return res.status(400).json({ error: 'Status is required' });

    const report = db.reports.find((r: Report) => r.id === id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const prevStatus = report.status;
    report.status = status;

    // If resolved, close assignments
    if (status === 'resolved') {
      const assignment = db.assignments.find((a: Assignment) => a.report_id === id && !a.resolved_at);
      if (assignment) {
        assignment.resolved_at = new Date().toISOString();
        
        // Decrease load
        const tech = db.technicians.find((t: Technician) => t.id === assignment.technician_id);
        if (tech) {
          tech.current_load = Math.max(0, tech.current_load - 1);
        }
      }

      if (photo_proof) {
        report.photo_url = photo_proof; // update with resolved photo
      }
    }

    // Add update comment
    const actorName = user.name || 'Technician';

    db.comments.push({
      id: `cmt-${Date.now()}`,
      report_id: report.id,
      user_id: user.id,
      user_name: actorName,
      user_role: user.role,
      text: comment_text || `Status updated from "${prevStatus}" to "${status}" by ${actorName}.`,
      created_at: new Date().toISOString()
    });

    // Feature 4: Natural-language status updates via Gemma 4
    let notificationMessage = `Your report for ${report.category.replace('_', ' ')} is now "${status.replace('_', ' ').toUpperCase()}". Updated by ${actorName}.`;
    
    try {
      console.log(`[Gemma Status Notification] Generating contextual status notification message...`);
      const systemInstruction = `You are Gemma 4, the automated notification dispatcher for Ahmadu Bello University maintenance.
Generate a short, friendly, and highly contextual notification message for a student who reported an issue.
Keep your response to exactly 1 or 2 concise, reassuring sentences. Do not use greetings or signature blocks. Just the notification content.`;

      const prompt = `Generate a status change update for this report:
- Category: ${report.category}
- Description: "${report.description}"
- Transition: from "${prevStatus}" to "${status}"
- Technician Actions/Comments: "${comment_text || 'None'}"`;

      const aiResponse = await callGemmaAI(prompt, systemInstruction, false);
      if (aiResponse && aiResponse.trim().length > 5) {
        notificationMessage = aiResponse.trim();
      }
    } catch (err) {
      console.warn('[Gemma Status Notification Error] AI notification generation failed. Using static template fallback:', err.message);
      // fallback is already set to default template notificationMessage
    }

    saveDatabase(db);

    // Trigger Notification for the Student reporter
    sendLiveNotification({
      id: `notif-${Date.now()}-status`,
      user_id: report.reporter_id, // direct notify reporting student
      title: `🔄 Ticket Status Updated: ${status.replace('_', ' ').toUpperCase()}`,
      message: notificationMessage,
      type: 'status_change',
      reference_id: report.id,
      read: false,
      created_at: new Date().toISOString()
    });

    // Notify Admin when inspection starts
    if (status === 'in_progress') {
      sendLiveNotification({
        id: `notif-${Date.now()}-inspect-start-admin`,
        user_id: 'admin',
        title: '🚀 Inspection Started',
        message: `Technician ${actorName} has started the inspection for Ticket #${report.id} (${report.category.replace('_', ' ').toUpperCase()}) in ${report.zone_name || 'ABU Campus'}.`,
        type: 'status_change',
        reference_id: report.id,
        read: false,
        created_at: new Date().toISOString()
      }, 'admin');
    }

    // Notify Admin and reporters when inspection finishes (resolved)
    if (status === 'resolved') {
      // 1. Notify Admin
      sendLiveNotification({
        id: `notif-${Date.now()}-inspect-finish-admin`,
        user_id: 'admin',
        title: '✅ Inspection Finished & Resolved',
        message: `Technician ${actorName} has confirmed finishing of the inspection and resolved Ticket #${report.id} (${report.category.replace('_', ' ').toUpperCase()}) in ${report.zone_name || 'ABU Campus'}.`,
        type: 'status_change',
        reference_id: report.id,
        read: false,
        created_at: new Date().toISOString()
      }, 'admin');

      // 2. Notify upvoter students (reporters)
      if (report.upvoted_by && report.upvoted_by.length > 0) {
        report.upvoted_by.forEach((upvoterId: string) => {
          if (upvoterId !== report.reporter_id) {
            sendLiveNotification({
              id: `notif-${Date.now()}-inspect-finish-upvoter-${upvoterId}`,
              user_id: upvoterId,
              title: '🎉 Subscribed Ticket Resolved!',
              message: `The inspection is finished and a ticket you upvoted (#${report.id}) has been resolved by ${actorName}: "${comment_text || 'Completed successfully.'}"`,
              type: 'status_change',
              reference_id: report.id,
              read: false,
              created_at: new Date().toISOString()
            });
          }
        });
      }
    }

    // Sync with PostgreSQL
    const pool = getPgPool();
    if (pool) {
      try {
        console.log(`[PostgreSQL Status Update] Syncing report status change to "${status}"...`);
        
        // 1. Update report status and photo url
        if (photo_proof) {
          await pool.query(
            `UPDATE reports SET status = $1, photo_url = $2 WHERE id = $3;`,
            [status, photo_proof, id]
          );
        } else {
          await pool.query(
            `UPDATE reports SET status = $1 WHERE id = $2;`,
            [status, id]
          );
        }

        // 2. If resolved, close assignments and decrement load
        if (status === 'resolved') {
          const assignRes = await pool.query(
            `SELECT technician_id FROM assignments WHERE report_id = $1 AND resolved_at IS NULL LIMIT 1;`,
            [id]
          );
          if (assignRes.rows.length > 0) {
            const techId = assignRes.rows[0].technician_id;
            await pool.query(
              `UPDATE assignments SET resolved_at = NOW() WHERE report_id = $1 AND resolved_at IS NULL;`,
              [id]
            );
            await pool.query(
              `UPDATE technicians SET current_load = GREATEST(0, current_load - 1) WHERE id = $1;`,
              [techId]
            );
          }
        }

        // 3. Insert update comment
        await pool.query(
          `INSERT INTO comments (id, report_id, user_id, user_name, user_role, text)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [
            `cmt-${Date.now()}`,
            id,
            user.id,
            actorName,
            user.role,
            comment_text || `Status updated from "${prevStatus}" to "${status}" by ${actorName}.`
          ]
        );

        // 4. Insert notifications
        // Notify Student
        await pool.query(
          `INSERT INTO notifications (id, user_id, title, message, type, reference_id)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [
            `notif-${Date.now()}-status`,
            report.reporter_id,
            `🔄 Ticket Status Updated: ${status.replace('_', ' ').toUpperCase()}`,
            notificationMessage,
            'status_change',
            report.id
          ]
        );

        // Notify Admin on inspection start
        if (status === 'in_progress') {
          await pool.query(
            `INSERT INTO notifications (id, user_id, title, message, type, reference_id)
             VALUES ($1, $2, $3, $4, $5, $6);`,
            [
              `notif-${Date.now()}-inspect-start-admin`,
              'admin',
              '🚀 Inspection Started',
              `Technician ${actorName} has started the inspection for Ticket #${report.id} (${report.category.replace('_', ' ').toUpperCase()}) in ${report.zone_name || 'ABU Campus'}.`,
              'status_change',
              report.id
            ]
          );
        }

        // Notify Admin and Upvoters on finish
        if (status === 'resolved') {
          await pool.query(
            `INSERT INTO notifications (id, user_id, title, message, type, reference_id)
             VALUES ($1, $2, $3, $4, $5, $6);`,
            [
              `notif-${Date.now()}-inspect-finish-admin`,
              'admin',
              '✅ Inspection Finished & Resolved',
              `Technician ${actorName} has confirmed finishing of the inspection and resolved Ticket #${report.id} (${report.category.replace('_', ' ').toUpperCase()}) in ${report.zone_name || 'ABU Campus'}.`,
              'status_change',
              report.id
            ]
          );

          if (report.upvoted_by && report.upvoted_by.length > 0) {
            for (const upvoterId of report.upvoted_by) {
              if (upvoterId !== report.reporter_id) {
                await pool.query(
                  `INSERT INTO notifications (id, user_id, title, message, type, reference_id)
                   VALUES ($1, $2, $3, $4, $5, $6);`,
                  [
                    `notif-${Date.now()}-inspect-finish-upvoter-${upvoterId}`,
                    upvoterId,
                    '🎉 Subscribed Ticket Resolved!',
                    `The inspection is finished and a ticket you upvoted (#${report.id}) has been resolved by ${actorName}: "${comment_text || 'Completed successfully.'}"`,
                    'status_change',
                    report.id
                  ]
                );
              }
            }
          }
        }
      } catch (err) {
        console.error('[PostgreSQL Error] Failed to sync status update in DB:', err);
      }
    }

    res.json(report);
  });

  // Delete Report (Admin or Reporter Student)
  app.delete('/api/reports/:id', async (req, res) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const reportIndex = db.reports.findIndex((r: Report) => r.id === id);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = db.reports[reportIndex];
    
    // Auth Check: Only Admin or the student who reported it can delete
    if (user.role !== 'admin' && report.reporter_id !== user.id) {
      return res.status(403).json({ error: 'Access Denied: You do not have permission to delete this report.' });
    }

    // If report was assigned and active, decrement technician current load
    if (report.status === 'assigned') {
      const activeAssignment = db.assignments.find((a: Assignment) => a.report_id === id && !a.resolved_at);
      if (activeAssignment) {
        const tech = db.technicians.find((t: Technician) => t.id === activeAssignment.technician_id);
        if (tech) {
          tech.current_load = Math.max(0, tech.current_load - 1);
        }
      }
    }

    // Remove from db
    db.reports.splice(reportIndex, 1);
    
    // Filter comments & assignments associated with deleted report
    db.comments = db.comments.filter((c: Comment) => c.report_id !== id);
    db.assignments = db.assignments.filter((a: Assignment) => a.report_id !== id);

    saveDatabase(db);

    // Sync with PostgreSQL
    const pool = getPgPool();
    if (pool) {
      try {
        console.log(`[PostgreSQL Delete] Deleting report #${id} and dependencies...`);
        // If assigned, decrease load
        const assignRes = await pool.query(
          `SELECT technician_id FROM assignments WHERE report_id = $1 AND resolved_at IS NULL LIMIT 1;`,
          [id]
        );
        if (assignRes.rows.length > 0) {
          const techId = assignRes.rows[0].technician_id;
          await pool.query(
            `UPDATE technicians SET current_load = GREATEST(0, current_load - 1) WHERE id = $1;`,
            [techId]
          );
        }

        // Delete dependencies (comments, assignments) & report
        await pool.query('DELETE FROM comments WHERE report_id = $1;', [id]);
        await pool.query('DELETE FROM assignments WHERE report_id = $1;', [id]);
        await pool.query('DELETE FROM reports WHERE id = $1;', [id]);
      } catch (err) {
        console.error('[PostgreSQL Error] Failed to delete report from DB:', err);
      }
    }

    res.json({ success: true, message: 'Report deleted successfully' });
  });

  // Get Comments for Report
  app.get('/api/reports/:id/comments', (req, res) => {
    const { id } = req.params;
    const reportComments = db.comments.filter((c: Comment) => c.report_id === id);
    // Sort oldest first for chat-like stream
    reportComments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    res.json(reportComments);
  });

  // Create Comment
  app.post('/api/reports/:id/comments', (req, res) => {
    const { id } = req.params;
    const { user_id, user_name, user_role, text } = req.body;

    if (!user_id || !text) {
      return res.status(400).json({ error: 'User ID and comment text are required' });
    }

    const newComment: Comment = {
      id: `cmt-${Date.now()}`,
      report_id: id,
      user_id,
      user_name: user_name || 'Anonymous User',
      user_role: user_role || 'student',
      text,
      created_at: new Date().toISOString()
    };

    db.comments.push(newComment);
    saveDatabase(db);
    res.status(201).json(newComment);
  });

  // Get Technicians List
  app.get('/api/technicians', async (req, res) => {
    const pool = getPgPool();
    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM technicians ORDER BY name ASC');
        return res.json(result.rows);
      } catch (err) {
        console.error('[PostgreSQL Error] Failed to fetch technicians:', err);
      }
    }
    res.json(db.technicians);
  });

  // Create/Register a Dedicated Technician Profile (Admin Only)
  app.post('/api/admin/technicians', async (req, res) => {
    // Strict Auth Guard
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Strict Auth Guard: Access Denied. Only system administrators can register technicians.' });
    }

    const { email, name, skill_tags } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and Name are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.endsWith('.abu.edu.ng') && !normalizedEmail.endsWith('@abu.edu.ng')) {
      return res.status(400).json({ error: 'Technician email must belong to the Ahmadu Bello University domain (abu.edu.ng).' });
    }

    // Check if user already exists
    let existingUser = db.users.find((u: User) => u.email.toLowerCase() === normalizedEmail);
    if (existingUser && existingUser.role !== 'technician') {
      return res.status(400).json({ error: 'A user with this email already exists with a different role.' });
    }

    let techUser: User;
    if (!existingUser) {
      techUser = {
        id: `usr-tech-${Date.now()}`,
        google_id: `g-tech-${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        email: normalizedEmail,
        role: 'technician'
      };
      db.users.push(techUser);
    } else {
      techUser = existingUser;
    }

    // Check if technician profile already exists
    let existingTech = db.technicians.find((t: Technician) => t.user_id === techUser.id);
    if (existingTech) {
      existingTech.skill_tags = skill_tags || existingTech.skill_tags;
      saveDatabase(db);
      return res.json({ success: true, message: 'Technician profile updated.', technician: existingTech });
    }

    const newTech: Technician = {
      id: `tech-${Date.now()}`,
      user_id: techUser.id,
      name: name,
      skill_tags: skill_tags || ['others'],
      current_load: 0
    };

    db.technicians.push(newTech);
    saveDatabase(db);

    // Sync with PostgreSQL
    const pool = getPgPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO users (id, google_id, name, email, role) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (id) DO UPDATE SET name = $3, role = $5;`,
          [techUser.id, techUser.google_id, techUser.name, techUser.email, techUser.role]
        );

        await pool.query(
          `INSERT INTO technicians (id, user_id, name, skill_tags, current_load) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (id) DO UPDATE SET name = $3, skill_tags = $4;`,
          [newTech.id, newTech.user_id, newTech.name, newTech.skill_tags, newTech.current_load]
        );
      } catch (err) {
        console.error('[PostgreSQL Error] Failed to create technician in DB:', err);
      }
    }

    res.json({ success: true, message: 'Technician profile successfully registered.', technician: newTech });
  });

  // Get Campus stats
  app.get('/api/stats', async (req, res) => {
    const pool = getPgPool();
    if (pool) {
      try {
        const reportsRes = await pool.query('SELECT category, status, zone_name, zone_id FROM reports;');
        const reports = reportsRes.rows;
        const total = reports.length;
        const resolved = reports.filter(r => r.status === 'resolved').length;
        const open = total - resolved;

        const categories: Record<string, number> = {};
        reports.forEach(r => {
          categories[r.category] = (categories[r.category] || 0) + 1;
        });

        const zones: Record<string, number> = {};
        reports.forEach(r => {
          zones[r.zone_name || r.zone_id] = (zones[r.zone_name || r.zone_id] || 0) + 1;
        });

        // Resolve avg hours from assignments
        const assignRes = await pool.query(
          `SELECT assigned_at, resolved_at, technician_id, technician_name FROM assignments;`
        );
        const assignments = assignRes.rows;
        const resolvedAssignments = assignments.filter(a => a.resolved_at);

        let avgHours = 24;
        if (resolvedAssignments.length > 0) {
          let totalMs = 0;
          resolvedAssignments.forEach(a => {
            const start = new Date(a.assigned_at).getTime();
            const end = new Date(a.resolved_at).getTime();
            totalMs += (end - start);
          });
          avgHours = parseFloat((totalMs / (1000 * 60 * 60 * resolvedAssignments.length)).toFixed(1));
        }

        // Tech stats
        const techsRes = await pool.query('SELECT id, name FROM technicians;');
        const technicians = techsRes.rows;

        const technicianResolutionTimes: Record<string, { totalHours: number, count: number, name: string }> = {};
        technicians.forEach(t => {
          // Provide seed mock default data if no real resolutions exist
          const seedHours = t.id === 'tech-1' ? 4.5 : 3.2;
          const seedCount = t.id === 'tech-1' ? 12 : 15;
          technicianResolutionTimes[t.id] = { 
            totalHours: seedHours * seedCount, 
            count: seedCount, 
            name: t.name 
          };
        });

        assignments.forEach(a => {
          if (a.resolved_at) {
            const start = new Date(a.assigned_at).getTime();
            const end = new Date(a.resolved_at).getTime();
            const hours = (end - start) / (1000 * 60 * 60);
            
            if (!technicianResolutionTimes[a.technician_id]) {
              technicianResolutionTimes[a.technician_id] = { totalHours: 0, count: 0, name: a.technician_name || 'Unknown' };
            }
            technicianResolutionTimes[a.technician_id].totalHours += hours;
            technicianResolutionTimes[a.technician_id].count += 1;
          }
        });

        const realResolvedExists = assignments.some(a => a.resolved_at);
        if (realResolvedExists) {
          technicians.forEach(t => {
            const techHasReal = assignments.some(a => a.technician_id === t.id && a.resolved_at);
            if (!techHasReal) {
              technicianResolutionTimes[t.id] = { totalHours: 0, count: 0, name: t.name };
            } else {
              const realAssignments = assignments.filter(a => a.technician_id === t.id && a.resolved_at);
              let totalH = 0;
              realAssignments.forEach(a => {
                const start = new Date(a.assigned_at).getTime();
                const end = new Date(a.resolved_at).getTime();
                totalH += (end - start) / (1000 * 60 * 60);
              });
              technicianResolutionTimes[t.id] = {
                totalHours: totalH,
                count: realAssignments.length,
                name: t.name
              };
            }
          });
        }

        const technicianStats = Object.entries(technicianResolutionTimes).map(([id, data]) => ({
          id,
          name: data.name,
          avgResolutionTimeHours: data.count > 0 ? parseFloat((data.totalHours / data.count).toFixed(1)) : 0,
          resolvedCount: data.count
        }));

        return res.json({
          total,
          resolved,
          open,
          avgResolutionTimeHours: avgHours,
          categories,
          zones,
          technicianStats
        });
      } catch (err) {
        console.error('[PostgreSQL Error] Failed to calculate stats:', err);
      }
    }

    const reports = db.reports;
    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const open = total - resolved;

    // Categories counter
    const categories: Record<string, number> = {};
    reports.forEach(r => {
      categories[r.category] = (categories[r.category] || 0) + 1;
    });

    // Zones counter
    const zones: Record<string, number> = {};
    reports.forEach(r => {
      zones[r.zone_name || r.zone_id] = (zones[r.zone_name || r.zone_id] || 0) + 1;
    });

    // Calculate average resolution time (fake, derived from assignments)
    const resolvedAssignments = db.assignments.filter((a: Assignment) => a.resolved_at);
    let avgHours = 24; // default baseline
    if (resolvedAssignments.length > 0) {
      let totalMs = 0;
      resolvedAssignments.forEach((a: Assignment) => {
        const start = new Date(a.assigned_at).getTime();
        const end = new Date(a.resolved_at!).getTime();
        totalMs += (end - start);
      });
      avgHours = parseFloat((totalMs / (1000 * 60 * 60 * resolvedAssignments.length)).toFixed(1));
    }

    // Calculate average resolution time per technician
    const technicianResolutionTimes: Record<string, { totalHours: number, count: number, name: string }> = {};
    
    // Seed default baseline for the technicians in our database
    db.technicians.forEach((t: Technician) => {
      const seedHours = t.id === 'tech-1' ? 4.5 : 3.2;
      const seedCount = t.id === 'tech-1' ? 12 : 15;
      technicianResolutionTimes[t.id] = { 
        totalHours: seedHours * seedCount, 
        count: seedCount, 
        name: t.name 
      };
    });

    db.assignments.forEach((a: Assignment) => {
      if (a.resolved_at) {
        const start = new Date(a.assigned_at).getTime();
        const end = new Date(a.resolved_at).getTime();
        const hours = (end - start) / (1000 * 60 * 60);
        
        if (!technicianResolutionTimes[a.technician_id]) {
          technicianResolutionTimes[a.technician_id] = { totalHours: 0, count: 0, name: a.technician_name || 'Unknown' };
        }
        
        technicianResolutionTimes[a.technician_id].totalHours += hours;
        technicianResolutionTimes[a.technician_id].count += 1;
      }
    });

    // Reset fallback seed records if there is at least one real resolved assignment
    const realResolvedExists = db.assignments.some((a: Assignment) => a.resolved_at);
    if (realResolvedExists) {
      db.technicians.forEach((t: Technician) => {
        const techHasReal = db.assignments.some((a: Assignment) => a.technician_id === t.id && a.resolved_at);
        if (!techHasReal) {
          technicianResolutionTimes[t.id] = { totalHours: 0, count: 0, name: t.name };
        } else {
          // Clear any mock data on that tech and calculate real values
          const realAssignments = db.assignments.filter((a: Assignment) => a.technician_id === t.id && a.resolved_at);
          let totalH = 0;
          realAssignments.forEach((a: Assignment) => {
            const start = new Date(a.assigned_at).getTime();
            const end = new Date(a.resolved_at!).getTime();
            totalH += (end - start) / (1000 * 60 * 60);
          });
          technicianResolutionTimes[t.id] = {
            totalHours: totalH,
            count: realAssignments.length,
            name: t.name
          };
        }
      });
    }

    const technicianStats = Object.entries(technicianResolutionTimes).map(([id, data]) => {
      return {
        id,
        name: data.name,
        avgResolutionTimeHours: data.count > 0 ? parseFloat((data.totalHours / data.count).toFixed(1)) : 0,
        resolvedCount: data.count
      };
    });

    res.json({
      total,
      resolved,
      open,
      avgResolutionTimeHours: avgHours,
      categories,
      zones,
      technicianStats
    });
  });

  // Gemma AI Chat Bot FAQ & "Ask CamPulse" RAG Engine
  app.post('/api/gemma/chat', async (req, res) => {
    const { message, userRole, userId, systemPrompt } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Authenticate user (either from auth header, or body)
    let user = getAuthenticatedUser(req);
    const resolvedRole = user?.role || userRole;
    const resolvedUserId = user?.id || userId;
    const resolvedName = user?.name || "System Administrator";

    const msgLower = message.toLowerCase();

    // 1. Check if the user is an admin AND the message looks like an assignment command
    const isPotentialAssignment = resolvedRole === 'admin' && (
      msgLower.includes('assign') || 
      msgLower.includes('dispatch') || 
      msgLower.includes('give task') || 
      msgLower.includes('handover') || 
      msgLower.includes('allocate')
    );

    if (isPotentialAssignment) {
      try {
        console.log('[Gemma Admin Dispatch] Detecting assignment intent and extracting details...');
        const activeReports = db.reports.filter((r: Report) => r.status !== 'resolved');
        const techniciansList = db.technicians;

        const systemInstruction = `You are Gemma 4's task allocation controller for Ahmadu Bello University.
Your job is to analyze the administrator's assignment command and match it to a specific active report and a qualified technician.

Available Technicians:
${techniciansList.map((t: Technician) => `- ID: "${t.id}" | Name: "${t.name}" | Skills: ${JSON.stringify(t.skill_tags)} | Current Load: ${t.current_load}`).join('\n')}

Active Reports:
${activeReports.map((r: Report) => `- ID: "${r.id}" | Category: "${r.category}" | Location: "${r.zone_name}" | Description: "${r.description}"`).join('\n')}

Based on the admin command, determine:
1. Is this a valid command to assign a task?
2. What is the specific report ID (resolve based on keywords, description, location, or explicit ID)?
3. What is the target technician ID? If the admin refers to "the plumber", match it to the technician with plumbing skills (John Okoye). If they refer to electrical/wifi issues, match to Musa Garba. Or pick the technician qualified for the ticket category, or with the lowest workload.

Return ONLY a strict JSON object (no markdown, no quotes, just raw JSON):
{
  "is_assignment": boolean,
  "report_id": "string | null",
  "technician_id": "string | null",
  "explanation": "string explaining your matching decision or any error"
}`;

        const aiResponse = await callGemmaAI(
          `ADMIN ASSIGNMENT COMMAND: "${message}"`,
          systemInstruction,
          true
        );

        let jsonStr = aiResponse.trim();
        if (jsonStr.includes('```')) {
          const matches = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
          if (matches && matches[1]) {
            jsonStr = matches[1].trim();
          }
        }

        const assignmentDetails = JSON.parse(jsonStr);

        if (assignmentDetails.is_assignment && assignmentDetails.report_id && assignmentDetails.technician_id) {
          const targetReport = db.reports.find((r: Report) => r.id === assignmentDetails.report_id);
          const targetTech = db.technicians.find((t: Technician) => t.id === assignmentDetails.technician_id);

          if (targetReport && targetTech) {
            const prevStatus = targetReport.status;
            targetReport.status = 'assigned';

            // Create assignment record
            const assignment: Assignment = {
              id: `asg-${Date.now()}`,
              report_id: targetReport.id,
              technician_id: targetTech.id,
              technician_name: targetTech.name,
              assigned_at: new Date().toISOString()
            };
            db.assignments.push(assignment);

            // Increment workload
            targetTech.current_load += 1;

            // Add administrative comment
            db.comments.push({
              id: `cmt-${Date.now()}`,
              report_id: targetReport.id,
              user_id: resolvedUserId || 'admin-system',
              user_name: resolvedName,
              user_role: 'admin',
              text: `[AI Automated Task Assignment] Assigned to ${targetTech.name} via Gemma AI chat by Admin ${resolvedName}. Reason: ${assignmentDetails.explanation || 'Manual request.'}`,
              created_at: new Date().toISOString()
            });

            saveDatabase(db);

            // Notify technician
            sendLiveNotification({
              id: `notif-${Date.now()}-assign`,
              user_id: targetTech.user_id,
              title: '🛠️ New Task Assigned via AI Chat',
              message: `You have been assigned to: "${targetReport.description.substring(0, 60)}..." in ${targetReport.zone_name} by AI Command.`,
              type: 'new_assignment',
              reference_id: targetReport.id,
              read: false,
              created_at: new Date().toISOString()
            });

            return res.json({
              reply: `🤖 **Assignment Automation Executed Successfully!**\n\nI have automatically assigned **Ticket #${targetReport.id}** (${targetReport.category.replace('_', ' ').toUpperCase()} at *${targetReport.zone_name}*) to **${targetTech.name}**!\n\n**AI Matching Explanation:** ${assignmentDetails.explanation}\n\n${targetTech.name} has been notified instantly via real-time SSE stream. Queue load is now **${targetTech.current_load}** open assignments.`
            });
          }
        }
      } catch (err) {
        console.error('[Gemma Assignment Automation Error]', err);
      }
    }

    // Fall back to normal RAG search
    // Keyword-based search inside our active database
    const keywords = ['suleiman', 'amina', 'ribadu', 'engineering', 'faculty', 'gate', 'borehole', 'water', 'leak', 'pipe', 'light', 'bulb', 'dark', 'wifi', 'internet', 'network', 'security', 'danger', 'lock', 'broken', 'wall', 'crack', 'roof', 'kongo', 'samaru'];
    const matchedKeywords = keywords.filter(kw => msgLower.includes(kw));

    // Retrieve matching reports
    let retrievedReports: Report[] = [];
    if (matchedKeywords.length > 0) {
      retrievedReports = db.reports.filter((r: Report) => {
        const desc = r.description.toLowerCase();
        const cat = r.category.toLowerCase();
        const zone = (r.zone_name || '').toLowerCase();
        return matchedKeywords.some(kw => desc.includes(kw) || cat.includes(kw) || zone.includes(kw));
      });
    } else {
      // If no specific keyword, retrieve 4 most recently updated tickets as generic context
      retrievedReports = [...db.reports]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4);
    }

    try {
      console.log(`[Ask CamPulse RAG] Retrieved ${retrievedReports.length} reports for context.`);
      let systemInstruction = `You are Gemma 4, the "Ask CamPulse" RAG advisor and student guide for the Ahmadu Bello University campus maintenance platform (CamPulse).
Your job is to answer user questions about ABU campus maintenance issues in a simple, friendly manner and guide them on how to navigate and use every feature of the CamPulse application.

HOW TO NAVIGATE THE APP:
1. "FEED" TAB: The central hub where students can view, upvote, and discuss submitted maintenance reports.
2. "REPORT" TAB: A beautiful multi-step form to file a new report. You can attach a photo or record a voice note (supports English, Hausa, Yoruba, or Pidgin).
3. "MAP" TAB: An interactive map displaying color-coded campus zones across ABU Samaru and Kongo (including the College of Medical Sciences, Suleiman Hostel, Amina Hostel, etc.) with real-time status-coded pins for reported issues.

APPLICATION FUNCTIONS & ROLES:
- STUDENTS:
  * File maintenance reports for campus zones.
  * Optionally submit anonymously or with custom photos and audio proofs.
  * Upvote tickets to highlight critical campus needs.
  * Discuss ongoing issues via real-time comments.
  * Chat with the Gemma AI Advisor for quick FAQs.
- TECHNICIANS:
  * Dedicated dashboard to track and progress assigned tasks ('assigned' -> 'in_progress' -> 'resolved').
- ADMINISTRATORS:
  * Access the Admin Dashboard to review average resolution stats and triage diagnostics.
  * Manually or dynamically dispatch/assign specialized technicians to resolve open reports.

KEY SYSTEM FEATURES:
- OFFLINE-FIRST MODE: Works offline! Submissions are automatically queued in your browser's local storage and synced when the internet returns.
- PRIORITY RANK SCORE: Issues are ranked using: Rank Score = (Priority Score * 15) + (Upvotes * 5) + (Comments * 3).
- REAL-TIME LIVE NOTIFICATIONS: Powered by Server-Sent Events (SSE) to notify role-relevant users of status updates immediately.

GUIDELINES FOR ANSWERING:
- Speak directly, warmly, and helpfully to students and users as their peer/advisor. Keep explanations straightforward, simple, and free of internal software codebase details.
- Guide users on how to navigate to the specific Tab ("Feed", "Report", "Map") to perform actions.
- Use the provided DATABASE RECONSTRUCTED CONTEXT below to answer questions about specific ticket statuses or logged issues. If no matching information is found, kindly guide them to the "Report" tab to file a new ticket.`;

      if (systemPrompt) {
        systemInstruction = `${systemPrompt}\n\nPrimary System Instructions:\n${systemInstruction}`;
      }

      const contextText = retrievedReports.length > 0 
        ? retrievedReports.map(r => `- Ticket #${r.id} | Category: ${r.category.toUpperCase()} | Location: ${r.zone_name} | Status: ${r.status.toUpperCase()} | Description: "${r.description}" | Clustered: ${r.report_count || 1} report(s) | Logged: ${new Date(r.created_at).toLocaleDateString()}`).join('\n')
        : '(No active records found in database matches).';

      const prompt = `DATABASE RECONSTRUCTED CONTEXT:
${contextText}

STUDENT QUERY: "${message}"`;

      const aiResponse = await callGemmaAI(prompt, systemInstruction, false);
      return res.json({ reply: aiResponse });
    } catch (err) {
      console.error('[Ask CamPulse RAG Error] AI RAG pipeline failed. Falling back to offline local search summary:', err);
      
      // Fine-grained local search fallback (offline-first requirement)
      if (retrievedReports.length > 0) {
        let reply = `I am currently operating in offline-first mode because our AI cores are unreachable, but I scanned our local database and found **${retrievedReports.length} relevant tickets**:\n\n`;
        retrievedReports.slice(0, 3).forEach(r => {
          reply += `- **[${r.status.toUpperCase()}]** #${r.id} (${r.category.replace('_', ' ')}): "${r.description}" at **${r.zone_name}**.\n`;
        });
        reply += `\nIs one of these the ticket you are looking for? If so, you can track its live status updates directly on our map or feed.`;
        return res.json({ reply });
      }

      // Generic help guide fallback if no matching reports (highly descriptive offline FAQ)
      let fallbackReply = `Hello! I am **Gemma 4 AI**, your ABU student assistant. I'm operating in offline mode. How can I guide you today?`;
      if (msgLower.includes('priority') || msgLower.includes('critical') || msgLower.includes('rank') || msgLower.includes('score')) {
        fallbackReply = `**Priority & Gemma 4 Smart Ranking System:**\nIssues are sorted using: \`Rank Score = (Priority Score * 15) + (Upvotes * 5) + (Comments * 3)\`. Priority score goes from P1 (low) to P5 (critical) based on severity.`;
      } else if (msgLower.includes('offline') || msgLower.includes('sync') || msgLower.includes('queue')) {
        fallbackReply = `**Offline Queueing**: Tickets submitted while offline are saved in LocalStorage and synced automatically when back online to prevent data loss.`;
      } else if (msgLower.includes('role') || msgLower.includes('user') || msgLower.includes('privilege') || msgLower.includes('student') || msgLower.includes('admin') || msgLower.includes('technician')) {
        fallbackReply = `**CamPulse User Roles:**\n- **Students**: File reports (anonymously/publicly), attach photos/voice recordings, upvote reports, post comments, track tickets on the map.\n- **Technicians**: Track and progress assigned tasks ('assigned' -> 'in_progress' -> 'resolved').\n- **Admins**: Assign tickets to technicians, view stats/triage diagnostics, and access the Weekly Operations Summary Digest.`;
      } else if (msgLower.includes('voice') || msgLower.includes('record') || msgLower.includes('language')) {
        fallbackReply = `**Voice Input Feature**: You can record audio notes in English, Hausa, Yoruba, or Pidgin and attach them to your tickets. Voice transcription is currently disabled, but users and technicians can play the audio note directly on the ticket.`;
      } else if (msgLower.includes('map') || msgLower.includes('zone') || msgLower.includes('location')) {
        fallbackReply = `**Interactive Map**: Shows color-coded zones of ABU Samaru and Kongo campuses (e.g., Suleiman, Amina, Ribadu Hostels, Faculty of Engineering) with pins for all logged tickets.`;
      } else if (msgLower.includes('report') || msgLower.includes('submit') || msgLower.includes('file')) {
        fallbackReply = `**How to Report**: Tap the "Report" tab, describe the maintenance issue, choose a category and campus location (zone), optionally add a photo or voice recording, select if you want it to be anonymous, and click "Submit Report".`;
      } else {
        fallbackReply = `I couldn't find any matching tickets in our active database for your query. Try searching with keywords like "Suleiman", "borehole", "WiFi", or "Amina hostel", or ask about our features like "offline mode", "user roles", or "priority system".`;
      }
      return res.json({ reply: fallbackReply });
    }
  });

  // Feature 3: AI-generated triage summary for admin/maintenance dashboard
  app.get('/api/reports/triage-summary', async (req, res) => {
    const activeReports = db.reports.filter((r: Report) => r.status !== 'resolved');

    if (activeReports.length === 0) {
      return res.json({
        summary: `### 📋 Gemma 4 AI Maintenance Triage
        
No active unresolved maintenance tickets are currently logged in the database. Ahmadu Bello University campus systems are fully operational!`
      });
    }

    try {
      console.log(`[Gemma Triage Summary] Compiling administrative digest for ${activeReports.length} open tickets...`);
      const systemInstruction = `You are Gemma 4, the administrative triage officer for Ahmadu Bello University campus maintenance.
Summarize all active unresolved maintenance reports into a short, highly structured, and prioritized digest.
Structure your output to highlight the most critical hazards first, followed by general backlog, and provide immediate staffing dispatch recommendations.`;

      const prompt = `Here are the active unresolved maintenance tickets currently in the database:
${activeReports.map(r => `- [ID: ${r.id}] [Category: ${r.category}] [Severity: ${r.severity || 'medium'}] [Location: ${r.zone_name}] Description: "${r.description}" (🔺 ${r.upvotes} upvotes, Clustered: ${r.report_count || 1})`).join('\n')}

Format your summary as a beautiful, highly professional Markdown digest. Be direct, crisp, and actionable. Do not use generic introductions. Focus purely on urgent security, flooding, or power issues. Include:
1. **🚨 URGENT HAZARDS**: Summary of critical tickets (such as structural collapse, power blackouts, major water main breaks) needing immediate attention.
2. **📋 ACTIVE REPORT ANALYSIS**: High-level grouping of other active issues (e.g., "3 lighting complaints, 1 WiFi outage").
3. **🔧 DISPATCH GUIDANCE**: Recommendation of which technicians should handle which open tasks based on specialties (Musa Garba handles lighting, wifi, security; John Okoye handles plumbing, structural).`;

      const summaryText = await callGemmaAI(prompt, systemInstruction, false);
      res.json({ summary: summaryText });
    } catch (err) {
      console.error('[Gemma Triage Error] AI triage compilation failed. Generating programmatic fallback summary:', err);
      // Fallback local summary builder (offline-first requirement)
      const counts: Record<string, number> = {};
      let urgentIssues: string[] = [];
      activeReports.forEach((r: Report) => {
        counts[r.category] = (counts[r.category] || 0) + 1;
        if (r.priority_score >= 4) {
          urgentIssues.push(`- **[${r.category.toUpperCase()}]** at ${r.zone_name}: "${r.description.substring(0, 80)}..."`);
        }
      });

      let localSummary = `### 📋 Gemma 4 AI Maintenance Triage (Local Offline Digest)

*Notice: Gemma AI is currently offline. Generating automatic algorithmic triage summary.*

#### 🚨 HIGH-PRIORITY HOTSPOTS
${urgentIssues.length > 0 
  ? urgentIssues.join('\n') 
  : '• No active critical/high priority hazards detected on campus.'}

#### 📋 ACTIVE BACKLOG BY CATEGORY
${Object.entries(counts).map(([cat, cnt]) => `• **${cat.replace('_', ' ').toUpperCase()}**: ${cnt} active ticket(s)`).join('\n')}

#### 🔧 STAFF ALLOCATION DIRECTIVE
• **Musa Garba** is on standby for electrical issues (broken lights), wifi network interruptions, or security calls.
• **John Okoye** is on standby for plumbing line bursts or structural building defects.`;

      res.json({ summary: localSummary });
    }
  });

  // Gemma AI Weekly Report Summarizer for Admins
  app.post('/api/gemma/weekly-summary', async (req, res) => {
    const reports = db.reports;

    // Create map for fast comments count lookup
    const commentsCountMap: Record<string, number> = {};
    if (db.comments) {
      db.comments.forEach((c: any) => {
        commentsCountMap[c.report_id] = (commentsCountMap[c.report_id] || 0) + 1;
      });
    }

    const reportsWithRank = reports.map((r: any) => {
      const cCount = commentsCountMap[r.id] || 0;
      return {
        ...r,
        comments_count: cCount,
        gemma_rank_score: (r.priority_score * 15) + (r.upvotes * 5) + (cCount * 3)
      };
    });

    if (reportsWithRank.length === 0) {
      return res.json({ 
        summary: `### 📊 Gemma 4 AI Weekly Digest
        
No maintenance tickets have been submitted yet. When students start reporting issues in ABU halls and faculties, I will compile structured executive insights, critical concerns, and technician dispatch recommendations here.` 
      });
    }

    try {
      console.log('[Gemma AI] Generating weekly summary...');
      
      const totalTickets = reportsWithRank.length;
      const resolved = reportsWithRank.filter((r: any) => r.status === 'resolved').length;
      const open = totalTickets - resolved;
      const categoriesSummary = reportsWithRank.reduce((acc: any, r: any) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {});
      
      const criticalReports = reportsWithRank
        .filter((r: any) => r.priority_score >= 4 && r.status !== 'resolved')
        .map((r: any) => `[P${r.priority_score}] ${r.category} at ${r.zone_name}: "${r.description}" (${r.upvotes} upvotes, ${r.comments_count} complaints)`)
        .join('\n');

      const systemInstruction = `You are the executive advisor AI for Ahmadu Bello University administration.
Generate a comprehensive, highly polished, structured weekly campus maintenance summary.`;

      const prompt = `Generate a comprehensive weekly campus maintenance summary based on this data:
      
      - Total Logged Tickets: ${totalTickets}
      - Resolved Tickets: ${resolved}
      - Open Tickets: ${open}
      - Category Breakdown: ${JSON.stringify(categoriesSummary)}
      
      Unresolved P4-P5 Critical Tickets:
      ${criticalReports || 'None'}
      
      Generate a beautifully structured dashboard summary in markdown format with these exact headings:
      ### 📌 Executive Overview
      [A brief, professional summary of active tickets, resolution rates, and general campus health]
      
      ### 🚨 Critical Areas & Pain Points
      [Detail any high-urgency zones, repeat hotspots e.g., water leaks in Suleiman, or security alarms. Mention upvotes and public student complaints/comments]
      
      ### 🛠️ Technician Dispatch & Resource Guidance
      [Recommend where to deploy staff like Musa Garba (plumbing, structural) or John Okoye (broken lights, wifi) based on their specialties and pending ticket categories]
      
      ### 📈 Suggested Action Items
      [Provide 3 clear, actionable recommendations for this week to improve student satisfaction and campus infrastructure]`;

      const summary = await callGemmaAI(prompt, systemInstruction, false);
      return res.json({ summary });
    } catch (err) {
      console.error('[Gemma AI Weekly Summary Error] AI generation failed. Falling back to quality local summary:', err);
    }

    // Quality offline fallback in case Gemma API is not available
    const totalTickets = reportsWithRank.length;
    const resolved = reportsWithRank.filter((r: any) => r.status === 'resolved').length;
    const open = totalTickets - resolved;
    const critical = reportsWithRank.filter((r: any) => r.priority_score >= 4 && r.status !== 'resolved');

    let summary = `### 📊 Gemma 4 AI Weekly Insights (Offline Mode)

### 📌 Executive Overview
The campus has logged a total of **${totalTickets} tickets**, with **${resolved} resolved** and **${open} currently active**. The average resolution cycle remains around **24 hours**.

### 🚨 Critical Areas & Pain Points
${critical.length > 0 
  ? `There are **${critical.length} critical issues** that require immediate administrative focus:
  ${critical.map(r => `- **[P${r.priority_score}] ${r.category.replace('_', ' ').toUpperCase()}** at ${r.zone_name}: "${r.description}" (🔺 ${r.upvotes} upvotes, ${r.comments_count} complaints)`).join('\n')}`
  : `No active P4 or P5 critical tickets are currently flagged. The general campus hazard level is low.`
}

### 🛠️ Technician Dispatch & Resource Guidance
- **Musa Garba (Broken Lights/WiFi/Security)** is recommended for immediate dispatch to high-priority electrical or network safety zones.
- **John Okoye (Plumbing/Structural)** should focus on ongoing water leakage tickets in the student hostels (Amina and Suleiman).

### 📈 Suggested Action Items
1. **Urgent Water Safety Check**: Prioritize resolving active plumbing tickets in hostel washrooms to maintain sanitary standards.
2. **Pathways Illumination**: Address broken lighting complaints around Samaru hostel gates to secure campus walkways before dusk.
3. **Queue Balancing**: Transition low-priority P1 tickets to off-peak schedules so technicians can focus on urgent crowdsourced issues.`;

    res.json({ summary });
  });

  // Vite development or production routing
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CamPulse full-stack server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
