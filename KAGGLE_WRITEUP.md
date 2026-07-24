### CamPulse — Decentralized AI-Driven Campus Maintenance & Triage Platform for ABU Zaria

**Event:** GDG on Campus Ahmadu Bello University (ABU) Zaria Hackathon — "Build with Gemma"
**Track:** Gemma for Civic & Campus Life
**Project Name:** CamPulse
**Target Institution:** Ahmadu Bello University (Samaru Zaria, Kaduna State, Nigeria)
**Core Model Variant:** Gemma 4 31B-it (`google/gemma-4-31b-it`) via Serverless Hugging Face Inference API
**Database System:** PostgreSQL with PostGIS Spatial Extension (100% relational state, zero file-based mock databases)
**Live Web Application:** (https://campus-abu.onrender.com)

---

## 💡 1. Inspiration: Civic & Campus Welfare at ABU Zaria

Ahmadu Bello University (ABU), Zaria, stands as the largest university in Sub-Saharan Africa, supporting a massive population of over 50,000 students, researchers, and administrative staff across its sprawling Samaru campus. However, managing municipal-scale infrastructure in Northern Nigeria presents deep, unique challenges. The region's extreme climatic stressors—ranging from intense dry season dusts to violent wet season downpours—interact with an unstable national power grid to produce frequent utility and infrastructural breakdowns.

### The Real-World Friction
Ruptured water boreholes, prolonged electrical brownouts in overcrowded hostels (such as Suleiman, Amina, and Ribadu halls), and complete network outages in critical lecture halls directly threaten student health, personal safety, and academic continuity.

Currently, reporting these hazards relies on a manual paper-based bureaucracy. A student must draft a physical complaint letter and deliver it to hostel administrators, who manually log it and pass it to the maintenance division. By the time a maintenance crew is dispatched, weeks or months have elapsed, turning a minor leak into stagnant water pools or structural rot.

### Our Solution: CamPulse

We engineered **CamPulse** to eliminate this communication gap and automate campus triage. CamPulse is a Progressive Web App (PWA) that acts as the real-time utility heartbeat of the ABU campus. It empowers students to instantly report maintenance issues, drop pinpoint geographic pins on a high-fidelity interactive map, attach photo proofs, or record voice recordings.

By combining real-time spatial queries inside **PostgreSQL + PostGIS** with the advanced reasoning capabilities of Google's **Gemma 4 31b-it**, CamPulse transforms unstructured, localized descriptions into prioritized, deduplicated, and actionable maintenance orders. It routes work orders instantly to technicians, updates students on resolution progress, and provides administrators with a comprehensive civic-health dashboard.

---
## 🛠️ 2. Core Features of the Web App

Here is an overview of the core features powering CamPulse (ABU Samaru Infrastructure & Civic Management Hub):

**1. Student Portal & Civic Reporting**
- **Matriculation ID Authentication:** Students authenticate using official ABU Matric ID format (e.g. U25MBBS1025 — where U25 = 2025 admission year, MBBS = course code, 1025 = index number), auto-linking to @student.abu.edu.ng.
- **Multimodal Incident Reporting:** Allows reporting via text, direct voice recording, base64 photo upload, or a combination.
- **In-Line MiniVoicePlayer:** Integrated audio player featuring animated waveforms, seeking scrubbers, duration timers, and instant play/pause directly on complaint cards.
- **Interactive Leaflet Campus Map:** Geotagged incident reporting with pin dropping across 134 predefined Points of Interest (POIs) across ABU Samaru campus (hostels, lecture halls, gates, administrative blocks).
- **Crowdsourced Upvotes & Smart Priority Engine:** Students can upvote active issues to highlight communal needs. The system dynamically computes priority ranks using severity scores, upvotes, and comment counts.
- **"Ask CamPulse" AI RAG Assistant:** Floating conversational AI buddy powered by Gemma AI to search open campus tickets, locate nearby water boreholes/facilities, or explain priority rankings.
- **Offline Sync Queue:** Automatically captures reports locally under weak 2G/3G campus connections and syncs them to PostgreSQL when connectivity resumes.

**2. Admin Control Center & AI Dispatch**
- **Visual Board Triage & Technician Assignment:** Drag-and-drop / manual dispatch interface for allocating specialized technicians (electrical, plumbing, structural, network) to urgent tickets.
- **Dual Audio & Photo Verification:** Preserves the student's original complaint voice note untouched on the ticket while providing a separate Technician Resolution Audio Proof (resolution_voice_url) visible exclusively to administrators.
- **Gemma AI Executive Summaries:**
  - *Live Triage Digest:* Real-time briefing of active campus emergency reports.
  - *Weekly Insights Digest:* Automated breakdown of resolution speeds, hotspot zones, technician workloads, and strategic recommendations.
- **Real-Time Notification Engine:** Broadcasts instant assignment and status change alerts across connected clients via Server-Sent Events (SSE).

**3. Technician Duty Queue**
- **Personal Worklist & Search Bar:** Dedicated queue displaying assigned work orders sorted by severity with instant keyword/location search filtering.
- **Status Updates with Dual Proofs:** Technicians update work statuses (in_progress, resolved). Ticket resolution requires uploading a photo proof-of-completion and recording an audio completion note for admin review.
- **Workload Balance Tracker:** Visual stats monitoring active assignments per technician to ensure balanced task distribution.

---

## 🛠️ 3. Architectural Design & The 'Gemma-as-a-Service' (GaaS) Backend

### Decoupled Hybrid Architecture
The primary engineering constraint at ABU Zaria is **hostile connectivity**. Cellular bandwidth is highly congested, and concrete walls inside residential halls act as Faraday cages. Standard web applications that load heavy models client-side or fail completely on connection drops are non-viable.

CamPulse implements a decoupled **Gemma-as-a-Service (GaaS)** architecture on the backend, combining serverless AI completions with robust, programmatic local fallbacks.

```
                    ┌─────────────────────────────────────────────────┐
                    │         CamPulse React 19 PWA Client            │
                    └────────┬───────────────────────────────┬────────┘
                             │ (Low-Bandwidth HTTP/SSE)      │ (Offline Mode)
                             ▼                               ▼
                    ┌─────────────────┐             ┌─────────────────┐
                    │ Express Backend │             │  PWA Service    │
                    │   Node/TS       │             │  Worker & Cache │
                    └────────┬────────┘             └────────┬────────┘
                             │                               │
              ┌──────────────┴──────────────┐                │ (Queued Sync)
              ▼                             ▼                │
      ┌──────────────┐              ┌──────────────┐         │
      │ PostgreSQL + │              │   Gemma 4    │◄────────┘
      │   PostGIS    │              │ Triage Engine│ (Gemma-as-a-Service)
      └──────────────┘              └──────────────┘
```

### 1. Gemma-as-a-Service (GaaS) API Pipeline
Our backend integrates with the serverless Hugging Face Inference API (`router.huggingface.co/v1`) using secure API credentials to query the instruction-tuned **`google/gemma-4-31b-it`** model. This offloads model weights and expensive GPU computing from the student's mobile device to high-availability cloud hardware. By running Gemma server-side as a microservice (GaaS), student devices consume minimal cellular data and CPU energy, which is critical on budget smartphones with degraded battery health.

To turn raw conversational complaints into structured data, we engineered specialized, schema-constrained prompt pipelines:
* **The Intake Pipeline:** Receives raw student complaints, cleans up localized slang (Hausa, Pidgin expressions), and categorizes the ticket into structured buckets: `broken_lights`, `plumbing`, `wifi_outage`, `security`, `structural`, or `others`.
* **Structured JSON Extraction:** The prompt forces Gemma 4 to return a strict, un-markdown-wrapped JSON payload containing:
  ```json
  {
    "category": "plumbing",
    "priority_score": 4,
    "sentiment": "frustrated",
    "location_hint": "Suleiman Hall walkway gate"
  }
  ```
  Our backend extracts this text, scrubs accidental markdown blocks (e.g., ` ```json `), and parses it safely into our relational database schema.

### 2. Strategic Human-in-the-Loop Voice Handling
Unlike general AI applications that attempt flaky voice-to-text transcriptions, CamPulse purposely rejects server-side automated voice transcription. Due to the high diversity of ABU Zaria's student demographic—which features a linguistic blend of Hausa, English, and Nigerian Pidgin along with diverse regional accents—standard automated speech-to-text engines yield high error rates.
To guarantee absolute fidelity, we implemented a **Human-in-the-Loop Voice Recording pipeline**:
* Students record voice notes directly in the client PWA.
* The raw audio data is packaged and sent securely to the backend without modification.
* These recordings are pinned directly to the ticket dashboard, allowing administrators and technicians to play the exact voice record file. Bypassing faulty transcriptions ensures that the technician receives precise instructions straight from the student's voice, removing linguistic barriers and translation artifacts.

### 3. Zero-Latency Programmatic Fallbacks
If the external AI endpoint times out or is unreachable due to severe cellular latency, our backend **automatically flips to local heuristic engines** to guarantee uninterrupted operations:
* **Heuristic Triage Fallback:** A fast, regular-expression-based keyword matrix matches phrases indicating immediate danger (e.g., *"sparking"*, *"exposed wire"*, *"flooding"*, *"dark corner"*) to calculate safety priority ranks (P1–P5) without relying on an LLM.
* **Semantic Deduplication Fallback (Jaccard Indexing):** If a student submits a complaint and Gemma is unreachable, the server computes a normalized **Jaccard Word-Overlap Similarity** between the new report and nearby open complaints:
  $$J(A, B) = \frac{|A \cap B|}{|A \cup B|}$$
  If the Jaccard coefficient exceeds `0.35` for descriptions within the same spatial sphere, the system automatically flags them as duplicates programmatically, bypassing the cloud LLM entirely.

---

## 🗺️ 4. Postgres + PostGIS Spatial Deduplication & Clustering

Filing 50 separate tickets for a single burst water pipeline in Suleiman Hall ruins maintenance efficiency, floods technician queues, and wastes critical administrative labor. CamPulse solves this by implementing high-precision spatial clustering and semantic deduplication directly in the database.

### 1. The PostGIS Spatial Proximity Sphere
Whenever a student drops a pin and submits a report, the backend captures the geographic coordinate $(lng, lat)$. It queries the PostgreSQL database using the **PostGIS spatial index** (`reports_geom_idx` using `GIST` geometry) to locate all unresolved tickets within a **100-meter radius** of the dropped pin:

```sql
SELECT id, reporter_id, reporter_name, category, description, lat, lng, zone_id, zone_name, status, priority_score, upvotes, upvoted_by, created_at, report_count 
FROM reports 
WHERE status != 'resolved' 
  AND ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 100);
```

#### Understanding the Spatial Query:
* `ST_MakePoint(lng, lat)`: Creates a spatial Point coordinate.
* `ST_SetSRID(..., 4326)`: Projects the point onto the **WGS 84 ellipsoid** (the global coordinate standard used by GPS and Google Maps).
* `geom::geography`: Casts the geometry data type to geography, converting spatial coordinates from flat planar units into spherical meter calculations.
* `ST_DWithin(..., 100)`: Uses a bounding box and index-accelerated spatial scan to verify if coordinates lie within a true 100-meter sphere. This is highly performant and executes in **sub-2ms**, enabling high concurrency.

### 2. Gemma-Driven Semantic Clustering
If the PostGIS query identifies open candidate issues in the immediate area, the system executes our **Semantic Deduplication Prompt** via Gemma-as-a-Service using Gemma 4 31B-it:

```
[System Input to Gemma 4]
Compare this new campus maintenance report with nearby existing open reports.
Determine if the new report describes the EXACT SAME physical issue at the exact same location.

New Report Description: "borehole pipe cracked and spraying dirty water everywhere near Suleiman walkway"

Nearby Open Reports in 100-Meter Sphere:
- ID: "rep-293" | Category: "plumbing" | Description: "borehole line is broken, gate entrance is flooded."

Output your decision as a strict JSON object:
{ "is_duplicate": true, "duplicate_report_id": "rep-293", "confidence_score": 0.95 }
```

### 3. The Clustered Database Merge Operation
If Gemma-as-a-Service determines they describe the same underlying issue, the backend blocks duplicate ticket creation and executes a database merge transaction:

1. **Increment Report Counters:** The server increments `report_count` on the original ticket.
2. **Convert Reporter into an Upvoter:** The new student's ID is appended to the original ticket's `upvoted_by` string array, and the ticket's `upvotes` count is incremented:
   ```sql
   UPDATE reports 
   SET report_count = report_count + 1, 
       upvotes = CASE WHEN NOT ($1 = ANY(upvoted_by)) THEN upvotes + 1 ELSE upvotes END,
       upvoted_by = array_append(upvoted_by, $1)
   WHERE id = $2;
   ```
3. **Automated Status Logs:** An automated comment is appended to the original ticket to notify administrators:
   `"⚠️ Duplicate Merged: Sani Bello's report was clustered here. Reason: Gemma 4 clustering matched this report to existing ticket #rep-293 (confidence: 0.95)"`
4. **SSE Event Broadcast:** A real-time notification is broadcasted across the campus feed to keep the community informed.

---

## ⚡ 5. Overcoming ABU Zaria's Cellular & Energy Constraints

To ensure true civic accessibility, we tailored our Progressive Web Application (PWA) architecture to navigate the physical and infrastructural realities of Kaduna State:

### 1. Offline-First PWA Caching Hierarchy
* **Map Tile Pre-Caching (`sw.js`):** Leaflet map tile assets (`*.png` or `*.webp`) are cached locally in the browser's Cache Storage during active connections. When cellular grids fail, the PWA displays full cached maps of ABU's core campus.
* **Offline IndexedDB/LocalStorage Report Queue:** If a student logs a water leak or exposed wire in a dead-zone (e.g., deep in Suleiman Hall basement walkways), the report form intercepts the network failure, packages the coordinate data, voice note base64, or photo, and queues it locally.
* **Reactive Sync:** Using the HTML5 `navigator.onLine` listener, the moment the student walks into an open area and regains cellular network, the PWA background handler executes an automated background sync, delivering the queued reports to our PostGIS database.

### 2. Solar Legibility & Omission of Dark Mode
To optimize for the high ambient lighting of Northern Nigeria, we purposely made a calculated UX choice: **we completely omitted dark mode from the application**.
Under the intense solar radiation and bright skies of Zaria, dark-mode interfaces suffer from severe reflections and glare, forcing mobile screens to boost backlight brightness to maximum levels. This excessively drains battery power. By standardizing on a single, highly refined **High-Contrast, Clean Light Theme (Slate & Amber accents)** with optimized typographic sizing, the app remains highly readable outdoors under direct sunlight with minimal screen brightness. This design choice directly conserves precious battery power and ensures comfortable student usage during day-to-day campus commutes.

---

### 🚧 Challenges We Ran Into & Solutions

Building a production-ready, full-stack spatial reporting tool in a compressed timeline presented steep challenges:

1.  **Lack of Public Map Geometries for ABU Samaru:** Public mapping APIs do not have high-fidelity architectural footprints for university structures in Northern Nigeria.
    *   *Solution:* We compiled a local campus spatial dataset of 134 coordinate points of interest representing hostels, faculties, gates, and administrative hubs, cross-referencing available public mapping data where possible. A subset of these — primarily smaller facilities without public map listings — are still undergoing manual GPS verification for full precision. We combined client-side Euclidean distance calculations with robust polygon intersection checks in PostGIS to accurately localize reports.
2.  **Maintaining Model Output Reliability:** Standard LLMs frequently inject markdown prose or conversational filler around requested JSON blocks.
    *   *Solution:* We implemented an explicit, schema-constrained prompt wrapper, paired with a robust server-side regular expression filter that strips out non-JSON content and feeds the output to a validation parser with automatic fallbacks.
3.  **Low-Bandwidth Voice Submissions:** Typing a full report is often impractical for students in a hurry or with limited literacy in written English. Real-time speech-to-text transcription would have required additional infrastructure and introduced failure points under the university's unreliable connectivity, and risked losing meaning across Hausa, English, and Pidgin dialects.
    *   *Solution:* We implemented a lightweight voice-note capture feature instead. Students record a short audio note directly in the browser, which is uploaded as a compressed WAV file and attached to the ticket. Rather than routing this through an LLM, the raw audio is surfaced directly to administrators and technicians, who can listen to it firsthand when reviewing or dispatching the ticket — preserving nuance, tone, and dialect-specific detail that a transcription layer might lose, without adding a fragile AI dependency to the core loop.

## 🏆 6. Structured Summary of Completed Work (Development Lifecycle)

From initial database design to the final optimized production build, we successfully engineered and validated the entire application stack:

### Phase 1: Database Engineering, PostGIS Schemas, & Performance Tuning
* **100% Relational Schema:** Designed and deployed a robust PostgreSQL database structure consisting of 7 distinct tables (`users`, `zones`, `reports`, `assignments`, `comments`, `notifications`, and `technicians`) inside `server.ts`.
* **Database Optimization Matrix:** Executed database indexing to handle massive scale. Created **13 dedicated indices** across heavy filter columns (e.g., `reports_geom_idx` using `GIST` geometry for PostGIS, and indices on `reports.status`, `reports.category`, and chronological orders `created_at DESC`), achieving average query execution times of **under 10ms**.
* **Campus Zone Mapping:** Compiled and progressively verified 134 landmark zones across ABU Samaru campus, cross-referencing public mapping sources to correct and refine point-of-interest coordinates for accurate localization.

### Phase 2: Gemma-as-a-Service (GaaS) API Engineering
* **Hugging Face API Pipeline:** Configured a secure server-side `callGemmaAI` helper function to execute queries against the high-performance **`google/gemma-4-31b-it`** model using direct Hugging Face API tokens.
* **Structured Output Sanitization:** Built a robust regex-based extraction pipeline to parse AI string outputs into raw, valid JSON, protecting the app from JSON-parsing crashes.
* **Programmatic Fallbacks:** Engineered offline Jaccard overlap similarity scoring (threshold: `0.35`) and rule-based priority mapping matrices to handle cellular outages.

### Phase 3: Multi-Role Civic Portals & Interactive Map Controls
* **Student Reporting Hub:** Built a high-contrast React 19 UI allowing students to submit text/voice reports, upload base64 images, filter feeds, and view open issues.
* **Admin Control Center & AI Dispatcher:** Created real-time metrics dashboards (Recharts), workload grid boards, and an automated voice/text AI dispatcher that parses administrative intents to assign work orders.
* **Technician Task Queues:** Implemented active job queues, stage transitions, and mandated photo proof-of-work upon resolution.

### Phase 4: Offline Resilience, Sunlight Optimization, & Verification
* **PWA Cache & Offline Queue:** Implemented a robust Service Worker (`sw.js`) and reactive browser storage queue displaying cached items to students when disconnected.
* **Sunlight-Optimized Theme:** Hand-crafted a pure, high-contrast light layout omitting dark mode variables, dramatically improving sunlight readability and reducing smartphone battery drain.
* **Rigorous Verification & Compiling:** Conducted full lint checks (`npm run lint`), compiled the final production bundle cleanly with zero errors or warnings, and successfully deployed to Render.

### 📹 The Prototype

*   **2-Minute Walkthrough Video:** ()
*   **Public Code Repository:** (https://github.com/Bukarr/CamPulse/)
*   **Live Web Demo:** (https://campus-abu.onrender.com)

## 🤖 Disclosure: AI-Assisted Development Tools

Per the competition's Automated Machine Learning Tools (AMLT) disclosure requirement, the CamPulse team used AI coding assistants throughout development to support code generation, debugging, and documentation. All architectural decisions, Gemma 4 prompt engineering, database design, and feature logic were designed, reviewed, and validated by the team.

---
*Developed by Team TechWise, for the Build with Gemma Hackathon, GDGoC ABU Zaria🚀
