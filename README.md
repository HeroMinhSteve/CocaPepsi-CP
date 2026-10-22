# 🥤 CocaPepsi CP

**CocaPepsi CP** is a premium, feature-rich Chrome extension designed to supercharge your competitive programming workflow on **Codeforces**, **CSES (cses.fi)**, **UOJ-based (qoj.ac, loj.ac)**, **AtCoder (atcoder.jp)**, **oj.uz**, **DMOJ-based OJs** (dmoj.ca, oj.vnoi.info, qhhoj.com), **USACO**, **POJ (poj.org)**, **Luogu**, and **Kilonova (kilonova.ro)**. By introducing custom in-page editors, live status tracking, seamless PDF rendering, and keyboard shortcuts, it eliminates unnecessary page loads and clicks, letting you focus entirely on solving problems.

---

## 🚀 Supported Platforms

- **Codeforces** (`*.codeforces.com` — including standard contests, gym, and group contest subdomains)
- **CSES** (`cses.fi`)
- **QOJ** (`qoj.ac`)
- **LOJ** (`loj.ac`)
- **AtCoder** (`*.atcoder.jp`)
- **oj.uz** (`*.oj.uz`)
- **DMOJ** (`dmoj.ca`)
- **VNOI** (`oj.vnoi.info`)
- **QHHOJ** (`qhhoj.com`)
- **USACO** (`usaco.org`)
- **POJ** (`poj.org`, `www.poj.org`)
- **Luogu** (`luogu.com.cn`)
- **Kilonova** (`kilonova.ro`)

---

## ✨ Features

### 🏆 Codeforces Enhancements

* **💻 Sleek In-Page Code Editor:**
  - Converts the default file-upload input into a dark-themed, resizable, monospace text area so you can paste code directly.
  - Form automatically submits in a new tab (`target="_blank"`), keeping your problem description open.
  - Styled center-positioned submit button (*"Here goes nothing"*).
* **⏱️ Timer & Live Verdict Tracker Widget:**
  - A floating, draggable widget displays on problem pages to track your solving time.
  - Real-time verdicts polled directly from the Codeforces API (e.g. *Testing on case X*, *Accepted*, *Wrong Answer*) appear dynamically without page reloads.
  - Smart status preservation using `localStorage` ensures that timers are saved per-problem so you never lose track if you reload or close the tab.
  - Automatically detects if the problem has already been solved upon page load to finish/pause the widget.
* **⚠️ PyPy Speed Notice:**
  - Injects a smart reminder when choosing language options: *"Almost always, if you send a solution on PyPy, it works much faster."*
* **🛡️ Submission Safety:**
  - Prevents accidental duplicate submissions by disabling buttons temporarily after clicking.
  - Corrects encoding format and ensures background session tokens (`ftaa`/`bfaa`) are injected during text area submits.
* **📄 Contest PDF Downloader & Clean Print:**
  - Injects a **"Download Contest PDF"** button in contest and gym sidebars (including group contests on subdomains).
  - Automatically loads a print-friendly "Clean Room" view with `?cocapepsi_print=true`, stripping away margins, sidebars, headers, and comments.
  - Wait-logic polls for all problems and ensures MathJax formulas are rendered perfectly before triggering the browser's native print interface.
* **🏷️ Spoiler-Free Tags Toggle:**
  - Automatically hides tags (except for problem difficulty/rating) on problem pages to prevent spoilers.
  - Provides a toggle button (*"Show tags"* / *"Hide tags"*) next to the labels.
* **⭐ In-Status Problem Ratings:**
  - Fetches the active problemset directory from Codeforces API and shows the rating next to the problem name on status pages (e.g. `(*1600)`).
  - Caches ratings in `localStorage` for 24 hours to minimize API hits.
* **🧘 Zen Standings Mode:**
  - Hides everyone else in the contest standings except for you, helping you maintain focus.
  - Hides the Rank (`#`) column when active to eliminate ranking anxiety.
  - Premium styled toggle button appears above the standings table.
  - Fully customizable text, alignment, and hotkey inside the script.

---

### 🏛️ UOJ-Based Enhancements (QOJ, LOJ)

* **💻 File-Spoofing Architecture:**
  - Automatically hides the native file upload input and injects the premium Dark Mode Code Editor.
  - Converts your typed code into a virtual file payload (`.cpp`, `.py`, etc.) and silently overwrites the native `DataTransfer` object.
* **🛡️ Anti-Logout Safe Submit:**
  - `Ctrl + Enter` inside the custom editor stops event propagation (preventing the host site from swallowing the event) and triggers a physical button `.click()` to safely preserve CSRF session tokens.
