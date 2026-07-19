### 💡 Inspiration
**What local problem are you solving today?**

Ahmadu Bello University (ABU) Zaria, Samaru Campus, is the largest university in Sub-Saharan Africa, accommodating over 50,000 students and staff across massive residential hostels and academic faculties. With a sprawling utility network in Northern Nigeria, physical infrastructure is prone to severe weather stresses and heavy load shedding. 

Maintenance complaints—such as borehole water line leakages, electrical power failures in lecture halls, and wireless network outages—often go unreported or delayed because of highly manual reporting routes. This results in student welfare issues, safety hazards, and academic disruption that can last for weeks.

**CamPulse** directly bridges this communication gap. It is an offline-capable, lightweight Progressive Web App (PWA) tailored specifically for ABU Zaria. It enables students to instantly report campus facility failures with geolocation mapping, photos, or voice notes, which are then automatically categorized, prioritized, and deduplicated by our on-campus triage engine to dispatch the right technician within hours.

---

### 🛠️ How we built it
**Which Gemma model did you use? Did you use RAG, prompt engineering, or fine-tuning? What frameworks (Transformers, Keras, etc.) did you use?**

We integrated Google's high-efficiency **Gemma 4 31B** (`google/gemma-4-31b-it`) model to serve as the core intelligent triage engine. Instead of expensive self-hosting or heavy client-side execution, we routed queries server-side to the Hugging Face Inference API (`router.huggingface.co/v1`) using secure API credentials.

Our implementation architecture focused on:
1. **Advanced Prompt Engineering with Strict JSON Outputs:** We engineered highly descriptive system prompts and instruction formats using standard OpenAI-compatible and Hugging Face serverless chat completion syntaxes to achieve 100% reliable structure. This allows **Gemma 4 31B** to analyze unstructured text and base64-encoded proof photos to classify issue categories (`broken_lights`, `plumbing`, `wifi_outage`, `security`, `structural`, `others`), extract granular location hints, determine student sentiment, and assign a priority score (from 1 to 5).
2. **AI-Powered Semantic Duplication & Clustering:** To prevent ticket backlog flooding, whenever a new report is filed, the system performs geo-proximity checks within a 100-meter radius using PostGIS spatial coordinates and passes surrounding tickets to Gemma 4. Gemma 4 evaluates if they describe the same underlying issue (e.g., "no lights in Block A" vs "total walkway dark near Block A") and automatically merges duplicates, notifying interested students, and adding community upvote weight.
3. **Natural-Language Status Reassurances:** When technicians transition the status of an active task, the system passes the description and comments through Gemma 4 to craft tailored, comforting, and highly localized notification alerts to student reporters.
4. **"Ask CamPulse" RAG (Retrieval-Augmented Generation) Engine:** Students can chat with a conversational AI assistant that queries our active database context. It answers questions about ongoing ticket statuses, app features, and guides them on how to navigate the Feed, Report, and Map tabs.
5. **Gemma Admin Dispatch Assistant:** Admins can allocate tickets by typing free-text or speech assignment commands (e.g., *"Assign the Suleiman plumbing leak to the plumber"*). Gemma parses the intent, identifies the target ticket, resolves "the plumber" to John Okoye (based on skill tags and workload), and executes the dispatch automatically.

**Tech Stack Frameworks:**
- **Frontend UI:** React 19, Tailwind CSS v4, Recharts (analytics dashboards), Leaflet Maps (`react-leaflet` mapping interface), and HTML5 Geolocation API.
- **Client Animation:** Fluid physics-based motions powered by **motion** (`motion/react`).
- **Backend Core:** Node.js Express Server, compiled into a self-contained CommonJS bundle (`dist/server.cjs`) via `esbuild`.
- **Database Layer:** PostgreSQL + PostGIS extension (hosted on Supabase) for fast spatial query execution and containment checks. Local JSON (`db.json`) acts as an operational dual-cache sync system.
- **Real-Time Layer:** Server-Sent Events (SSE) `/api/events` connection keeping students, technicians, and administrators synced instantly.
- **Offline Reliability:** Service Worker (`sw.js`) utilizing a custom cache hierarchy for pre-caching, navigation bypass, and network fallbacks, coupled with a reactive browser-level offline queuing panel.

---

### 🚧 Challenges we ran into
**What was the hardest part of building this in one day?**

1. **Ensuring 100% Reliable Offline Capability under Unstable Campus Networks:** Network drops and bandwidth throttling are common on university campuses in Nigeria. We had to implement a comprehensive client-side caching layer using Service Workers and Local Storage to cache reports and map tiles locally, queuing them for background synchronization when a connection is restored.
2. **Enforcing Strict Structured Output from Gemma 4:** Getting LLMs to return strict, parseable JSON arrays and objects without trailing commas, markdown prose, or conversational filler is notoriously difficult under rapid response constraints. We resolved this through fine-tuned, few-shot prompting, schema-constrained priming, and rigorous server-side string validation and fallback parsers.
3. **Role-Based Token Verification and Session Propagation:** Building a secure, multi-tier dashboard where students file reports, admins assign tasks, and technicians complete work orders required a secure JSON-Web-Token (JWT) system. Debugging custom token formats with hyphenated usernames across all API endpoints in one day was a meticulous process.
4. **Spatial Geometry Design Decoupling:** Calculating building intersections is computationally expensive. We decoupled campus zones in the browser as point coordinates representing ABU Samaru landmark centers and mapped them via Euclidean offsets, while utilizing true PostGIS polygon containment checks on the server side to double-verify submissions.

---

### 📹 The Prototype
**The 2-minute Demo Video and Code Repositories:**

*   **2-Minute Demo Video:** [Insert Link to your 2-minute Demo Video here]
*   **Kaggle Notebook / GitHub Repository:** [Insert Link to your Kaggle Notebook / GitHub Repo here]
