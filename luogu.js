(function () {
  // ==========================================
  // Luogu Helper (luogu.com.cn)
  // SPA-aware with DOM polling and
  // focus-aware timer
  // ==========================================

  // ==========================================
  // 1. Problem ID Extraction
  // ==========================================

  function getProblemId() {
    const match = window.location.pathname.match(/\/problem\/([A-Za-z0-9_]+)/);
    return match ? match[1] : null;
  }

  // ==========================================
  // 2. The Decoupled Floating HUD & Timer
  // ==========================================

  let currentHud = null;
  let currentProblemId = null;
  let timerInterval = null;

  // Shared timer state
  let _timer = {
    isRunning: false,
    accumulatedTime: 0,
    startTime: 0,
    LS_RUNNING: '',
    LS_ACCUMULATED: '',
    LS_START: '',
    pauseBtn: null,
    timerLabel: null,
  };

  function pauseTimer() {
    if (!_timer.isRunning) return;
    _timer.accumulatedTime += Date.now() - _timer.startTime;
    _timer.isRunning = false;
    localStorage.setItem(_timer.LS_RUNNING, 'false');
    localStorage.setItem(_timer.LS_ACCUMULATED, String(_timer.accumulatedTime));
    if (_timer.pauseBtn) _timer.pauseBtn.innerText = '▶ Resume';
  }

  function resumeTimer() {
    if (_timer.isRunning || _timer.acFrozen) return;
    _timer.startTime = Date.now();
    _timer.isRunning = true;
    localStorage.setItem(_timer.LS_RUNNING, 'true');
    localStorage.setItem(_timer.LS_START, String(_timer.startTime));
    if (_timer.pauseBtn) _timer.pauseBtn.innerText = '⏸ Pause';
  }

  function getTotalSeconds() {
    const elapsed = _timer.isRunning ? (Date.now() - _timer.startTime) : 0;
    return Math.floor((_timer.accumulatedTime + elapsed) / 1000);
  }

  function formatTime(totalSec) {
    const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function updateDisplay() {
    if (_timer.timerLabel) {
      _timer.timerLabel.innerText = formatTime(getTotalSeconds());
    }
  }

  // ==========================================
  // 3. Immediate UI Sync on Tab Focus
  // ==========================================

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentProblemId) {
      // Tab became visible — force immediate UI re-render
      updateDisplay();
    }
  });



  // ==========================================
  // 5. HUD Builder
  // ==========================================

  function initHUD(problemId) {
    // Avoid reinitializing for the same problem
    if (currentProblemId === problemId && currentHud && document.body.contains(currentHud)) return;

    // Remove old HUD if it exists
    if (currentHud && document.body.contains(currentHud)) {
      currentHud.remove();
    }
    if (timerInterval) clearInterval(timerInterval);

    currentProblemId = problemId;

    const hud = document.createElement('div');
    hud.id = 'coca-pepsi-hud';
    hud.style.cssText = `
      position: fixed; top: 70px; right: 20px; z-index: 99999;
      background: rgba(25, 25, 25, 0.95); backdrop-filter: blur(8px);
      border: 1px solid #444; border-radius: 8px; padding: 15px 20px;
      color: white; font-family: sans-serif; display: flex; flex-direction: column;
      align-items: center; box-shadow: 0 8px 16px rgba(0,0,0,0.5);
      min-width: 160px;
    `;

    // --- Problem Badge ---
    const badge = document.createElement('div');
    badge.style.cssText = "font-size: 11px; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;";
    badge.innerText = problemId;
    hud.appendChild(badge);

    // --- Timer Display ---
    const timerLabel = document.createElement('div');
    timerLabel.style.cssText = "font-size: 22px; font-weight: bold; font-family: Consolas, monospace; letter-spacing: 2px; margin-bottom: 8px; color: #00ffcc; transition: color 0.3s;";
    timerLabel.innerText = "00:00:00";
    hud.appendChild(timerLabel);
    _timer.timerLabel = timerLabel;



    // --- Persistent Timer State (per-problem) ---
    const LS_RUNNING = `coca_pepsi_timer_running_${problemId}`;
    const LS_ACCUMULATED = `coca_pepsi_timer_accumulated_${problemId}`;
    const LS_START = `coca_pepsi_timer_start_${problemId}`;

    _timer.LS_RUNNING = LS_RUNNING;
    _timer.LS_ACCUMULATED = LS_ACCUMULATED;
    _timer.LS_START = LS_START;

    _timer.isRunning = localStorage.getItem(LS_RUNNING) === 'true';
    _timer.accumulatedTime = parseInt(localStorage.getItem(LS_ACCUMULATED) || '0', 10);
    _timer.startTime = parseInt(localStorage.getItem(LS_START) || '0', 10);

    // On first ever visit (no state saved), auto-start the timer
    if (localStorage.getItem(LS_RUNNING) === null) {
      _timer.isRunning = true;
      _timer.startTime = Date.now();
      localStorage.setItem(LS_RUNNING, 'true');
      localStorage.setItem(LS_ACCUMULATED, '0');
      localStorage.setItem(LS_START, String(_timer.startTime));
    }

    updateDisplay();
    timerInterval = setInterval(updateDisplay, 1000);

    // --- Timer Control Buttons ---
    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = "display: flex; gap: 6px; margin-bottom: 4px;";

    const btnStyle = `
      background: #222; color: #eee; border: 1px solid #666; border-radius: 4px;
      font-size: 11px; padding: 4px 10px; cursor: pointer; font-family: sans-serif;
      transition: background 0.2s, color 0.2s, border-color 0.2s; outline: none;
    `;

    const pauseBtn = document.createElement('button');
    pauseBtn.style.cssText = btnStyle;
    pauseBtn.innerText = _timer.isRunning ? '⏸ Pause' : '▶ Resume';
    _timer.pauseBtn = pauseBtn;

    pauseBtn.addEventListener('mouseenter', () => { pauseBtn.style.background = '#333'; pauseBtn.style.color = '#fff'; pauseBtn.style.borderColor = '#888'; });
    pauseBtn.addEventListener('mouseleave', () => { pauseBtn.style.background = '#222'; pauseBtn.style.color = '#eee'; pauseBtn.style.borderColor = '#666'; });

    pauseBtn.addEventListener('click', () => {
      if (_timer.isRunning) {
        pauseTimer();
      } else {
        resumeTimer();
      }
      updateDisplay();
    });

    const resetBtn = document.createElement('button');
    resetBtn.style.cssText = btnStyle;
    resetBtn.innerText = '⏹ Reset';

    resetBtn.addEventListener('mouseenter', () => { resetBtn.style.background = '#333'; resetBtn.style.color = '#fff'; resetBtn.style.borderColor = '#888'; });
    resetBtn.addEventListener('mouseleave', () => { resetBtn.style.background = '#222'; resetBtn.style.color = '#eee'; resetBtn.style.borderColor = '#666'; });

    resetBtn.addEventListener('click', () => {
      _timer.accumulatedTime = 0;
      _timer.startTime = Date.now();
      _timer.isRunning = false;
      localStorage.setItem(LS_RUNNING, 'false');
      localStorage.setItem(LS_ACCUMULATED, '0');
      localStorage.removeItem(LS_START);
      pauseBtn.innerText = '▶ Resume';
      timerLabel.innerText = '00:00:00';
      timerLabel.style.color = '#00ffcc';
    });

    btnContainer.appendChild(pauseBtn);
    btnContainer.appendChild(resetBtn);
    hud.appendChild(btnContainer);

    document.body.appendChild(hud);
    currentHud = hud;

    // --- Drag-and-Drop Mobility ---
    const savedX = localStorage.getItem('coca_pepsi_hud_x');
    const savedY = localStorage.getItem('coca_pepsi_hud_y');
    if (savedX !== null && savedY !== null) {
      hud.style.left = savedX + 'px';
      hud.style.top = savedY + 'px';
      hud.style.right = 'auto';
      hud.style.bottom = 'auto';
    }
    hud.style.cursor = 'grab';

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    hud.addEventListener('mousedown', (e) => {
      if (['BUTTON', 'SELECT', 'OPTION', 'INPUT'].includes(e.target.tagName)) return;
      isDragging = true;
      offsetX = e.clientX - hud.getBoundingClientRect().left;
      offsetY = e.clientY - hud.getBoundingClientRect().top;
      hud.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const hudWidth = hud.offsetWidth;
      const hudHeight = hud.offsetHeight;
      let newX = e.clientX - offsetX;
      let newY = e.clientY - offsetY;
      newX = Math.max(0, Math.min(newX, window.innerWidth - hudWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - hudHeight));
      hud.style.left = newX + 'px';
      hud.style.top = newY + 'px';
      hud.style.right = 'auto';
      hud.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      hud.style.cursor = 'grab';
      localStorage.setItem('coca_pepsi_hud_x', parseInt(hud.style.left, 10));
      localStorage.setItem('coca_pepsi_hud_y', parseInt(hud.style.top, 10));
    });


  }

  // ==========================================
  // 6. Alt + S: Jump to Submit
  // ==========================================

  function findSubmitButton() {
    // Luogu uses various submit buttons — search broadly
    const btns = document.querySelectorAll('button, a.btn, [type="submit"], .operation a, .operation button');
    for (const btn of btns) {
      const text = btn.textContent.trim();
      if (text.includes('提交') || text.includes('Submit') || text.includes('提交评测')) {
        return btn;
      }
    }

    // Luogu's Vue-rendered submit button
    const luoguBtn = document.querySelector('button.am-btn-success, button.am-btn-primary, .btn-submit, [data-v-submit]');
    if (luoguBtn) return luoguBtn;

    // Links to submit page
    const submitLink = document.querySelector('a[href*="/submit"]');
    if (submitLink) return submitLink;

    return null;
  }

  // ==========================================
  // 7. Ctrl + Enter: Launch Payload
  // ==========================================

  function findPhysicalSubmitBtn() {
    const candidates = document.querySelectorAll('button, [type="submit"]');
    for (const btn of candidates) {
      const text = btn.textContent.trim();
      if (text.includes('提交') || text.includes('Submit') || text.includes('提交评测')) {
        return btn;
      }
    }
    return null;
  }

  // ==========================================
  // 8. Global Keyboard Shortcuts
  // ==========================================

  let shortcutsRegistered = false;

  function registerShortcuts() {
    if (shortcutsRegistered) return;
    shortcutsRegistered = true;

    // --- Alt + S: Jump to Submit ---
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const submitBtn = findSubmitButton();
        if (submitBtn) {
          submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => submitBtn.click(), 300);
          console.log('CocaPepsi CP: Alt+S -> Found and clicked submit on Luogu.');
        } else {
          const pid = getProblemId();
          if (pid) {
            window.location.href = `/problem/${pid}#submit`;
          }
          console.log('CocaPepsi CP: Alt+S -> Submit button not found, navigating to submit anchor.');
        }
      }
    });

    // --- Ctrl + Enter: Safe Submit (capture phase) ---
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!getProblemId()) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const submitBtn = findPhysicalSubmitBtn();
        if (submitBtn) {
          console.log('CocaPepsi CP: Ctrl+Enter -> safe .click() on Luogu submit button.');
          submitBtn.click();
        } else {
          console.log('CocaPepsi CP: Ctrl+Enter -> submit button not found on Luogu.');
        }
      }
    }, true);
  }

  // ==========================================
  // 9. SPA-Aware Initialization
  // ==========================================

  let lastUrl = '';

  function tick() {
    const url = window.location.href;

    // Detect SPA navigation (URL changed without full page reload)
    if (url !== lastUrl) {
      lastUrl = url;
      const problemId = getProblemId();
      if (problemId) {
        // Small delay to let Luogu's Vue finish rendering
        setTimeout(() => initHUD(problemId), 500);
      } else {
        // Not on a problem page — remove HUD and stop polling
        if (currentHud && document.body.contains(currentHud)) {
          currentHud.remove();
          currentHud = null;
          currentProblemId = null;
        }
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      }
    }
  }

  // Register shortcuts once
  registerShortcuts();

  // Initial tick
  tick();

  // Poll for SPA navigation changes every 500ms
  setInterval(tick, 500);

  // Also listen for popstate (browser back/forward)
  window.addEventListener('popstate', () => setTimeout(tick, 100));

})();