* **🎯 Smart Submit Navigation:**
  - `Alt + S` instantly finds the submit tab and redirects you.

---

### 🗾 AtCoder Enhancements

* **🎯 Automatic Ace Editor Focus:**
  - Aggressively polls for the Ace Editor's internal input on submit pages and auto-focuses it within 3 seconds, so you can paste code immediately.
* **🚀 Smart Submit Navigation:**
  - On task pages, `Alt + S` automatically navigates to the submit page with the correct `taskScreenName` parameter pre-filled.
* **⚡ Instant Submit:**
  - `Ctrl + Enter` triggers native form submission directly from the Ace editor using `requestSubmit()`, with a fallback to `.click()`.
  - Also supports the Chrome Commands API bridge (`NUKES_AWAY`) as a nuclear fallback.

---

### 🍁 DMOJ & VNOI Enhancements

* **🧘 Zen Mode (Distraction-Free Reading & Ranking):**
  - Press `Alt + Z` or `\` *(Backslash)* (or click the floating button) to toggle Zen Mode.
  - When enabled, hides the navbar, sidebar, footer, comments, and user-info blocks without breaking problem tabs.
  - The main content area expands and centers for a clean, distraction-free reading experience.
  - Hides all other users on the ranking scoreboard, similar to Codeforces Zen Mode.
  - Intelligent `MutationObserver` automatically catches dynamic ranking score updates (the ~30s auto-refresh) and re-tags/re-hides competitor rows seamlessly.
  - State persists across page loads via `localStorage`.
  - Sleek floating toggle pill in the bottom-left corner with green/gray accent.

---

### ⚡ QHHOJ Enhancements (frontend-v2)

* **🧘 Zen Standings & Live Rival Whitelist:**
  - Full compatibility with QHHOJ's modern `frontend-v2` (Vue 3, Tailwind CSS, PrimeVue) and `backend-v2`.
  - **Comprehensive Standings Hiding:** Hides all competitors on contest ranking tables (`/contests/:key/ranking`), site-wide user leaderboards (`/users`), replay boards (`/contests/:key/replay`), and public rankings.
  - **Podium Elimination:** Automatically hides the top-3 podium cards (`RankingPodium.vue`) above the table to avoid spoiler rankings.
  - **Dynamic Rival Whitelist:** A floating, draggable Zen control panel lets you type comma-separated rival usernames in real-time, instantly displaying them alongside your row.
  - **Smart Viewer Detection:** Automatically identifies your logged-in username across Vue 3 desktop `UserMenu`, mobile phone menu identity, and table-level indicators (`bg-surface-hover`, `bg-accent-soft`, and `<Chip>Bạn</Chip>`).
  - **Rank Masking:** Masks numerical rank positions with `—` in table rows and jump buttons (`[data-testid="my-row"]` and `[data-testid="my-rank"]`) to eliminate ranking anxiety.
  - **Instant State Restoration:** Cleanly unhides all rows, reveals the podium, and restores exact ranks upon toggling Zen Mode OFF.
  - Toggle with `Alt + Z` or `\` *(Backslash)*, or via the interactive floating panel.
* **⏱️ Problem Timer & HUD:**
  - Draggable, persistent per-problem timer HUD with absolute elapsed time calculation.
* **🚀 Submit Drawer Shortcuts:**
  - `Alt + S` triggers the submit sidebar/drawer and auto-focuses the Monaco code editor.
  - `Ctrl + Enter` (or `Cmd + Enter`) triggers safe submission from within the editor drawer.

---

### 🏔️ CSES Enhancements

* **💻 Sleek In-Page Code Editor & HUD:**
  - Converts the default file-upload input into a dark-themed, resizable monospace text area for direct code pasting.
  - Injects a decoupled floating, draggable HUD containing a global language selector and a persistent per-problem timer.
  - The HUD position persists universally across all supported OJs.
  - Automatically synchronizes your target language selection from the HUD with CSES's native language dropdown.
  - HUD and editor are permanently locked to Dark Mode for consistent aesthetic contrast.
* **⏱️ Persistent Per-Problem Timer:**
  - Tracks elapsed time using `Date.now()` to prevent drift, with sleek Play/Pause and Reset controls.
  - Timers are namespaced to the specific problem ID (e.g., `coca_pepsi_timer_running_1068`), ensuring state perfectly survives tab reloads and navigation between task and submit pages.
* **🚀 Smart Submit Navigation:**
  - On problem pages, `Alt + S` instantly finds and clicks the "Submit" tab.
  - On submit pages, automatically detects and switches from "File Upload" view to "Editor" view.
* **⚡ Instant Submit Payload Generator:**
  - Hitting `Ctrl + Enter` inside the custom editor generates a virtual file payload (e.g., `.cpp`, `.py`) based on your global language selection, injects it into the native form, and triggers a bulletproof submission.

---

### 🇺🇸 USACO Enhancements

* **💻 Decoupled HUD & Editor in Light Theme:**
  - Converts the legacy file-upload input into a custom code editor textarea.
  - Permanently styled with a clean Light Theme (white background, dark text, light-gray borders) to seamlessly match the native USACO layout.
  - HUD includes a fully draggable, persistent per-problem timer (namespaced to the USACO problem ID) and a global language selector.
  - The HUD position persists universally across all supported OJs.
* **🎯 C++17 Priority Targeting:**
  - When "C++" is selected in the HUD, the synchronization engine automatically scans the native dropdown and selects C++17. If C++17 is not found, it falls back to a generic C++ version (preventing accidental default C++11 selects).
* **⚡ Safe Submission & Ctrl + Enter:**
  - Hitting `Ctrl + Enter` inside the custom editor builds the virtual file payload (e.g., `.cpp`, `.py`, `.java`), syncs the native dropdown, and clicks the native submit button.
  - Submits using direct physical button click logic to preserve USACO's CSRF session tokens and prevent dropouts.

---

### 🎓 POJ Enhancements

* **💻 Draggable Dark Mode HUD & Timer:**
  - Injects a floating, draggable HUD with a permanent Dark Theme aesthetic (`#1e1e1e` background, `#00ffcc` timer text).
  - Uses absolute timestamp elapsed calculation (`Date.now() - startTime`) to track time accurately.
  - Position is fully draggable and persists across all HUD-enabled OJs using `localStorage`.
