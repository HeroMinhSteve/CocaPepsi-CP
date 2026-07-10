# 🥤 CocaPepsi CP

**CocaPepsi CP** is a premium, feature-rich Chrome extension designed to supercharge your competitive programming workflow on **Codeforces**, **CSES (cses.fi)**, **QOJ (qoj.ac)**, **AtCoder (atcoder.jp)**, **oj.uz**, and **DMOJ-based OJs** (dmoj.ca, oj.vnoi.info, qhhoj.com). By introducing custom in-page editors, live status tracking, seamless PDF rendering, and keyboard shortcuts, it eliminates unnecessary page loads and clicks, letting you focus entirely on solving problems.

---

## 🚀 Supported Platforms

- **Codeforces** (`*.codeforces.com` — including standard contests, gym, and group contest subdomains)
- **CSES** (`cses.fi`)
- **QOJ** (`qoj.ac`)
- **AtCoder** (`*.atcoder.jp`)
- **oj.uz** (`*.oj.uz`)
- **DMOJ** (`dmoj.ca`)
- **VNOI** (`oj.vnoi.info`)
- **QHHOJ** (`qhhoj.com`)
- **USACO** (`usaco.org`)

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

### 🏛️ QOJ Enhancements

* **⚡ Sandbox-Bypassing Shortcuts:**
  - Injects a Main World script to bypass Chrome's extension sandbox, capturing inputs before QOJ's advanced code editors (like Ace / CodeMirror) can swallow the `Ctrl + Enter` keydown events.
* **🎯 Automatic Focus:**
  - Instantly focuses the main cursor on the code editor textarea upon navigating to the submission page, saving precious seconds.
* **🔗 Direct Submission Navigation:**
  - Detects the problem page layout and automatically routes to the submission page via keyboard.

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

### 🍁 DMOJ Enhancements

* **🧘 Zen Mode (Distraction-Free Reading & Ranking):**
  - Press `Alt + Z` or `\` *(Backslash)* (or click the floating button) to toggle Zen Mode.
  - When enabled, hides the navbar, sidebar, footer, comments, and user-info blocks without breaking problem tabs.
  - The main content area expands and centers for a clean, distraction-free reading experience.
  - Hides all other users on the ranking scoreboard, similar to Codeforces Zen Mode.
  - Intelligent `MutationObserver` automatically catches dynamic ranking score updates (the ~30s auto-refresh) and re-tags/re-hides competitor rows seamlessly.
  - State persists across page loads via `localStorage`.
  - Sleek floating toggle pill in the bottom-left corner with green/gray accent.

---

### 🏔️ CSES Enhancements

* **💻 Sleek In-Page Code Editor & HUD:**
  - Converts the default file-upload input into a dark-themed, resizable monospace text area for direct code pasting.
  - Injects a decoupled floating HUD containing a global language selector and a persistent per-problem timer.
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
  - HUD includes a persistent per-problem timer (namespaced to the USACO problem ID) and a global language selector.
* **🎯 C++17 Priority Targeting:**
  - When "C++" is selected in the HUD, the synchronization engine automatically scans the native dropdown and selects C++17. If C++17 is not found, it falls back to a generic C++ version (preventing accidental default C++11 selects).
* **⚡ Safe Submission & Ctrl + Enter:**
  - Hitting `Ctrl + Enter` inside the custom editor builds the virtual file payload (e.g., `.cpp`, `.py`, `.java`), syncs the native dropdown, and clicks the native submit button.
  - Submits using direct physical button click logic to preserve USACO's CSRF session tokens and prevent dropouts.

---

## ⌨️ Keyboard Shortcuts

| Platform | Shortcut | Action |
| :--- | :--- | :--- |
| **Codeforces** | `Alt + S` | Smoothly scrolls to and focuses on the code submission text area. |
| **Codeforces** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits the form. |
| **Codeforces** | `\` *(Backslash)* | Toggles Zen Standings mode on the standings page. |
| **CSES** | `Alt + S` | Navigates from a problem page to the submit page. |
| **CSES** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits the code inside the editor. |
| **QOJ** | `Alt + S` | Redirects from the problem page to the submission page. |
| **QOJ** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits the code inside the editor. |
| **AtCoder** | `Alt + S` | Navigates from a task page to the submit page with the task pre-selected. |
| **AtCoder** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits the code from the Ace editor. |
| **oj.uz** | `Alt + S` | Navigates from a problem page to the submit page. |
| **oj.uz** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits code via physical `.click()` with event propagation stopped (preventing accidental logouts/CSRF dropouts). |
| **DMOJ / VNOI / QHHOJ** | `Alt + S` | Opens the submit page in a new tab from a problem page. |
| **DMOJ / VNOI / QHHOJ** | `Alt + Z` or `\` | Toggles Zen Mode (distraction-free reading & rankings). |
| **DMOJ / VNOI / QHHOJ** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Instantly submits the code from the Ace editor. |
| **USACO** | `Ctrl + Enter` *(or `Cmd + Enter`)* | Automatically builds the payload, syncs C++17 dropdown, and safely clicks submit. |

---

## 📁 File Structure

```
CocaPepsi CP/
├── manifest.json      # Extension metadata, MV3 definitions & script routing
├── background.js      # Service worker for Chrome Commands API bridge
├── Codeforces.js      # All Codeforces feature implementations
├── cses.js            # CSES custom editor, HUD timer, and instant submit payload generator
├── QOJ.js             # QOJ shortcuts and main-world injector logic
├── AtCoder.js         # AtCoder task navigation, editor focus & quick submit
├── ojuz.js            # oj.uz task navigation, editor focus & quick submit
├── DMOJ.js            # DMOJ/VNOI/QHHOJ navigation, editor focus & quick submit
├── usaco.js           # USACO light-themed custom editor, HUD timer, and language synchronizer
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
