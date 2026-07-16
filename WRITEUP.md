### 💡 Inspiration
**What local problem are you solving today?**

Ahmadu Bello University (ABU) Zaria, Samaru Campus is the largest university in Sub-Saharan Africa, accommodating over 50,000 students and staff across massive residential hostels and academic faculties. With a sprawling utility network in Northern Nigeria, physical infrastructure is prone to severe weather stresses and heavy load shedding. 

Maintenance complaints—such as borehole water leakages, electrical power failures in lecture halls, and network outages—often go unreported or delayed because of highly manual reporting routes. This results in student welfare issues, safety hazards, and academic disruption that can last for weeks.

**CamPulse** directly bridges this communication gap. It is an offline-capable, lightweight Progressive Web App (PWA) tailored specifically for ABU Zaria. It enables students to instantly report campus facility failures with geolocation mapping, photos, or voice notes (utilizing localized language transcription to support diverse users), which are then automatically categorized and prioritized by our on-campus triage engine to dispatch the right technician within hours.

---

### 🛠️ How we built it
**Which Gemma model did you use? Did you use RAG, prompt engineering, or fine-tuning? What frameworks (Transformers, Keras, etc.) did you use?**

We integrated Google's **Gemma 4** (`google/gemma-2-27b-it`) model to serve as the core intelligent triage engine. Instead of expensive self-hosting or heavy client-side execution, we routed queries server-side to the Hugging Face Inference API (`router.huggingface.co/v1`) using secure API credentials.

Our implementation architecture focused on:
1. **Advanced Prompt Engineering with Strict JSON Outputs:** We engineered highly descriptive system prompts and instruction formats using a standard OpenAI chat completion syntax to achieve 100% reliable structure. This allows Gemma 4 to analyze unstructured text and photo proofs to classify issue category (`broken_lights`, `plumbing`, `wifi_outage`, `security`, `structural`), extract a location hint, determine student sentiment, and assign a priority score (1 to 5).
2. **AI-Powered Semantic Duplication & Clustering:** To prevent ticket backlog flooding, whenever a new report is filed, the system performs geo-proximity checks and passes surrounding tickets to Gemma 4. Gemma 4 evaluates if they describe the same underlying issue (e.g., "no lights in Block A" vs "power outage in Block A") and automatically merges duplicates, notifying interested students.
3. **Multilingual Speech Translation and Interpretation:** For physical workers or students who find it easier to explain issues verbally, users can submit voice recordings. The backend passes the audio/transcript through Gemma 4 with localized prompts, translating Hausa colloquial terms and slang into structured, technical work-order descriptions.

**Tech Stack Frameworks:**
- **Frontend:** React 19, Tailwind CSS, Leaflet Maps (`react-leaflet`), and standard HTML5 Geolocation API.
- **Backend:** Node.js Express Server, compiled into a self-contained CommonJS bundle using `esbuild`.
- **Database:** PostgreSQL on Supabase with geospatial capabilities.
- **AI Access:** Hugging Face Inference API client for gemma-2-27b-it.

---

### 📹 The Prototype
**The 2-minute Demo Video and Code Repositories:**

*   **2-Minute Demo Video:** [Insert Link to your 2-minute Demo Video here]
*   **Kaggle Notebook / GitHub Repository:** [Insert Link to your Kaggle Notebook / GitHub Repo here]

---

### 🚧 Challenges we ran into
**What was the hardest part of building this in one day?**

1. **Ensuring 100% Reliable Offline Capability under Unstable Campus Networks:** Network drops and bandwidth throttling are common on university campuses in Nigeria. We had to implement a comprehensive client-side caching layer using Service Workers and IndexedDB/Local Storage to cache reports and map tiles locally, queuing them for background synchronization when a connection is restored.
2. **Enforcing Strict Structured Output from Gemma 4:** Getting LLMs to return strict, parseable JSON arrays and objects without trailing commas, markdown prose, or conversational filler is notoriously difficult under rapid response constraints. We resolved this through fine-tuned, few-shot prompting, schema-constrained priming, and rigorous server-side string validation and fallback parsers.
3. **Role-Based Token Verification and Session Propagation:** Building a secure, multi-tier dashboard where students file reports, admins assign tasks, and technicians complete work orders required a secure JSON-Web-Token (JWT) system. Debugging custom token formats with hyphenated usernames across all API endpoints in one day was a meticulous process.
