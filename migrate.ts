import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Error: DATABASE_URL environment variable is not defined.');
  console.error('Please define it in your environment or in a .env file.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes('supabase') || dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('🚀 Starting migration of flat-file db.json data to PostgreSQL / Supabase...');

  try {
    // 1. Enable PostGIS Extension
    console.log('🔹 Step 1: Ensuring PostGIS extension is enabled...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');

    // 2. Re-create / Ensure Tables exist with correct column types
    console.log('🔹 Step 2: Creating database schema...');
    
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
        reporter_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        reporter_name VARCHAR(255),
        category VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        geom GEOMETRY(Point, 4326),
        zone_id VARCHAR(255) REFERENCES zones(id) ON DELETE SET NULL,
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

    // Gist index for geospatial queries
    await pool.query('CREATE INDEX IF NOT EXISTS reports_geom_idx ON reports USING gist(geom);');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS technicians (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        skill_tags TEXT[] DEFAULT '{}',
        current_load INTEGER DEFAULT 0
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id VARCHAR(255) PRIMARY KEY,
        report_id VARCHAR(255) REFERENCES reports(id) ON DELETE CASCADE,
        technician_id VARCHAR(255) REFERENCES technicians(id) ON DELETE SET NULL,
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

    console.log('✅ Base schemas created successfully.');

    // Schema Evolution/Alterations to ensure columns like "geom" exist if tables were pre-created
    console.log('🔹 Step 2.5: Running schema alterations to guarantee evolved columns exist...');
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

    // 3. Read db.json
    const dbFilePath = path.join(process.cwd(), 'db.json');
    if (!fs.existsSync(dbFilePath)) {
      console.warn('⚠️ Warning: db.json file not found at root directory. Skipping data import step.');
      await pool.end();
      return;
    }

    console.log('🔹 Step 3: Loading data from db.json...');
    const rawData = fs.readFileSync(dbFilePath, 'utf8');
    const db = JSON.parse(rawData);

    // 4. Migrate Users
    console.log(`🔹 Step 4: Migrating ${db.users?.length || 0} users...`);
    if (db.users && db.users.length > 0) {
      for (const u of db.users) {
        await pool.query(`
          INSERT INTO users (id, google_id, name, email, role)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE 
          SET google_id = EXCLUDED.google_id, name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role;
        `, [u.id, u.google_id || null, u.name, u.email, u.role]);
      }
    }

    // 5. Seed / Ensure Zones exist (with polygon geom)
    console.log('🔹 Step 5: Seeding default university zones...');
    await pool.query(`
      INSERT INTO zones (id, name, geom) VALUES
        ('zone-suleiman', 'Suleiman Hall', ST_GeomFromText('POLYGON((7.710 11.142, 7.715 11.142, 7.715 11.146, 7.710 11.146, 7.710 11.142))', 4326)),
        ('zone-amina', 'Amina Hall', ST_GeomFromText('POLYGON((7.710 11.143, 7.713 11.143, 7.713 11.147, 7.710 11.147, 7.710 11.143))', 4326)),
        ('zone-ribadu', 'Ribadu Hall', ST_GeomFromText('POLYGON((7.708 11.144, 7.712 11.144, 7.712 11.148, 7.708 11.148, 7.708 11.144))', 4326)),
        ('zone-engineering', 'Faculty of Engineering', ST_GeomFromText('POLYGON((7.706 11.140, 7.711 11.140, 7.711 11.144, 7.706 11.144, 7.706 11.140))', 4326)),
        ('zone-other', 'ABU Campus (General)', ST_GeomFromText('POLYGON((7.690 11.130, 7.730 11.130, 7.730 11.160, 7.690 11.160, 7.690 11.130))', 4326))
      ON CONFLICT (id) DO NOTHING;
    `);

    // 6. Migrate Technicians
    console.log(`🔹 Step 6: Migrating ${db.technicians?.length || 0} technicians...`);
    if (db.technicians && db.technicians.length > 0) {
      for (const t of db.technicians) {
        await pool.query(`
          INSERT INTO technicians (id, user_id, name, skill_tags, current_load)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE 
          SET user_id = EXCLUDED.user_id, name = EXCLUDED.name, skill_tags = EXCLUDED.skill_tags, current_load = EXCLUDED.current_load;
        `, [t.id, t.user_id, t.name, t.skill_tags, t.current_load]);
      }
    }

    // 7. Migrate Reports with Geospatial conversion
    console.log(`🔹 Step 7: Migrating ${db.reports?.length || 0} reports with PostGIS geospatial mappings...`);
    if (db.reports && db.reports.length > 0) {
      for (const r of db.reports) {
        // Compute geom point using ST_SetSRID and ST_MakePoint(lng, lat)
        await pool.query(`
          INSERT INTO reports (
            id, reporter_id, reporter_name, category, description, lat, lng, geom, 
            zone_id, zone_name, is_anonymous, status, priority_score, severity, 
            location_hint, sentiment, triage_analysis, photo_url, voice_url, 
            voice_interpretation, upvotes, report_count, upvoted_by, created_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($7, $6), 4326), 
            $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
          )
          ON CONFLICT (id) DO UPDATE 
          SET reporter_id = EXCLUDED.reporter_id, reporter_name = EXCLUDED.reporter_name,
              category = EXCLUDED.category, description = EXCLUDED.description,
              lat = EXCLUDED.lat, lng = EXCLUDED.lng, geom = EXCLUDED.geom,
              zone_id = EXCLUDED.zone_id, zone_name = EXCLUDED.zone_name,
              is_anonymous = EXCLUDED.is_anonymous, status = EXCLUDED.status,
              priority_score = EXCLUDED.priority_score, severity = EXCLUDED.severity,
              location_hint = EXCLUDED.location_hint, sentiment = EXCLUDED.sentiment,
              triage_analysis = EXCLUDED.triage_analysis, photo_url = EXCLUDED.photo_url,
              voice_url = EXCLUDED.voice_url, voice_interpretation = EXCLUDED.voice_interpretation,
              upvotes = EXCLUDED.upvotes, report_count = EXCLUDED.report_count,
              upvoted_by = EXCLUDED.upvoted_by, created_at = EXCLUDED.created_at;
        `, [
          r.id, r.reporter_id, r.reporter_name || null, r.category, r.description,
          parseFloat(r.lat), parseFloat(r.lng), r.zone_id || null, r.zone_name || null,
          r.is_anonymous || false, r.status, r.priority_score || 3, r.severity || 'medium',
          r.location_hint || '', r.sentiment || 'neutral', r.triage_analysis || null,
          r.photo_url || null, r.voice_url || null, r.voice_interpretation || null,
          r.upvotes || 0, r.report_count || 1, r.upvoted_by || [], r.created_at ? new Date(r.created_at) : new Date()
        ]);
      }
    }

    // 8. Migrate Assignments
    console.log(`🔹 Step 8: Migrating ${db.assignments?.length || 0} assignments...`);
    if (db.assignments && db.assignments.length > 0) {
      for (const a of db.assignments) {
        await pool.query(`
          INSERT INTO assignments (id, report_id, technician_id, technician_name, assigned_at, resolved_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE 
          SET report_id = EXCLUDED.report_id, technician_id = EXCLUDED.technician_id,
              technician_name = EXCLUDED.technician_name, assigned_at = EXCLUDED.assigned_at,
              resolved_at = EXCLUDED.resolved_at;
        `, [
          a.id, a.report_id, a.technician_id, a.technician_name,
          a.assigned_at ? new Date(a.assigned_at) : new Date(),
          a.resolved_at ? new Date(a.resolved_at) : null
        ]);
      }
    }

    // 9. Migrate Comments
    console.log(`🔹 Step 9: Migrating ${db.comments?.length || 0} comments...`);
    if (db.comments && db.comments.length > 0) {
      for (const c of db.comments) {
        await pool.query(`
          INSERT INTO comments (id, report_id, user_id, user_name, user_role, text, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE 
          SET report_id = EXCLUDED.report_id, user_id = EXCLUDED.user_id,
              user_name = EXCLUDED.user_name, user_role = EXCLUDED.user_role,
              text = EXCLUDED.text, created_at = EXCLUDED.created_at;
        `, [
          c.id, c.report_id, c.user_id || null, c.user_name, c.user_role, c.text,
          c.created_at ? new Date(c.created_at) : new Date()
        ]);
      }
    }

    // 10. Migrate Notifications
    console.log(`🔹 Step 10: Migrating ${db.notifications?.length || 0} notifications...`);
    if (db.notifications && db.notifications.length > 0) {
      for (const n of db.notifications) {
        await pool.query(`
          INSERT INTO notifications (id, user_id, title, message, type, reference_id, read, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE 
          SET user_id = EXCLUDED.user_id, title = EXCLUDED.title, message = EXCLUDED.message,
              type = EXCLUDED.type, reference_id = EXCLUDED.reference_id,
              read = EXCLUDED.read, created_at = EXCLUDED.created_at;
        `, [
          n.id, n.user_id, n.title, n.message, n.type, n.reference_id || null,
          n.read || false, n.created_at ? new Date(n.created_at) : new Date()
        ]);
      }
    }

    console.log('\n🎉 Data migration completed successfully! All entities successfully synced to PostgreSQL database.');
  } catch (error) {
    console.error('❌ Migration Error occurred:', error);
  } finally {
    await pool.end();
    console.log('🔌 Database connection pool closed.');
  }
}

runMigration();
