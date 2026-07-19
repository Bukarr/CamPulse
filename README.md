# CamPulse: Campus Maintenance Reporting PWA for ABU Samaru Campus

**Submission:** Build with Gemma: GDG on Campus ABU Zaria Hackathon

---

## 1. Project Overview

**CamPulse** is a lightweight, offline-capable Progressive Web App (PWA) designed specifically for Ahmadu Bello University (ABU) Samaru Campus, Zaria. It bridges the gap between the campus community (students, lecturers, and staff) and physical maintenance teams by streamlining the reporting, triage, and resolution cycle of campus infrastructure issues. 

### The Problem
With a vast campus footprint and sprawling infrastructure, maintenance complaints—such as borehole water leakages, electrical power failures in lecture halls, and network outages—often go unreported or delayed because of highly manual reporting routes. CamPulse enables students to easily log geo-tagged reports with optional photo and voice proofs. Administrators can then instantly analyze backlog trends, prioritize critical campus safety hazards, and dispatch specialized technicians.

### Theme Alignment: Northern Nigerian Challenges
ABU Zaria is the largest university in Sub-Saharan Africa, accommodating over 50,000 students across high-load residential hostels and academic faculties. Sprawling utility networks in Northern Nigeria are prone to severe weather stresses and heavy load shedding. CamPulse directly targets these localized challenges by ensuring that critical infrastructure failures affecting student welfare, safety, and academic continuity are resolved in hours rather than weeks through automated, low-bandwidth, and offline-first reporting solutions.

---

## 2. Architecture Diagram

The diagram below represents the system architecture of the CamPulse full-stack application, demonstrating the split-path integration between geospatial query execution and Gemma 4 AI endpoints.

```mermaid
flowchart TD
    %% Clients
    Client[React + Vite + Tailwind CSS PWA] <-->|Server-Sent Events SSE| NotificationEngine[Real-Time Live Notification Engine]
    Client -->|Google SSO Auth Check| AuthEndpoint["/api/auth/google @abu.edu.ng"]
    
    %% API Gateway / Backend
    Client <-->|HTTPS API / JSON| ExpressServer[Node.js + TypeScript Express Backend]
    
    %% Database Path
    ExpressServer <-->|node-postgres pg| PostgreSQL["PostgreSQL + PostGIS Database (Supabase)"]
    PostgreSQL -->|Spatial Query ST_DWithin| ExpressServer
    
    %% AI Path
    ExpressServer <-->|Gemma Client| GemmaRouter["gemma-4-31b-it via Hugging Face Inference API"]
    GemmaRouter <-->|Direct Token routing / OpenAI chat format| HFProviders["router.huggingface.co/v1"]
    
    subgraph Storage & Analytics
        PostgreSQL
    end
    
    subgraph LLM Infrastructure
        GemmaRouter
    end
```

---

## 3. Tech Stack

| Layer | Technology | Implementation Details |
| :--- | :--- | :--- |
| **Frontend** | React 19 + Vite + Tailwind CSS | Highly optimized client-side layout utilizing **motion** for layout transitions, with Progressive Web App (PWA) offline service worker queueing. |
| **Backend** | Node.js + TypeScript + Express | Fast, stateless server running TSX execution. Compiles to a self-contained CommonJS bundle (`dist/server.cjs`) for production. |
| **Database** | PostgreSQL + PostGIS | Hosted on Supabase, leveraging geospatial extension schemas and indices for coordinate calculation and proximity queries. |
| **AI Core** | Gemma 4 31B (`google/gemma-4-31b-it`) | The exact model identifier utilized across all AI features is **`google/gemma-4-31b-it`** (referenced internally as Gemma 4 31B variant). |
| **AI Access** | Hugging Face Inference API | Directly routed to serverless or dedicated endpoints at `https://api-inference.huggingface.co` / `router.huggingface.co/v1` using standard headers and bearer tokens. |
| **Authentication**| Google Identity SSO | Restricted exclusively to Ahmadu Bello University domains: `@student.abu.edu.ng`, `@tech.abu.edu.ng`, and `@abu.edu.ng`. |
| **Real-time** | Server-Sent Events (SSE) | Multi-client broadcast server for instant notification delivery of assignment and ticket status changes. |
| **Mapping Engine** | `react-leaflet` (Leaflet) | Interactive Samaru campus canvas seeded with a custom dataset of exactly **108** distinct points of interest (hostels, gates, departments, and administrative centers). |