* **🚀 Smart Submit Navigation:**
  - `Alt + S` instantly finds the submit link and navigates you to the submit page.
* **⚡ Instant Submit:**
  - `Ctrl + Enter` safely triggers the physical submit button on the submission page.

---

### 洛谷 Luogu Enhancements

* **⚡ SPA-Aware Architecture:**
  - Flawlessly integrates with Luogu's Vue.js Single Page Application routing, automatically re-initializing the HUD without requiring page reloads.
* **💻 Decoupled Draggable HUD & Timer:**
  - Persistent, per-problem timer that automatically pauses when you switch tabs or lose focus, and resumes when you return.
  - The HUD position persists universally across all supported OJs.
* **📡 Live Submission State Fetcher & Auto-Stop:**
  - Automatically polls the Luogu API every 8 seconds for the latest submission status on the current problem.
  - Renders a live status badge (e.g., `⏳ [ Pending ]`, `❌ [ WA ]`).
  - **Auto-Stop on AC:** When an `Accepted` (Status 12) is detected, the timer freezes permanently, turns green, and saves your official solve time.
* **🚀 Safe Submission:**
  - `Alt + S` seamlessly scrolls to and clicks the Vue-rendered Submit button.
  - `Ctrl + Enter` safely triggers the physical submission button, respecting Luogu's native DOM structure.

---

### 🇷🇴 Kilonova Enhancements (kilonova.ro)

* **⚡ SPA-Aware Polling & Dynamic Problem ID Extraction:**
  - Automatically handles Single Page Application navigation through a periodic `tick()` loop alongside `popstate`, `hashchange`, and `htmx:afterSwap` lifecycle listeners.
  - Dynamically extracts problem identifiers from standalone (`/problems/:id`) and contest (`/contests/:id/problems/:id`) URL paths.
  - Automatically re-mounts the HUD if destroyed by dynamic DOM morphing or transitions.
* **💻 Draggable Dark Mode HUD & Persistent Timer:**
  - Floating HUD with permanent dark theme aesthetic (`rgba(18, 18, 22, 0.96)` background, subtle cyan glow, and `#00ffcc` glowing monospace timer text).
  - Cross-OJ drag-and-drop mobility saving bounded `coca_pepsi_hud_x` and `coca_pepsi_hud_y` coordinates to `localStorage`.
  - Persistent per-problem timer state namespaced by `problemId` with drift-proof absolute timestamp calculation (`Date.now() - startTime`).
  - Immediate display re-sync upon tab focus (`visibilitychange`).
* **🚀 Smart Submit Navigation (`Alt + S`):**
  - Capture-phase hotkey hunting for Kilonova's native submit tab, button, or file upload trigger across English and Romanian localization terms (*Submit*, *Trimite*, *Trimite Solutia*, *Incarca Cod*, *Upload Code*, *Încărcare Cod*).
  - Executes smooth scrolling, triggers `.click()`, and polls to focus the active code editor (Ace, Monaco, CodeMirror, standard textarea, or file input).
  - If no submit trigger exists on the statement page, seamlessly routes to `/problems/:id/submit`.
