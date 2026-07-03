(function () {
  const isSubmitPage = window.location.pathname.includes('/submit');

  // ==========================================
  // 1. Problem Page: Alt + S Jump
  // ==========================================
  if (!isSubmitPage) {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const submitTab = Array.from(document.querySelectorAll('.nav a, .title-block a'))
          .find(a => a.textContent.trim().toLowerCase() === 'submit');
        if (submitTab) submitTab.click();
      }
    });
  }

  // ==========================================
  // 2. The Smart Seeker & Synchronization Engine
  // ==========================================

  // Bulletproof function to find the exact CSES language dropdown
  function getNativeLangSelect() {
    let sel = document.querySelector('select[name="lang"], select[name="language"], select[name="option"]');
    if (sel) return sel;

    // Nuclear fallback: check every select on the page for CP languages
    for (let s of document.querySelectorAll('select')) {
      if (s.innerText.includes('C++') || s.innerText.includes('Python')) {
        return s;
      }
    }
    return null;
  }

  function syncNativeSelect(targetLang) {
    const nativeSelect = getNativeLangSelect();
    if (!nativeSelect) {
      console.log("CocaPepsi CP: Could not find native language dropdown!");
      return;
    }

    for (let i = 0; i < nativeSelect.options.length; i++) {
      const optText = nativeSelect.options[i].text.toLowerCase();
      // Match "C++" to "C++17" or "C++11"
      if (optText.includes(targetLang.toLowerCase())) {
        nativeSelect.selectedIndex = i;
        // Force the browser to recognize the change
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        console.log("CocaPepsi CP: Force-synced native dropdown to -> " + nativeSelect.options[i].text);
        break;
      }
    }
  }

  // ==========================================
  // 3. The Decoupled Floating HUD
  // ==========================================
  function initHUD() {
    const hud = document.createElement('div');
    hud.id = 'coca-pepsi-hud';
    hud.style.cssText = `
      position: fixed; top: 70px; right: 20px; z-index: 9999;
      background: rgba(25, 25, 25, 0.95); backdrop-filter: blur(8px);
      border: 1px solid #444; border-radius: 8px; padding: 15px 20px;
      color: white; font-family: sans-serif; display: flex; flex-direction: column;
      align-items: center; box-shadow: 0 8px 16px rgba(0,0,0,0.5);
    `;

    // Timer
    const timerLabel = document.createElement('div');
    timerLabel.style.cssText = "font-size: 22px; font-weight: bold; font-family: Consolas, monospace; letter-spacing: 2px; margin-bottom: 12px; color: #00ffcc;";
    timerLabel.innerText = "00:00:00";
    hud.appendChild(timerLabel);

    // --- Persistent Timer State (per-problem) ---
    const problemId = window.location.pathname.match(/\/(\d+)\/?$/)
      ? window.location.pathname.match(/\/(\d+)\/?$/)[1]
      : 'default';
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
      background: #222; color: #bbb; border: 1px solid #444; border-radius: 4px;
      font-size: 11px; padding: 4px 10px; cursor: pointer; font-family: sans-serif;
      transition: background 0.2s, color 0.2s, border-color 0.2s; outline: none;
    `;

    const pauseBtn = document.createElement('button');
    pauseBtn.style.cssText = btnStyle;
    pauseBtn.innerText = isRunning ? '⏸ Pause' : '▶ Resume';

    pauseBtn.addEventListener('mouseenter', () => { pauseBtn.style.background = '#333'; pauseBtn.style.color = '#eee'; pauseBtn.style.borderColor = '#666'; });
    pauseBtn.addEventListener('mouseleave', () => { pauseBtn.style.background = '#222'; pauseBtn.style.color = '#bbb'; pauseBtn.style.borderColor = '#444'; });

    pauseBtn.addEventListener('click', () => {
      if (isRunning) {
        // Pause: accumulate elapsed time and stop
        accumulatedTime += Date.now() - startTime;
        isRunning = false;
        localStorage.setItem(LS_RUNNING, 'false');
        localStorage.setItem(LS_ACCUMULATED, String(accumulatedTime));
        pauseBtn.innerText = '▶ Resume';
      } else {
        // Resume: record new start point
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

    resetBtn.addEventListener('mouseenter', () => { resetBtn.style.background = '#333'; resetBtn.style.color = '#eee'; resetBtn.style.borderColor = '#666'; });
    resetBtn.addEventListener('mouseleave', () => { resetBtn.style.background = '#222'; resetBtn.style.color = '#bbb'; resetBtn.style.borderColor = '#444'; });

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

    // Global Language Selector
    const langWrapper = document.createElement('div');
    langWrapper.style.cssText = "display: flex; flex-direction: column; width: 100%; border-top: 1px solid #555; padding-top: 10px;";

    const langLabel = document.createElement('span');
    langLabel.innerText = "Target Language:";
    langLabel.style.cssText = "font-size: 11px; color: #bbb; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;";
    langWrapper.appendChild(langLabel);

    const customSelect = document.createElement('select');
    customSelect.style.cssText = "background: #222; color: #eee; border: 1px solid #666; border-radius: 4px; padding: 6px; font-size: 13px; outline: none; cursor: pointer;";

    const langs = ["C++", "Python", "Ruby", "Java", "Rust", "Go"];
    langs.forEach(lang => {
      const opt = document.createElement('option');
      opt.value = lang;
      opt.text = lang;
      customSelect.appendChild(opt);
    });

    const savedLang = localStorage.getItem('coca_pepsi_cses_global_lang') || "C++";
    customSelect.value = savedLang;

    customSelect.addEventListener('change', (e) => {
      localStorage.setItem('coca_pepsi_cses_global_lang', e.target.value);
      if (isSubmitPage) syncNativeSelect(e.target.value);
    });

    langWrapper.appendChild(customSelect);
    hud.appendChild(langWrapper);
    document.body.appendChild(hud);
  }

  initHUD();

  // ==========================================
  // 4. Submit Page: Editor & Bulletproof Payload
  // ==========================================
  if (isSubmitPage) {
    // Wait a tiny bit for CSES DOM to fully render, then sync the language
    setTimeout(() => {
      syncNativeSelect(localStorage.getItem('coca_pepsi_cses_global_lang') || "C++");
    }, 100);

    const fileInput = document.querySelector('input[type="file"][name="file"]');
    const form = fileInput ? fileInput.closest('form') : null;

    if (fileInput && form) {
      const divider = document.createElement('div');
      divider.innerHTML = '<strong>OR</strong> Paste code directly:';
      divider.style.cssText = 'margin: 15px 0 5px 0; font-family: sans-serif; color: #888; font-size: 14px;';
      fileInput.parentNode.insertBefore(divider, fileInput.nextSibling);

      const editor = document.createElement('textarea');
      editor.id = 'coca-pepsi-editor';
      editor.placeholder = "// Paste your code here...\n// The HUD above automatically sets the CSES language.\n// Ctrl + Enter to launch payload.";
      editor.style.cssText = `
        width: 100%; height: 400px; font-family: Consolas, monospace; font-size: 14px; 
        padding: 12px; background: #1e1e1e; color: #d4d4d4; border: 1px solid #333; 
        border-radius: 6px; margin-bottom: 15px; box-sizing: border-box; resize: vertical;
      `;

      divider.parentNode.insertBefore(editor, divider.nextSibling);
      editor.focus();

      // Independent Payload Generator
      const applyPayload = () => {
        const code = editor.value;
        if (code.trim()) {
          const targetLang = localStorage.getItem('coca_pepsi_cses_global_lang') || "C++";
          let ext = ".cpp";
          if (targetLang === "Python") ext = ".py";
          else if (targetLang === "Ruby") ext = ".rb";
          else if (targetLang === "Java") ext = ".java";
          else if (targetLang === "Rust") ext = ".rs";
          else if (targetLang === "Go") ext = ".go";

          const fakeFile = new File([code], "solution" + ext, { type: "text/plain" });
          const dt = new DataTransfer();
          dt.items.add(fakeFile);

          fileInput.files = dt.files;
        }
      };

      const submitBtn = form.querySelector('input[type="submit"], button[type="submit"]');

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
  }
})();