*Note: No proprietary Gemini model is used in the compliant production build path. The Gemini SDK fallback was completely removed from the backend code (`server.ts`) to maintain a direct, sovereign server-side-only Gemma 4 31B pipeline.*

---

## 4. Gemma 4 31B Integration Details

Judges can verify the exact integration points, model parameters, and prompts implemented in `server.ts` and `src/services/ai-parsing.service.ts`:

### 1. Multimodal / Text Ingest & Report Triage
*   **Route:** `POST /api/reports`
*   **Role:** Analyzes raw, unstructured student reports (with optional photo assets) and extracts a structured JSON object matching the database schema using the high-performance **Gemma 4 31B** model.
*   **Verbatim Prompt Templates:**
    *   *Multimodal Ingest Prompt:*
        ```text
        Analyze the user's free-text maintenance report and extract the following fields, taking the attached proof photo into consideration for accuracy of severity, category, and location cues:
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
        }
        ```
    *   *System Instruction:*
        `You are the Gemma 4 campus maintenance intake engine for Ahmadu Bello University, Zaria. Use the attached photo and text to return a strict JSON object matching the requested schema.`
*   **Offline-First Fallback:** If the Hugging Face AI gateway is unreachable, the system automatically uses standard programmatic fallbacks (defaults to category `'others'`, severity `'medium'`, and `'neutral'` sentiment).

### 2. Semantic Duplicate Detection & Clustering
*   **Route:** `POST /api/reports` (Nested within ingestion pipeline)
*   **Role:** Compares a newly submitted ticket with active unresolved reports within a 100-meter radius to find duplicates and prevent ticket flooding.
*   **Verbatim System Instruction:**
    ```text
    You are Gemma 4's deduplication engine. 
    Compare this new campus maintenance report description with nearby existing open reports.
    Determine if the new report is a DUPLICATE describing the exact same issue in the exact same location.

    New Report Description: "${description}"

    Nearby Open Reports:
    ${nearbyReports.map((r) => `ID: ${r.id} | Category: ${r.category} | Description: ${r.description}`).join('\n')}

    Output your decision as a strict JSON object (no markdown, no quotes, just raw JSON) matching this schema:
    {
      "is_duplicate": boolean,
      "duplicate_report_id": string or null,
      "confidence_score": number
    }
    ```
*   **Offline-First Fallback:** Falls back to a local, high-performance Jaccard word-overlap similarity index. If the overlap coefficient `>= 0.35` (words > 2 letters, punctuation ignored), it flags a duplicate, increments the original ticket's upvotes and report counter, and attaches a system comment recording the cluster merge.

### 3. Natural-Language Status Notifications
*   **Route:** `PATCH /api/reports/:id/status`
*   **Role:** Generates highly contextual, reassuring progress updates for students when technicians change a report's lifecycle status.
*   **Verbatim Prompt Templates:**
    *   *System Instruction:*
        `You are Gemma 4, the automated notification dispatcher for Ahmadu Bello University maintenance. Generate a short, friendly, and highly contextual notification message for a student who reported an issue. Keep your response to exactly 1 or 2 concise, reassuring sentences. Do not use greetings or signature blocks. Just the notification content.`
    *   *User Prompt:*
        ```text
        Generate a status change update for this report:
        - Category: ${report.category}
        - Description: "${report.description}"
        - Transition: from "${prevStatus}" to "${status}"
        - Technician Actions/Comments: "${comment_text || 'None'}"
        ```
*   **Offline-First Fallback:** Reverts instantly to a programmatic string translation: `"Your report for ${category} is now ${STATUS}. Updated by ${technician}."`

### 4. "Ask CamPulse" RAG Engine (Student Support FAQ)
*   **Route:** `POST /api/gemma/chat` (For students)
*   **Role:** Solves student inquiries regarding logged campus issues by querying relevant database entries.
*   **Verbatim System Instruction:**
    ```text
    You are Gemma 4, the "Ask CamPulse" RAG advisor for Ahmadu Bello University campus maintenance.
    Your job is to answer user questions about ABU campus maintenance issues AND every function and feature in the CamPulse application.
    ```
*   **Offline-First Fallback:** Scans local report logs for keywords. If offline, compiles a list of matching tickets. If keywords like `"priority"` or `"offline"` are typed, it presents custom algorithmic guides detailing the smart priority score calculation.

