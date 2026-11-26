# Hotkey-Cpp-Solver

**Browser-to-C++ automation pipeline** that captures highlighted problem statements directly from any webpage via a global hotkey (`Ctrl+Shift+Q`), processes them through a local Node.js/Express server integrated with the Groq API (`llama-3.3-70b-versatile`), and saves uniquely indexed `.cpp` solution files to disk.

**Status:** Experimental / Prototype — Core browser-to-server capture, Groq API integration, atomic file counter, and logging are implemented; currently refining output parsing and runtime stability.

---

## System Architecture

```text
[ Browser Webpage ] 
       │  Highlight text + press Ctrl+Shift+Q
       ▼
[ Tampermonkey Userscript (.user.js) ]
       │  HTTP POST (/receive-text) -> localhost:3000
       ▼
[ Node.js / Express Bridge (server.js) ]
       │  Loads .env prompt & API key -> Groq Chat Completions API
       ▼
[ Local Filesystem Output ]
       ├── solutions/file_<timestamp>-<id>.cpp
       ├── identity_individual_number.txt  (persistent counter)
       └── logs/server_activity.log        (structured execution logs)
```

---

## Key Features

* **Zero-Friction Browser Capture:** Custom Tampermonkey userscript listens for `Ctrl+Shift+Q` across web pages, displays a visual overlay confirmation, and transmits selected text to `localhost` without leaving the tab.
* **Local Express & Groq API Bridge:** Lightweight Node.js backend handles CORS/preflight requests, injects configurable system prompts via `.env`, and queries `llama-3.3-70b-versatile` for C++ code generation.
* **Collision-Free File Persistence:** Combines ISO timestamps with a persistent plain-text ID counter (`identity_individual_number.txt`) and validation checks to guarantee unique `.cpp` filenames across sessions.
* **Structured File Logging:** Records incoming payloads, API status responses, file writes, and pipeline exceptions to a local log file for offline debugging.

---

## Setup & Usage

### 1. Server Configuration
1. Install Node.js dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in your credentials and local paths:
   ```env
   API_KEY=your_groq_api_key_here
   PORT=3000
   FOLDER_PATH=solutions
   FILE_COUNTER=identity_individual_number.txt
   LOG_FILE=logs/server_activity.log
   SYSTEM_PROMPT=Enter your custom C++ solver system prompt here
   ```
3. Ensure the `solutions/` and `logs/` directories exist, initialize `identity_individual_number.txt` with `0`, and start the server:
   ```bash
   node server.js
   ```

### 2. Browser Client (Tampermonkey)
1. Install the **Tampermonkey** extension in Chrome, Edge, or Firefox.
2. Open the `.user.js` file in this repository and click **Raw** (or paste the script into a new Tampermonkey dashboard script).
3. Highlight any text in your browser and press **`Ctrl + Shift + Q`** to trigger generation.

---

## Roadmap

* [x] Tampermonkey hotkey listener & visual overlay
* [x] Local Express POST endpoint & CORS handling
* [x] Groq API integration with `.env` configuration
* [x] Persistent file counter & timestamped `.cpp` output
* [ ] Hook up C++ markdown/comment sanitizer (`validateAndCleanCplusplus`) to output pipeline
* [ ] Add mutex/atomic file-write safeguards for concurrent requests
* [ ] Bind Express strictly to `127.0.0.1` loopback interface