* **⚡ Instant Payload Launch (`Ctrl + Enter`):**
  - Capture-phase keydown listener for `Ctrl + Enter` (and `Cmd + Enter`) with event propagation stopped.
  - Targets the final physical submit button inside the active submission form and triggers native `.click()`.

---

## ⌨️ Keyboard Shortcuts

| Platform | Shortcut | Action |
| :--- | :--- | :--- |
| **Codeforces** | `Alt + S` | Smoothly scrolls to and focuses on the code submission text area. |
| **Codeforces** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits the form. |
| **Codeforces** | `\` *(Backslash)* | Toggles Zen Standings mode on the standings page. |
| **CSES** | `Alt + S` | Navigates from a problem page to the submit page. |
| **CSES** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits the code inside the editor. |
| **QOJ / LOJ** | `Alt + S` | Redirects from the problem page to the submission page. |
| **QOJ / LOJ** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits the code using the file-spoofing exploit and safe button click. |
| **AtCoder** | `Alt + S` | Navigates from a task page to the submit page with the task pre-selected. |
| **AtCoder** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits the code from the Ace editor. |
| **oj.uz** | `Alt + S` | Navigates from a problem page to the submit page. |
| **oj.uz** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits code via physical `.click()` with event propagation stopped (preventing accidental logouts/CSRF dropouts). |
| **DMOJ / VNOI** | `Alt + S` | Opens the submit page in a new tab from a problem page. |
| **DMOJ / VNOI** | `Alt + Z` or `\` | Toggles Zen Mode (distraction-free reading & rankings). |
| **DMOJ / VNOI** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits the code from the Ace editor. |
| **QHHOJ** | `Alt + S` | Toggles the submission drawer and auto-focuses the Monaco code editor. |
| **QHHOJ** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits the solution inside the open editor drawer. |
| **QHHOJ** | `Alt + Z` or `\` | Toggles Zen Standings mode (podium hiding, competitor rows hiding, rank masking). |
| **USACO** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Automatically builds the payload, syncs C++17 dropdown, and safely clicks submit. |
| **POJ** | `Alt + S` | Smoothly scrolls to the submit link and clicks it, or redirects. |
| **POJ** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Safely submits the code on the submit page. |
| **Luogu** | `Alt + S` | Smoothly scrolls to the submit button and clicks it, or navigates to the submit anchor. |
| **Luogu** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Safely submits the code from the editor area. |
| **Kilonova** | `Alt + S` | Smoothly scrolls to and clicks the submit tab/trigger, or routes to the submit page, and auto-focuses editor. |
| **Kilonova** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Safely triggers the final physical submit button inside the active submission form. |

---

## 📁 File Structure

```
CocaPepsi CP/
├── manifest.json      # Extension metadata, MV3 definitions & script routing
├── background.js      # Service worker for Chrome Commands API bridge
├── Codeforces.js      # All Codeforces feature implementations
├── cses.js            # CSES custom editor, HUD timer, and instant submit payload generator
├── QOJ.js             # UOJ-based (QOJ/LOJ) file spoofing and safe submit logic
├── AtCoder.js         # AtCoder task navigation, editor focus & quick submit
├── ojuz.js            # oj.uz task navigation, editor focus & quick submit
├── DMOJ.js            # DMOJ & VNOI navigation, editor focus & Zen mode
├── qhhoj.js           # QHHOJ v2 Zen standings, podium elimination, rival whitelist & submit drawer
├── usaco.js           # USACO light-themed custom editor, HUD timer, and language synchronizer
├── poj.js             # POJ dark mode draggable HUD, timer, and quick submit logic
├── luogu.js           # Luogu SPA-aware HUD, live status fetcher, and focus-aware timer
├── kilonova.js        # Kilonova SPA-aware dark HUD, timer, Alt+S jump to submit & quick submit
├── LICENSE.txt        # MIT License
├── README.md          # Project documentation
└── icons/             # Custom extension logos (16px, 48px, 128px)
```

---

## ⚙️ Installation

1. Clone or download this repository to your local machine.
2. Open Google Chrome (or any Chromium-based browser like Brave, Edge, Opera).
3. Navigate to `chrome://extensions/`.
4. Enable **Developer Mode** using the toggle switch in the top-right corner.
5. Click on **Load Unpacked** in the top-left corner.
6. Select the `CocaPepsi CP` folder containing `manifest.json`.
7. Happy coding! 🚀