### 5. Gemma Admin Dispatch Assistant (Task Allocation Controller)
*   **Route:** `POST /api/gemma/chat` (Triggered for admins when assignment intent is parsed)
*   **Role:** Allows administrators to dispatch workers using free-text voice or text instructions (e.g., *"Assign the Suleiman plumbing leak to the plumber"*). Gemma extracts the correct report ID and technician ID.
*   **Verbatim System Instruction:**
    ```text
    You are Gemma 4's task allocation controller for Ahmadu Bello University.
    Your job is to analyze the administrator's assignment command and match it to a specific active report and a qualified technician.

    Available Technicians:
    [List of Technicians with ID, name, specialties, and current load]

    Active Reports:
    [List of Active Reports with ID, category, location, and description]

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
    }
    ```
*   **Offline-First Fallback:** Administrators can fall back to the interactive, manual drag-and-drop technician dispatch dropdown in the visual board.

---

## 5. Performance & Offline Reliability Optimizations

To support users on slow 2G/3G networks, high-latency environments, or with intermittent connectivity across Northern Nigeria, CamPulse implements aggressive performance and caching optimizations:

### 1. Service Worker Overhaul & Pre-caching
We have rewritten the Progressive Web App Service Worker (`/public/sw.js`) to enforce a robust, multi-tier cache structure (`campulse-static`, `campulse-pages`, `campulse-api`, `campulse-images`):
- **Precaching:** Core app shells (HTML, static stylesheets, local icons, and Leaflet CSS) are cached immediately on install for instant loading.
- **HTML Navigation Routing:** Implements a **NetworkFirst** strategy with a **3-second strict timeout**. If the network takes longer than 3 seconds or is unreachable, the Service Worker bypasses the network and loads the cached `/index.html` instantly, dropping Time to Interactive (TTI) to under 3 seconds.
- **Hashed Assets CacheFirst:** Hashed static assets generated by the Vite build process (`/assets/*`) are cached indefinitely (**CacheFirst**), fully eliminating unnecessary server hits.
- **API GET Fallback:** GET request routes under `/api/*` use a **NetworkFirst** strategy with a **3-second timeout**. If the network fails or times out, the service worker returns the last cached response seamlessly, keeping the UI highly functional offline.
- **Image LRU Trimming:** Media and icon assets use **StaleWhileRevalidate** with a strict LRU limit of 50 assets to prevent memory bloat on low-storage mobile devices.

### 2. Route-Level Code Splitting & Suspense Loading
Initial JavaScript footprint is restricted strictly to under **50 KB** by replacing all static view imports in `src/App.tsx` with **`React.lazy`** dynamic imports:
- Heavy mapping libraries (`leaflet`, `react-leaflet`) and charting libraries (`recharts`) are dynamically split into asynchronous chunks loaded only when the user navigates to their respective tabs.
- Components such as `LoginView`, `MapComponent`, `ReportForm`, `StudentView`, `AdminDashboard`, `TechnicianView`, and `GemmaAIWidget` are wrapped inside custom `<Suspense>` wrappers showing smooth, lightweight layout placeholders.

### 3. Reactive Offline Queue & UI Sync Indicators
A mutation queue stores write actions (report submissions) inside local storage whenever a connection error occurs:
- The app detects offline transitions instantly via browser events and updates the network status indicator.
- An interactive, scrollable **Offline Queued Tickets Panel** displays all pending reports waiting for synchronization, satisfying the "Show pending actions in the UI" requirement.
- When connection is restored, a secure auto-sync algorithm pushes the local queue payload to `/api/reports/sync` and automatically fetches the updated campus status.

---

## 6. Database Schema

CamPulse operates a structured PostgreSQL schema configured for Supabase with the PostGIS extension enabled:

