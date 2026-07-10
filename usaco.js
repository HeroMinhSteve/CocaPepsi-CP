(function () {
  // ==========================================
  // USACO Helper
  // Supports: usaco.org
  // ==========================================

  // Only activate if the file upload input exists on the page
  const fileInput = document.querySelector('input[type="file"][name="sourcefile"]');
  if (!fileInput) return;

  // ==========================================
  // 1. The Smart Seeker & Synchronization Engine
  // ==========================================

  function getNativeLangSelect() {
    let sel = document.querySelector('select[name="language"]');
    if (sel) return sel;

    // Nuclear fallback: check every select on the page for CP languages
    for (let s of document.querySelectorAll('select')) {
      if (s.innerText.includes('C++') || s.innerText.includes('Python') || s.innerText.includes('Java')) {
        return s;
      }
    }
    return null;
  }

  function syncNativeSelect(targetLang) {
    const nativeSelect = getNativeLangSelect();
    if (!nativeSelect) {
      console.log("CocaPepsi CP: Could not find native USACO language dropdown!");
      return;
    }

    // C++ special case: strictly prefer C++17
    if (targetLang === "C++") {
      let fallbackIndex = -1;
      for (let i = 0; i < nativeSelect.options.length; i++) {
        const optText = nativeSelect.options[i].text;
        if (optText.includes('17')) {
          nativeSelect.selectedIndex = i;
          nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          console.log("CocaPepsi CP: Force-synced USACO dropdown to -> " + nativeSelect.options[i].text);
          return;
        }
        if (fallbackIndex === -1 && optText.toLowerCase().includes('c++')) {
          fallbackIndex = i;
        }
      }
      // Fallback to any C++ if C++17 not found
      if (fallbackIndex !== -1) {
        nativeSelect.selectedIndex = fallbackIndex;
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        console.log("CocaPepsi CP: C++17 not found, fell back to -> " + nativeSelect.options[fallbackIndex].text);
      }
      return;
    }

    // General languages: standard matching
    for (let i = 0; i < nativeSelect.options.length; i++) {
      const optText = nativeSelect.options[i].text.toLowerCase();
      if (optText.includes(targetLang.toLowerCase())) {
        nativeSelect.selectedIndex = i;
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        console.log("CocaPepsi CP: Force-synced USACO dropdown to -> " + nativeSelect.options[i].text);
        break;
      }
    }
  }

  // ==========================================
  // 2. Problem ID Extraction (for Timer Persistence)
  // ==========================================

  function getProblemId() {
    // Extract from URL param: ?page=viewproblem2&cpid=1234
    const params = new URLSearchParams(window.location.search);
    const cpid = params.get('cpid') || params.get('c') || params.get('id');
    if (cpid) return cpid;

    // Fallback: try to grab from the page title or path
    const pathMatch = window.location.pathname.match(/(\d+)/);
    if (pathMatch) return pathMatch[1];

    return 'usaco_default';
  }

  const problemId = getProblemId();

  // ==========================================
  // 3. The Decoupled Floating HUD
  // ==========================================

  function initHUD() {
    const hud = document.createElement('div');
    hud.id = 'coca-pepsi-hud';
    hud.style.cssText = `
      position: fixed; top: 70px; right: 20px; z-index: 9999;
      background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px);
      border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px 20px;
      color: #333333; font-family: sans-serif; display: flex; flex-direction: column;
      align-items: center; box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    `;

    // Timer Display
    const timerLabel = document.createElement('div');
    timerLabel.style.cssText = "font-size: 22px; font-weight: bold; font-family: Consolas, monospace; letter-spacing: 2px; margin-bottom: 12px; color: #0066cc;";
    timerLabel.innerText = "00:00:00";
    hud.appendChild(timerLabel);

    // --- Persistent Timer State (per-problem) ---
    const LS_RUNNING = `coca_pepsi_timer_running_${problemId}`;
    const LS_ACCUMULATED = `coca_pepsi_timer_accumulated_${problemId}`;
    const LS_START = `coca_pepsi_timer_start_${problemId}`;

    let isRunning = localStorage.getItem(LS_RUNNING) === 'true';
    let accumulatedTime = parseInt(localStorage.getItem(LS_ACCUMULATED) || '0', 10);
    let startTime = parseInt(localStorage.getItem(LS_START) || '0', 10);

    // On first ever visit (no state saved), auto-start the timer
    if (localStorage.getItem(LS_RUNNING) === null) {
      isRunning = true;
      startTime = Date.now();
      localStorage.setItem(LS_RUNNING, 'true');
      localStorage.setItem(LS_ACCUMULATED, '0');
      localStorage.setItem(LS_START, String(startTime));
    }

    function getTotalSeconds() {
      const elapsed = isRunning ? (Date.now() - startTime) : 0;
      return Math.floor((accumulatedTime + elapsed) / 1000);
    }

    function formatTime(totalSec) {
      const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const s = String(totalSec % 60).padStart(2, '0');
      return `${h}:${m}:${s}`;
    }

    function updateDisplay() {
      timerLabel.innerText = formatTime(getTotalSeconds());
    }

    // Render immediately, then tick every second
    updateDisplay();
    setInterval(updateDisplay, 1000);

    // --- Timer Control Buttons ---
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = "display: flex; gap: 6px; margin-bottom: 12px;";

    const btnStyle = `
      background: #f8f9fa; color: #333333; border: 1px solid #cccccc; border-radius: 4px;
      font-size: 11px; padding: 4px 10px; cursor: pointer; font-family: sans-serif;
      transition: background 0.2s, color 0.2s, border-color 0.2s; outline: none;
    `;

    const pauseBtn = document.createElement('button');
    pauseBtn.style.cssText = btnStyle;
    pauseBtn.innerText = isRunning ? '⏸ Pause' : '▶ Resume';

    pauseBtn.addEventListener('mouseenter', () => { pauseBtn.style.background = '#e2e6ea'; pauseBtn.style.color = '#111'; pauseBtn.style.borderColor = '#aaaaaa'; });
    pauseBtn.addEventListener('mouseleave', () => { pauseBtn.style.background = '#f8f9fa'; pauseBtn.style.color = '#333333'; pauseBtn.style.borderColor = '#cccccc'; });

    pauseBtn.addEventListener('click', () => {
      if (isRunning) {
        accumulatedTime += Date.now() - startTime;
        isRunning = false;
        localStorage.setItem(LS_RUNNING, 'false');
        localStorage.setItem(LS_ACCUMULATED, String(accumulatedTime));
        pauseBtn.innerText = '▶ Resume';
      } else {
        startTime = Date.now();
        isRunning = true;
        localStorage.setItem(LS_RUNNING, 'true');
        localStorage.setItem(LS_START, String(startTime));
        pauseBtn.innerText = '⏸ Pause';
      }
      updateDisplay();
    });

    const resetBtn = document.createElement('button');
    resetBtn.style.cssText = btnStyle;
    resetBtn.innerText = '⏹ Reset';

    resetBtn.addEventListener('mouseenter', () => { resetBtn.style.background = '#e2e6ea'; resetBtn.style.color = '#111'; resetBtn.style.borderColor = '#aaaaaa'; });
    resetBtn.addEventListener('mouseleave', () => { resetBtn.style.background = '#f8f9fa'; resetBtn.style.color = '#333333'; resetBtn.style.borderColor = '#cccccc'; });

    resetBtn.addEventListener('click', () => {
      accumulatedTime = 0;
      startTime = Date.now();
      isRunning = false;
      localStorage.setItem(LS_RUNNING, 'false');
      localStorage.setItem(LS_ACCUMULATED, '0');
      localStorage.removeItem(LS_START);
      pauseBtn.innerText = '▶ Resume';
      timerLabel.innerText = '00:00:00';
    });

    btnContainer.appendChild(pauseBtn);
    btnContainer.appendChild(resetBtn);
    hud.appendChild(btnContainer);

    // --- Global Language Selector ---
    const langWrapper = document.createElement('div');
    langWrapper.style.cssText = "display: flex; flex-direction: column; width: 100%; border-top: 1px solid #eeeeee; padding-top: 10px;";

    const langLabel = document.createElement('span');
    langLabel.innerText = "Target Language:";
    langLabel.style.cssText = "font-size: 11px; color: #666666; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;";
    langWrapper.appendChild(langLabel);

    const customSelect = document.createElement('select');
    customSelect.style.cssText = "background: #f8f9fa; color: #333333; border: 1px solid #cccccc; border-radius: 4px; padding: 6px; font-size: 13px; outline: none; cursor: pointer;";

    const langs = ["C++", "Python", "Java"];
    langs.forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang;
      opt.text = lang;
      customSelect.appendChild(opt);
    });

    const savedLang = localStorage.getItem('coca_pepsi_usaco_global_lang') || "C++";
    customSelect.value = savedLang;

    customSelect.addEventListener('change', (e) => {
      localStorage.setItem('coca_pepsi_usaco_global_lang', e.target.value);
      syncNativeSelect(e.target.value);
    });

    langWrapper.appendChild(customSelect);
    hud.appendChild(langWrapper);
    document.body.appendChild(hud);
  }

  initHUD();

  // Sync native dropdown on load
  setTimeout(() => {
    syncNativeSelect(localStorage.getItem('coca_pepsi_usaco_global_lang') || "C++");
  }, 100);

  // ==========================================
  // 4. Custom Code Editor & Bulletproof Payload
  // ==========================================

  const form = fileInput.closest('form');

  if (form) {
    const divider = document.createElement('div');
    divider.innerHTML = '<strong>OR</strong> Paste code directly:';
    divider.style.cssText = 'margin: 15px 0 5px 0; font-family: sans-serif; color: #888; font-size: 14px;';
    fileInput.parentNode.insertBefore(divider, fileInput.nextSibling);

    const editor = document.createElement('textarea');
    editor.id = 'coca-pepsi-editor';
    editor.placeholder = "// Paste your code here...\n// The HUD above sets the USACO language.\n// Ctrl + Enter to launch payload.";
    editor.style.cssText = `
      width: 100%; height: 400px; font-family: Consolas, monospace; font-size: 14px;
      padding: 12px; background: #ffffff; color: #24292e; border: 1px solid #d1d5da;
      border-radius: 6px; margin-bottom: 15px; box-sizing: border-box; resize: vertical;
    `;

    divider.parentNode.insertBefore(editor, divider.nextSibling);
    editor.focus();

    // --- Independent Payload Generator ---
    const applyPayload = () => {
      const code = editor.value;
      if (code.trim()) {
        const targetLang = localStorage.getItem('coca_pepsi_usaco_global_lang') || "C++";
        let ext = ".cpp";
        if (targetLang === "Python") ext = ".py";
        else if (targetLang === "Java") ext = ".java";

        const fakeFile = new File([code], "solution" + ext, { type: "text/plain" });
        const dt = new DataTransfer();
        dt.items.add(fakeFile);

        fileInput.files = dt.files;

        // Sync language dropdown right before submit
        syncNativeSelect(targetLang);
      }
    };

    // --- Safe Submission via Physical Button Click ---
    const submitBtn = document.querySelector('input[name="submit-solution"], button[type="submit"], input[type="submit"]');

    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        const code = editor.value;
        const hasFile = fileInput.files && fileInput.files.length > 0;

        if (!code.trim() && !hasFile) {
          e.preventDefault();
          alert("CocaPepsi CP: Editor is empty and no file chosen! Cannot submit the void.");
          return;
        }
        applyPayload();
      });
    }

    // --- Ctrl + Enter Shortcut ---
    const triggerSubmit = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();

        const code = editor.value;
        const hasFile = fileInput.files && fileInput.files.length > 0;

        if (!code.trim() && !hasFile) {
          alert("CocaPepsi CP: Editor is empty and no file chosen! Cannot submit the void.");
          return;
        }

        applyPayload();

        if (submitBtn) {
          submitBtn.click();
        } else {
          form.requestSubmit();
        }
      }
    };

    editor.addEventListener('keydown', triggerSubmit);
    document.addEventListener('keydown', triggerSubmit);
  }
})();