```sql
-- Core PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    google_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL -- 'student' | 'technician' | 'admin'
);

-- 2. Zones Table
CREATE TABLE zones (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    geom GEOMETRY(Polygon, 4326) NOT NULL
);

-- 3. Reports Table (with PostGIS Point geometry)
CREATE TABLE reports (
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
    status VARCHAR(50) NOT NULL, -- 'submitted' | 'assigned' | 'in_progress' | 'resolved'
    priority_score INTEGER DEFAULT 3, -- 1 to 5
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

-- 4. Technicians Table
CREATE TABLE technicians (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    skill_tags TEXT[] DEFAULT '{}',
    current_load INTEGER DEFAULT 0
);

-- 5. Assignments Table
CREATE TABLE assignments (
    id VARCHAR(255) PRIMARY KEY,
    report_id VARCHAR(255) REFERENCES reports(id) ON DELETE CASCADE,
    technician_id VARCHAR(255) REFERENCES technicians(id) ON DELETE SET NULL,
    technician_name VARCHAR(255) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 6. Comments Table
CREATE TABLE comments (
    id VARCHAR(255) PRIMARY KEY,
    report_id VARCHAR(255) REFERENCES reports(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Notifications Table
CREATE TABLE notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(255),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GIST Indexing for PostGIS Query Speed
CREATE INDEX IF NOT EXISTS reports_geom_idx ON reports USING gist(geom);
```

### Geospatial Geometry Design Decoupling
In the frontend map visual overlays, campus zones are modeled and plotted as **Point geometries** representing the precise coordinate centers of key landmarks (e.g., Hostels, Departments, Gates). This design choice was made because official architectural footprint shapes (complex polygons) for all buildings in ABU Samaru are not publicly digitized. 

Consequently, **nearest-zone matching** is calculated in the browser by evaluating coordinates relative to these landmark centers using Euclidean/Haversine offsets in `findZoneForCoordinates(lat, lng)`. On the server side, PostGIS polygon geometries are fully supported and seeded with five high-level, macro-geographic university zone boundaries, which maps reports to zones dynamically.

---

## 7. Setup & Reproduction Instructions

Follow these step-by-step instructions to boot the application and verify its full-stack capabilities:

### Prerequisites
*   Node.js (v18+ recommended)
*   A running PostgreSQL database instance (with PostGIS enabled) or a standard Supabase project

### Steps
1.  **Clone the Repository** and navigate to the project root directory.
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Configure Environment Variables:**
    Create a `.env` file at the root of your project using `.env.example` as a template:
    ```env
    # Database configuration (Supabase / Local PG)
    DATABASE_URL="postgresql://postgres:your_password@your_host:5432/postgres"

    # Gemma 4 31B endpoint configurations
    GEMMA_API_URL="https://api-inference.huggingface.co/models/google/gemma-4-31b-it"
    GEMMA_MODEL="google/gemma-4-31b-it"

    # Required Hugging Face Read token
    HF_API_TOKEN="hf_your_actual_inference_api_read_token"

    # System Host URL (defaults to localhost:3000)
    APP_URL="http://localhost:3000"
    ```
4.  **Run Database Migration & Seeding:**
    This script automatically checks for the PostGIS extension, builds the schema tables, registers default users, seeds campus zones, and imports any historical reports from `db.json`:
    ```bash
    npm run migrate
    ```
5.  **Start the Development Server:**
    ```bash
    npm run dev
    ```

---

## 8. Known Limitations

*   **Audio / Voice Transcription Fallback:** Voice-based report submission records audio and uploads clean WAV segments perfectly. However, direct voice-to-text translation relies on static mock placeholders on the server since Gemma models (`google/gemma-4-31b-it`) are specialized text-and-vision (multimodal) LLMs and do not contain native audio-to-text speech recognition weights.
*   **Mapping Layers Caching Boundaries:** While the primary PWA logic, offline queues, and local list views are fully offline-first, Leaflet map tiles (Google Streets, Google Satellite, Dark Map) require an active internet connection to download and refresh grid assets.
*   **Google SSO Iframe Sandboxing:** To support operation in sandboxed preview contexts where standard popups are blocked, Google OAuth is simulated via an iframe-compliant mock verification endpoint (`/api/auth/google`) which performs identical email domain parsing and credential verification.

---

## 9. License

This project is licensed under the terms of the **MIT License**. For details, see the [LICENSE](./LICENSE) file at the root of the repository.

---

## 10. Team / Acknowledgments

### Team Members (GDG on Campus ABU Zaria)
*   **Abubakar Sadiq Ibrahim** - Lead Full-Stack Engineer & AI Architect
*   **Bello Muhammad Sani** - Frontend & Offline-First/PWA Specialist
*   **Amina Yusuf** - UI/UX Designer & Geospatial Visualization Lead

### Acknowledgments
*   We express our gratitude to the Google Developer Groups (GDG) on Campus, Ahmadu Bello University, Zaria, for facilitating this hackathon.
*   Special thanks to the Google Gemma Team for providing the high-efficiency Gemma model weights that power this app's campus intelligence.
