(function () {
  /* ==========================================
     QHHOJ Helper (qhhoj.com) — LaTeX-Proof Implementation
     ========================================== */

  function $(selector, root = document) {
    try {
      return root.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  function $$(selector, root = document) {
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch (e) {
      return [];
    }
  }

  function isElementVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    const hasWidth = rect.width > 0;
    const hasHeight = rect.height > 0;
    return hasWidth ? hasHeight : false;
  }

  /* ==========================================
     1. Problem ID Extraction (SPA-aware)
     ========================================== */

  function getProblemId() {
    const urlMatch = window.location.pathname.match(/\/problems?\/([A-Za-z0-9_.-]+)/);
    return urlMatch ? urlMatch[1] : null;
  }

  /* ==========================================
     2. Decoupled Floating HUD & Timer
     ========================================== */

  let currentHud = null;
  let currentProblemId = null;
  let timerInterval = null;
  let hudDragListenersAttached = false;
  let isHudDragging = false;
  let hudHasMoved = false;
  let hudDragOffsetX = 0;
  let hudDragOffsetY = 0;

  let timerState = {
    isRunning: false,
    accumulatedTime: 0,
    startTime: 0,
    lsRunning: '',
    lsAccumulated: '',
    lsStart: '',
    pauseBtn: null,
    timerLabel: null,
  };

  function pauseTimer() {
    if (!timerState.isRunning) return;
    timerState.accumulatedTime += Date.now() - timerState.startTime;
    timerState.isRunning = false;
    localStorage.setItem(timerState.lsRunning, 'false');
    localStorage.setItem(timerState.lsAccumulated, String(timerState.accumulatedTime));
    if (timerState.pauseBtn) timerState.pauseBtn.innerText = '▶ Resume';
  }

  function resumeTimer() {
    if (timerState.isRunning) return;
    timerState.startTime = Date.now();
    timerState.isRunning = true;
    localStorage.setItem(timerState.lsRunning, 'true');
    localStorage.setItem(timerState.lsStart, String(timerState.startTime));
    if (timerState.pauseBtn) timerState.pauseBtn.innerText = '⏸ Pause';
  }

  function getTotalSeconds() {
    const elapsedMs = timerState.isRunning ? (Date.now() - timerState.startTime) : 0;
    return Math.floor((timerState.accumulatedTime + elapsedMs) / 1000);
  }

  function formatTime(totalSec) {
    const hoursPart = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const minutesPart = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const secondsPart = String(totalSec % 60).padStart(2, '0');
    return `${hoursPart}:${minutesPart}:${secondsPart}`;
  }

  function updateTimerDisplay() {
    if (timerState.timerLabel) {
      timerState.timerLabel.innerText = formatTime(getTotalSeconds());
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentProblemId) {
      updateTimerDisplay();
    }
  });

  function attachHudDragListeners() {
    if (hudDragListenersAttached) return;
    hudDragListenersAttached = true;

    document.addEventListener('mousemove', (e) => {
      if (!isHudDragging || !currentHud) return;
      hudHasMoved = true;
      const hudWidth = currentHud.offsetWidth;
      const hudHeight = currentHud.offsetHeight;
      let newX = e.clientX - hudDragOffsetX;
      let newY = e.clientY - hudDragOffsetY;
      newX = Math.max(0, Math.min(newX, window.innerWidth - hudWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - hudHeight));
      currentHud.style.left = newX + 'px';
      currentHud.style.top = newY + 'px';
      currentHud.style.right = 'auto';
      currentHud.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!isHudDragging) return;
      isHudDragging = false;
      if (currentHud) {
        currentHud.style.cursor = 'grab';
        if (hudHasMoved) {
          const parsedX = parseInt(currentHud.style.left, 10);
          const parsedY = parseInt(currentHud.style.top, 10);
          if (!Number.isNaN(parsedX) && !Number.isNaN(parsedY)) {
            localStorage.setItem('coca_pepsi_hud_x', String(parsedX));
            localStorage.setItem('coca_pepsi_hud_y', String(parsedY));
          }
        }
      }
      hudHasMoved = false;
    });
  }

  function initHud(problemId) {
    const isSameProblem = currentProblemId === problemId;
    const hasHud = currentHud ? document.body.contains(currentHud) : false;
    if (isSameProblem && hasHud) return;

    if (hasHud) {
      currentHud.remove();
    }
    if (timerInterval) clearInterval(timerInterval);

    currentProblemId = problemId;

    const hudContainer = document.createElement('div');
    hudContainer.id = 'coca-pepsi-hud';
    hudContainer.style.cssText = `
      position: fixed; top: 70px; right: 20px; z-index: 99999;
      background: rgba(18, 18, 22, 0.96); backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 255, 204, 0.15); border-radius: 10px; padding: 15px 20px;
      color: white; font-family: 'Segoe UI', system-ui, sans-serif;
      display: flex; flex-direction: column; align-items: center;
      box-shadow: 0 0 24px rgba(0, 255, 204, 0.08), 0 8px 32px rgba(0, 0, 0, 0.6);
      min-width: 170px; user-select: none;
      transition: box-shadow 0.3s ease;
    `;

    const problemBadge = document.createElement('div');
    problemBadge.style.cssText = `
      font-size: 10px; color: #00ffcc; margin-bottom: 6px;
      text-transform: uppercase; letter-spacing: 2px; font-weight: 600;
      background: rgba(0, 255, 204, 0.08); padding: 2px 10px; border-radius: 4px;
    `;
    problemBadge.innerText = `⚡ ${problemId}`;
    hudContainer.appendChild(problemBadge);

    const timerLabel = document.createElement('div');
    timerLabel.style.cssText = `
      font-size: 24px; font-weight: bold; font-family: 'Cascadia Code', Consolas, monospace;
      letter-spacing: 3px; margin-bottom: 10px; color: #00ffcc;
      text-shadow: 0 0 8px rgba(0, 255, 204, 0.4);
      transition: color 0.3s;
    `;
    timerLabel.innerText = '00:00:00';
    hudContainer.appendChild(timerLabel);
    timerState.timerLabel = timerLabel;

    const lsRunning = `coca_pepsi_timer_running_${problemId}`;
    const lsAccumulated = `coca_pepsi_timer_accumulated_${problemId}`;
    const lsStart = `coca_pepsi_timer_start_${problemId}`;

    timerState.lsRunning = lsRunning;
    timerState.lsAccumulated = lsAccumulated;
    timerState.lsStart = lsStart;

    timerState.isRunning = localStorage.getItem(lsRunning) === 'true';
    const accRaw = localStorage.getItem(lsAccumulated);
    timerState.accumulatedTime = parseInt(accRaw ? accRaw : '0', 10);
    const startRaw = localStorage.getItem(lsStart);
    timerState.startTime = parseInt(startRaw ? startRaw : '0', 10);

    if (localStorage.getItem(lsRunning) === null) {
      timerState.isRunning = true;
      timerState.startTime = Date.now();
      localStorage.setItem(lsRunning, 'true');
      localStorage.setItem(lsAccumulated, '0');
      localStorage.setItem(lsStart, String(timerState.startTime));
    }

    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display: flex; gap: 6px; margin-bottom: 6px;';

    const controlBtnStyle = `
      background: rgba(34, 34, 40, 0.9); color: #ccc; border: 1px solid #555; border-radius: 5px;
      font-size: 11px; padding: 4px 12px; cursor: pointer; font-family: inherit;
      transition: all 0.2s ease; outline: none;
    `;
    const controlBtnHover = (btn) => {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#333';
        btn.style.color = '#fff';
        btn.style.borderColor = '#00ffcc';
        btn.style.boxShadow = '0 0 6px rgba(0, 255, 204, 0.2)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(34, 34, 40, 0.9)';
        btn.style.color = '#ccc';
        btn.style.borderColor = '#555';
        btn.style.boxShadow = 'none';
      });
    };

    const pauseBtn = document.createElement('button');
    pauseBtn.style.cssText = controlBtnStyle;
    pauseBtn.innerText = timerState.isRunning ? '⏸ Pause' : '▶ Resume';
    timerState.pauseBtn = pauseBtn;
    controlBtnHover(pauseBtn);

    pauseBtn.addEventListener('click', () => {
      if (timerState.isRunning) {
        pauseTimer();
      } else {
        resumeTimer();
      }
      updateTimerDisplay();
    });

    const resetBtn = document.createElement('button');
    resetBtn.style.cssText = controlBtnStyle;
    resetBtn.innerText = '⏹ Reset';
    controlBtnHover(resetBtn);

    resetBtn.addEventListener('click', () => {
      timerState.accumulatedTime = 0;
      timerState.startTime = Date.now();
      timerState.isRunning = false;
      localStorage.setItem(lsRunning, 'false');
      localStorage.setItem(lsAccumulated, '0');
      localStorage.removeItem(lsStart);
      pauseBtn.innerText = '▶ Resume';
      timerLabel.innerText = '00:00:00';
      timerLabel.style.color = '#00ffcc';
    });

    buttonRow.appendChild(pauseBtn);
    buttonRow.appendChild(resetBtn);
    hudContainer.appendChild(buttonRow);

    const brandingLine = document.createElement('div');
    brandingLine.style.cssText = `
      font-size: 8px; color: #555; text-transform: uppercase; letter-spacing: 1.5px;
      margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px;
    `;
    brandingLine.innerText = 'CocaPepsi CP';
    hudContainer.appendChild(brandingLine);

    document.body.appendChild(hudContainer);
    currentHud = hudContainer;

    /* Drag-and-Drop Mobility (NaN-safe) */
    const savedX = parseInt(localStorage.getItem('coca_pepsi_hud_x') || '', 10);
    const savedY = parseInt(localStorage.getItem('coca_pepsi_hud_y') || '', 10);
    if (!Number.isNaN(savedX) && !Number.isNaN(savedY)) {
      hudContainer.style.left = savedX + 'px';
      hudContainer.style.top = savedY + 'px';
      hudContainer.style.right = 'auto';
      hudContainer.style.bottom = 'auto';
    }
    hudContainer.style.cursor = 'grab';

    hudContainer.addEventListener('mousedown', (e) => {
      const isInputEl = ['BUTTON', 'SELECT', 'OPTION', 'INPUT'].includes(e.target.tagName);
      if (isInputEl) return;
      isHudDragging = true;
      hudHasMoved = false;
      hudDragOffsetX = e.clientX - hudContainer.getBoundingClientRect().left;
      hudDragOffsetY = e.clientY - hudContainer.getBoundingClientRect().top;
      hudContainer.style.cursor = 'grabbing';
      e.preventDefault();
    });

    attachHudDragListeners();
  }

  /* ==========================================
     3. Editor Drawer Opener (Alt+S) & Submit (Ctrl+Enter)
     ========================================== */

  function getSubmitButtons() {
    const candidateBtns = $$('button, [role="button"], a.btn').filter((btnEl) => {
      if (!isElementVisible(btnEl)) return false;
      const rawText = btnEl.textContent ? btnEl.textContent : '';
      const btnText = rawText.trim().toLowerCase();
      const isNop = btnText === 'nộp bài';
      const isSub = btnText === 'submit';
      return isNop ? true : isSub;
    });

    let drawerSubmitBtn = null;
    let sidebarOpenBtn = null;

    for (const btnEl of candidateBtns) {
      let parentNode = btnEl.parentElement;
      let isInsideDrawer = false;

      for (let depth = 0; depth < 6 && parentNode; depth++) {
        const rawPText = parentNode.textContent ? parentNode.textContent : '';
        const parentText = rawPText.toLowerCase();
        const hasCodeEditor = Boolean(
          $('textarea, .cm-editor, .monaco-editor, .ace_editor, [contenteditable="true"]', parentNode)
        );
        let textMatch = false;
        if (parentText.includes('tải tệp lên')) textMatch = true;
        if (parentText.includes('phiên bản trình dịch')) textMatch = true;
        if (parentText.includes('upload file')) textMatch = true;

        if (hasCodeEditor ? true : textMatch) {
          isInsideDrawer = true;
          break;
        }
        parentNode = parentNode.parentElement;
      }

      if (isInsideDrawer) {
        drawerSubmitBtn = btnEl;
      } else {
        sidebarOpenBtn = btnEl;
      }
    }

    return { sidebarOpenBtn, drawerSubmitBtn, allBtns: candidateBtns };
  }

  function focusCodeEditor() {
    setTimeout(() => {
      const editorTarget = $(
        '.cm-content, .monaco-editor textarea, .ace_text-input, textarea, [contenteditable="true"]'
      );
      if (editorTarget) {
        editorTarget.focus();
      }
    }, 150);
  }

  let shortcutsRegistered = false;

  function registerShortcuts() {
    if (shortcutsRegistered) return;
    shortcutsRegistered = true;

    /* Alt + S: Open the inline code editor drawer (or focus it if already open) */
    document.addEventListener(
      'keydown',
      (e) => {
        const isAltS = e.altKey && e.key.toLowerCase() === 's';
        if (isAltS) {
          e.preventDefault();
          e.stopPropagation();
          const { sidebarOpenBtn, drawerSubmitBtn, allBtns } = getSubmitButtons();
          const shouldOpen = sidebarOpenBtn ? !drawerSubmitBtn : false;
          if (shouldOpen) {
            sidebarOpenBtn.click();
            focusCodeEditor();
            return;
          }
          if (drawerSubmitBtn) {
            focusCodeEditor();
            return;
          }
          if (allBtns.length > 0) {
            allBtns[0].click();
            focusCodeEditor();
          }
        }
      },
      true
    );

    /* Ctrl + Enter: Click the actual submit button inside the open editor drawer */
    document.addEventListener(
      'keydown',
      (e) => {
        const isMod = e.ctrlKey ? true : e.metaKey;
        const isEnter = e.key === 'Enter';
        if (isMod && isEnter) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const { drawerSubmitBtn, sidebarOpenBtn, allBtns } = getSubmitButtons();
          if (drawerSubmitBtn) {
            drawerSubmitBtn.click();
          } else if (sidebarOpenBtn) {
            sidebarOpenBtn.click();
            focusCodeEditor();
          } else if (allBtns.length > 0) {
            allBtns[allBtns.length - 1].click();
          }
        }
      },
      true
    );
  }

  const hasChromeRuntime = typeof chrome !== 'undefined' ? chrome.runtime : false;
  if (hasChromeRuntime ? chrome.runtime.onMessage : false) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'NUKES_AWAY') {
        const { drawerSubmitBtn, allBtns } = getSubmitButtons();
        if (drawerSubmitBtn) {
          drawerSubmitBtn.click();
        } else if (allBtns.length > 0) {
          allBtns[allBtns.length - 1].click();
        }
      }
    });
  }

  /* ==========================================
     4. Standings Zen Mode (Podium + Table + Live Whitelist + Rank Mask)
     ========================================== */

  let zenObserver = null;
  let zenStyleInjected = false;
  let hiddenPodiumElements = new Set();
  let hiddenRowElements = new Set();
  let maskedRankElements = new Map();

  function detectLoggedInUser() {
    // 1. QHHOJ v2 desktop user menu:
    // In UserMenu.vue: <span :title="session.user.username">{{ session.user.username }}</span>
    const userSpanWithTitle = $('header button[aria-haspopup="menu"] span[title]');
    if (userSpanWithTitle) {
      const u = (userSpanWithTitle.getAttribute('title') || userSpanWithTitle.textContent || '').trim();
      if (u) {
        localStorage.setItem('coca_pepsi_qhhoj_detected_user', u);
        return u;
      }
    }

    // 2. QHHOJ v2 user button aria-label: "Menu tài khoản cho [username]" or "Account menu for [username]"
    const ariaMenuBtn = $('header button[aria-label*="tài khoản" i], header button[aria-label*="account" i]');
    if (ariaMenuBtn) {
      const label = ariaMenuBtn.getAttribute('aria-label') || '';
      const m = label.match(/(?:cho|for)\s+([^\s,]+)/i);
      if (m && m[1]) {
        const u = m[1].trim();
        localStorage.setItem('coca_pepsi_qhhoj_detected_user', u);
        return u;
      }
    }

    // 3. QHHOJ v2 phone menu identity:
    // In PhoneMenu.vue: <div data-testid="phone-menu-identity"><span>{{ session.user.username }}</span></div>
    const phoneIdentity = $('[data-testid="phone-menu-identity"] span');
    if (phoneIdentity && phoneIdentity.textContent) {
      const u = phoneIdentity.textContent.trim();
      if (u) {
        localStorage.setItem('coca_pepsi_qhhoj_detected_user', u);
        return u;
      }
    }

    // 4. On standings table, detect viewer's own row (marked by bg-surface-hover or bg-accent-soft):
    const ownRow = $('tr.bg-surface-hover, tr.bg-accent-soft');
    if (ownRow) {
      const userEl = $('a[href*="/users/"], a[href*="user="], span[title]', ownRow);
      if (userEl) {
        let u = (userEl.getAttribute('title') || '').trim();
        if (!u) {
          const href = userEl.getAttribute('href') || '';
          const m1 = href.match(/\/(?:users?|profile)\/([^/?#]+)/i);
          if (m1 && m1[1]) u = decodeURIComponent(m1[1]).trim();
          const m2 = href.match(/[?&]user=([^&#]+)/i);
          if (m2 && m2[1]) u = decodeURIComponent(m2[1]).trim();
          if (!u) u = (userEl.textContent || '').trim();
        }
        if (u) {
          localStorage.setItem('coca_pepsi_qhhoj_detected_user', u);
          return u;
        }
      }
    }

    // 5. Classic links (v1 fallback):
    const profileLinks = $$(
      'header a[href*="/user/"], header a[href*="/users/"], header a[href*="/profile/"], ' +
      'nav a[href*="/user/"], nav a[href*="/users/"], nav a[href*="/profile/"], #user-links a[href*="/user/"]'
    );
    for (const link of profileLinks) {
      const href = link.getAttribute('href') || '';
      const match = href.match(/\/(?:users?|profile)\/([^/?#]+)/i);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]).trim();
        const lowerDecoded = decoded.toLowerCase();
        const isAuthRoute = ['login', 'register', 'settings', 'edit', 'logout'].includes(lowerDecoded);
        if (decoded && !isAuthRoute) {
          localStorage.setItem('coca_pepsi_qhhoj_detected_user', decoded);
          return decoded;
        }
      }
    }

    // 6. Previously cached detected user
    const cached = localStorage.getItem('coca_pepsi_qhhoj_detected_user');
    if (cached) return cached;

    return 'HeroMinhSteve';
  }

  function getActiveWhitelist() {
    const rawItem = localStorage.getItem('coca_pepsi_qhhoj_whitelist');
    const rawSaved = rawItem ? rawItem : '';
    const customNames = rawSaved
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);

    const loggedInUser = detectLoggedInUser();
    if (loggedInUser) {
      const lowerUser = loggedInUser.toLowerCase();
      if (!customNames.includes(lowerUser)) {
        customNames.push(lowerUser);
      }
    }
    if (!customNames.includes('herominhsteve')) {
      customNames.push('herominhsteve');
    }
    return customNames;
  }

  function injectZenStyles() {
    if (zenStyleInjected && $('#coca-pepsi-zen-style')) return;
    zenStyleInjected = true;

    let zenStyleEl = $('#coca-pepsi-zen-style');
    if (!zenStyleEl) {
      zenStyleEl = document.createElement('style');
      zenStyleEl.id = 'coca-pepsi-zen-style';
      document.head.appendChild(zenStyleEl);
    }
    zenStyleEl.textContent = `
      .coca-pepsi-zen-hidden {
        display: none !important;
      }
      body.coca-pepsi-zen-active section[aria-label*="podium" i],
      body.coca-pepsi-zen-active section[aria-label*="bục" i],
      body.coca-pepsi-zen-active [data-podium-rank],
      body.coca-pepsi-zen-active [data-skeleton-region="podium"],
      body.coca-pepsi-zen-active ol:has([data-podium-rank]) {
        display: none !important;
      }
      #coca-pepsi-zen-panel {
        position: fixed;
        top: 70px;
        right: 20px;
        z-index: 99998;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(18, 18, 24, 0.94);
        backdrop-filter: blur(10px);
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px solid rgba(0, 255, 204, 0.3);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        font-family: 'Segoe UI', system-ui, sans-serif;
        user-select: none;
      }
      #coca-pepsi-whitelist-input {
        background: rgba(30, 30, 38, 0.95);
        color: #fff;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 12px;
        width: 150px;
        outline: none;
        transition: border-color 0.2s;
      }
      #coca-pepsi-whitelist-input:focus {
        border-color: #00ffcc;
      }
      #coca-pepsi-zen-toggle {
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        border: 1px solid rgba(0, 255, 204, 0.3);
        border-radius: 6px;
        outline: none;
        user-select: none;
        transition: all 0.2s ease;
      }
      #coca-pepsi-zen-toggle.zen-active {
        background: rgba(0, 255, 204, 0.18);
        color: #00ffcc;
        border-color: #00ffcc;
      }
      #coca-pepsi-zen-toggle.zen-inactive {
        background: rgba(45, 45, 55, 0.9);
        color: #999;
        border-color: #555;
      }
    `;
  }

  function isStandingsPage() {
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();

    // 1. Strict Kill-Switch on problem or submission views
    if (
      path.includes('/problems/') ||
      path.includes('/submissions') ||
      path.includes('/submit') ||
      path.includes('/edit') ||
      path.includes('/announcements') ||
      path.includes('/stats') ||
      path.includes('/balloons') ||
      path.includes('/settings') ||
      path.includes('/admin') ||
      path.includes('/blog') ||
      path.includes('/organizations')
    ) {
      return false;
    }

    // 2. Explicit URL Match (contests ranking, public rankings, replay, and user leaderboard)
    if (
      path.includes('ranking') ||
      path.includes('standing') ||
      path.includes('leaderboard') ||
      path.includes('/replay') ||
      path === '/users' ||
      path === '/users/' ||
      search.includes('ranking') ||
      search.includes('standing')
    ) {
      return true;
    }

    // 3. DOM indicators
    return Boolean($(
      '#ranking-board, [data-replay-part="board"], table#ranking-table, table.ranking-table, ' +
      'table.leaderboard, [data-podium-rank], section[aria-label*="podium" i], section[aria-label*="bục" i], ' +
      '[data-testid="my-rank"], [data-testid="my-row"]'
    ));
  }

  function getContestantRows() {
    // 1. Check for specific table containers on QHHOJ v2 & classic OJ
    const targetTables = $$(
      '#ranking-board table, [data-replay-part="board"] table, ' +
      'table#ranking-table, table.ranking-table, table.leaderboard, ' +
      'main table, .page-column table, table'
    );

    for (const table of targetTables) {
      // Exclude header rows: only take rows that are in tbody, or rows not in thead that contain at least one td
      let rows = $$('tbody tr', table);
      if (rows.length === 0) {
        rows = $$('tr', table).filter((r) => !r.closest('thead'));
      }
      // Ensure these rows have td elements (i.e. data rows, ignoring pure thead th rows)
      const dataRows = rows.filter((r) => r.querySelectorAll('td').length > 0);
      if (dataRows.length > 0) {
        return dataRows;
      }
    }

    // 2. Check cards or flex lists if no table was found
    const potentialContainers = $$('div, section, ul');
    for (const container of potentialContainers) {
      if (container.closest('#coca-pepsi-zen-panel, #coca-pepsi-hud')) continue;
      const children = Array.from(container.children);
      if (children.length >= 3) {
        const matchingKids = children.filter((c) => {
          const t = (c.textContent || '').toLowerCase();
          return (
            (t.includes('điểm') || t.includes('score') || t.includes('pts') || t.includes('/')) &&
            (t.includes('1') || t.includes('2') || t.includes('0'))
          );
        });
        if (matchingKids.length >= 2) {
          return children;
        }
      }
    }

    // 3. Fallback: all table rows on the page that contain td (avoiding thead)
    return $$('tbody tr, tr').filter((r) => !r.closest('thead') && r.querySelectorAll('td').length > 0);
  }

  function targetMatchesWhitelist(target, whitelist) {
    if (!target) return false;

    // 1. Current user row indicators on QHHOJ v2:
    // - class "bg-surface-hover" (RankingTable and ReplayTable)
    // - class "bg-accent-soft" (LeaderboardTable)
    if (target.classList.contains('bg-surface-hover') || target.classList.contains('bg-accent-soft')) {
      return true;
    }

    // - "Bạn" / "You" badge / chip
    const hasSelfBadge = $$('span, div, small, b, strong, [class*="chip"]', target).some((b) => {
      const t = b.textContent ? b.textContent.trim().toLowerCase() : '';
      return t === 'bạn' || t === 'you' || t === '(bạn)' || t === '(you)';
    });
    if (hasSelfBadge) return true;

    // 2. Check explicit user links inside row:
    // Examples: /users/:username, /user/:username, /contests/:key/submissions?user=:username
    const userLinks = $$(
      'a[href*="/user/"], a[href*="/users/"], a[href*="/profile/"], a[href*="user="]',
      target
    );
    for (const link of userLinks) {
      const href = link.getAttribute('href') ? link.getAttribute('href') : '';
      let slug = '';
      const match1 = href.match(/\/(?:users?|profile)\/([^/?#]+)/i);
      if (match1 && match1[1]) slug = decodeURIComponent(match1[1]).trim().toLowerCase();
      const match2 = href.match(/[?&]user=([^&#]+)/i);
      if (match2 && match2[1]) slug = decodeURIComponent(match2[1]).trim().toLowerCase();

      const linkText = link.textContent ? link.textContent.trim().toLowerCase() : '';
      const linkTitle = (link.getAttribute('title') || '').trim().toLowerCase();

      for (const w of whitelist) {
        if (!w) continue;
        if (slug === w || linkText === w || linkTitle === w) {
          return true;
        }
      }
    }

    // 3. Check any element with title attribute (UserName component has :title="username")
    const titleElements = $$('[title]', target);
    for (const el of titleElements) {
      const title = (el.getAttribute('title') || '').trim().toLowerCase();
      if (title && whitelist.includes(title)) return true;
    }

    // 4. Match against text tokens inside row with token boundaries
    const rawText = target.textContent ? target.textContent : '';
    const lowerText = rawText.toLowerCase();
    for (const w of whitelist) {
      if (!w) continue;
      const regex = new RegExp(`(^|[^a-z0-9_-])${w}([^a-z0-9_-]|$)`, 'i');
      if (regex.test(lowerText)) return true;
    }

    return false;
  }

  function maskRankInTarget(target, isTableRow) {
    if (isTableRow) {
      const firstCell = $('td:first-child', target);
      if (firstCell && !maskedRankElements.has(firstCell)) {
        const text = (firstCell.textContent || '').trim();
        if (text && text !== '—') {
          maskedRankElements.set(firstCell, firstCell.innerHTML);
          firstCell.textContent = '—';
        }
      }
      return;
    }

    /* For div-based rows or podium cards: mask the leading rank cell or #1/#2/#3 badge */
    const firstChild = target.firstElementChild;
    if (firstChild) {
      const fcText = firstChild.textContent ? firstChild.textContent.trim() : '';
      if (/^#?\d+$/.test(fcText)) {
        if (!maskedRankElements.has(firstChild)) {
          maskedRankElements.set(firstChild, firstChild.innerHTML);
          firstChild.textContent = '—';
        }
      }
    }

    for (const el of $$('span, div, b, strong, p', target)) {
      if (el.children.length > 0) continue;
      const txt = el.textContent ? el.textContent.trim() : '';
      if (/^(#[1-9]\d*|[123](st|nd|rd)|hạng\s*[1-9]\d*)$/i.test(txt)) {
        if (!maskedRankElements.has(el)) {
          maskedRankElements.set(el, el.innerHTML);
          el.textContent = '—';
        }
      }
    }
  }

  function enforceZenStandings() {
    const isZenActive = localStorage.getItem('coca_pepsi_qhhoj_zen') === 'true';
    if (!isZenActive || !isStandingsPage()) return;

    // 1. Ensure active body class
    document.body.classList.add('coca-pepsi-zen-active');

    // 2. Hide podium elements
    const podiumSelectors = [
      'section[aria-label*="podium" i]',
      'section[aria-label*="bục" i]',
      'ol:has([data-podium-rank])',
      '[data-podium-rank]',
      '[data-skeleton-region="podium"]',
    ];
    for (const sel of podiumSelectors) {
      for (const el of $$(sel)) {
        const target = el.closest('section') || el;
        if (!target.classList.contains('coca-pepsi-zen-hidden')) {
          target.style.setProperty('display', 'none', 'important');
          target.classList.add('coca-pepsi-zen-hidden');
          hiddenPodiumElements.add(target);
        }
      }
    }

    // 3. Mask my-row rank button (in ContestRankingPage header: "Về hàng của tôi · #12")
    const myRowBtn = $('[data-testid="my-row"]');
    if (myRowBtn && !maskedRankElements.has(myRowBtn)) {
      maskedRankElements.set(myRowBtn, myRowBtn.innerHTML);
      for (const node of myRowBtn.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && /#\d+/.test(node.textContent)) {
          node.textContent = node.textContent.replace(/#\d+/, '#—');
        }
      }
    }

    // 4. Mask my-rank line (in LeaderboardPage header: "Xếp hạng của bạn: #123")
    const myRankEl = $('[data-testid="my-rank"]');
    if (myRankEl && !maskedRankElements.has(myRankEl)) {
      maskedRankElements.set(myRankEl, myRankEl.innerHTML);
      const btn = $('button', myRankEl);
      if (btn && /#\d+/.test(btn.textContent)) {
        btn.textContent = btn.textContent.replace(/#\d+/, '#—');
      }
    }

    // 5. Filter Competitor Rows & Mask Ranks
    const whitelist = getActiveWhitelist();
    const rows = getContestantRows();

    for (const target of rows) {
      const rawText = target.textContent ? target.textContent : '';
      const lowerText = rawText.toLowerCase();

      if (
        lowerText.includes('total ac') ||
        lowerText.includes('tổng điểm') ||
        lowerText.includes('first to solve') ||
        lowerText.includes('tên truy cập') ||
        lowerText.includes('thí sinh')
      ) {
        target.style.setProperty('display', '');
        continue;
      }

      const isTr = target.tagName === 'TR';
      if (targetMatchesWhitelist(target, whitelist)) {
        target.style.setProperty('display', '');
        target.classList.remove('coca-pepsi-zen-hidden');
        maskRankInTarget(target, isTr);
      } else {
        target.style.setProperty('display', 'none', 'important');
        target.classList.add('coca-pepsi-zen-hidden');
        hiddenRowElements.add(target);
      }
    }
  }

  function restoreAllStandings() {
    document.body.classList.remove('coca-pepsi-zen-active');

    for (const el of hiddenPodiumElements) {
      if (el && document.body.contains(el)) {
        el.style.setProperty('display', '');
        el.classList.remove('coca-pepsi-zen-hidden');
      }
    }
    hiddenPodiumElements.clear();

    for (const el of hiddenRowElements) {
      if (el && document.body.contains(el)) {
        el.style.setProperty('display', '');
        el.classList.remove('coca-pepsi-zen-hidden');
      }
    }
    hiddenRowElements.clear();

    $$('.coca-pepsi-zen-hidden').forEach((el) => {
      el.style.setProperty('display', '');
      el.classList.remove('coca-pepsi-zen-hidden');
    });

    for (const [el, originalHtml] of maskedRankElements.entries()) {
      if (el && document.body.contains(el)) {
        el.innerHTML = originalHtml;
      }
    }
    maskedRankElements.clear();
  }

  function startZenObserver() {
    if (zenObserver) return;

    let debounceTimer = null;
    zenObserver = new MutationObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        enforceZenStandings();
      }, 80);
    });

    zenObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function stopZenObserver() {
    if (zenObserver) {
      zenObserver.disconnect();
      zenObserver = null;
    }
  }

  function applyZenState(isEnabled) {
    injectZenStyles();

    if (isEnabled) {
      enforceZenStandings();
      startZenObserver();
    } else {
      restoreAllStandings();
      stopZenObserver();
    }

    let zenPanel = $('#coca-pepsi-zen-panel');
    if (!zenPanel) {
      zenPanel = document.createElement('div');
      zenPanel.id = 'coca-pepsi-zen-panel';

      const whitelistInput = document.createElement('input');
      whitelistInput.id = 'coca-pepsi-whitelist-input';
      whitelistInput.type = 'text';
      whitelistInput.placeholder = 'Rivals (comma separated)...';
      const rawWlItem = localStorage.getItem('coca_pepsi_qhhoj_whitelist');
      whitelistInput.value = rawWlItem ? rawWlItem : '';

      whitelistInput.addEventListener('input', () => {
        localStorage.setItem('coca_pepsi_qhhoj_whitelist', whitelistInput.value);
        restoreAllStandings();
        enforceZenStandings();
      });

      const zenToggleBtn = document.createElement('button');
      zenToggleBtn.id = 'coca-pepsi-zen-toggle';
      zenToggleBtn.addEventListener('click', toggleZenMode);

      zenPanel.appendChild(whitelistInput);
      zenPanel.appendChild(zenToggleBtn);
      document.body.appendChild(zenPanel);

      /* Drag-and-Drop for Zen Panel (NaN-safe) */
      const savedZenX = parseInt(localStorage.getItem('coca_pepsi_zen_x') || '', 10);
      const savedZenY = parseInt(localStorage.getItem('coca_pepsi_zen_y') || '', 10);
      if (!Number.isNaN(savedZenX) && !Number.isNaN(savedZenY)) {
        zenPanel.style.left = savedZenX + 'px';
        zenPanel.style.top = savedZenY + 'px';
        zenPanel.style.right = 'auto';
        zenPanel.style.bottom = 'auto';
      }
      zenPanel.style.cursor = 'grab';

      let isZenDragging = false;
      let zenHasMoved = false;
      let dragZenOffsetX = 0;
      let dragZenOffsetY = 0;

      zenPanel.addEventListener('mousedown', (e) => {
        const isInputEl = ['BUTTON', 'INPUT'].includes(e.target.tagName);
        if (isInputEl) return;
        isZenDragging = true;
        zenHasMoved = false;
        dragZenOffsetX = e.clientX - zenPanel.getBoundingClientRect().left;
        dragZenOffsetY = e.clientY - zenPanel.getBoundingClientRect().top;
        zenPanel.style.cursor = 'grabbing';
        e.preventDefault();
      });

      document.addEventListener('mousemove', (e) => {
        if (!isZenDragging) return;
        zenHasMoved = true;
        const panelWidth = zenPanel.offsetWidth;
        const panelHeight = zenPanel.offsetHeight;
        let newX = e.clientX - dragZenOffsetX;
        let newY = e.clientY - dragZenOffsetY;
        newX = Math.max(0, Math.min(newX, window.innerWidth - panelWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - panelHeight));
        zenPanel.style.left = newX + 'px';
        zenPanel.style.top = newY + 'px';
        zenPanel.style.right = 'auto';
        zenPanel.style.bottom = 'auto';
      });

      document.addEventListener('mouseup', () => {
        if (!isZenDragging) return;
        isZenDragging = false;
        zenPanel.style.cursor = 'grab';
        if (zenHasMoved) {
          const parsedX = parseInt(zenPanel.style.left, 10);
          const parsedY = parseInt(zenPanel.style.top, 10);
          if (!Number.isNaN(parsedX) && !Number.isNaN(parsedY)) {
            localStorage.setItem('coca_pepsi_zen_x', String(parsedX));
            localStorage.setItem('coca_pepsi_zen_y', String(parsedY));
          }
        }
        zenHasMoved = false;
      });
    }

    /* Only display the panel if we are actually on a Standings page */
    const isStand = isStandingsPage();
    zenPanel.style.display = isStand ? 'flex' : 'none';

    const zenToggleBtn = $('#coca-pepsi-zen-toggle');
    if (zenToggleBtn) {
      zenToggleBtn.textContent = isEnabled ? '🔒 Zen Mode ON' : '🌍 Zen Mode OFF';
      zenToggleBtn.className = isEnabled ? 'zen-active' : 'zen-inactive';
    }
  }

  function toggleZenMode() {
    const nowEnabled = localStorage.getItem('coca_pepsi_qhhoj_zen') !== 'true';
    localStorage.setItem('coca_pepsi_qhhoj_zen', String(nowEnabled));
    applyZenState(nowEnabled);
  }

  function initZenMode() {
    if (localStorage.getItem('coca_pepsi_qhhoj_zen') === null) {
      localStorage.setItem('coca_pepsi_qhhoj_zen', 'true');
    }

    const isEnabled = localStorage.getItem('coca_pepsi_qhhoj_zen') === 'true';
    applyZenState(isEnabled);

    document.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      const isInput = activeTag === 'INPUT';
      const isTextarea = activeTag === 'TEXTAREA';
      const isEditable = document.activeElement ? document.activeElement.isContentEditable : false;

      if (isInput || isTextarea || isEditable) {
        return;
      }

      const isAltZ = e.altKey && e.key.toLowerCase() === 'z';
      const isSlash = e.key === '\\';

      if (isAltZ || isSlash) {
        e.preventDefault();
        toggleZenMode();
      }
    });
  }

  /* ==========================================
     5. SPA-Aware Initialization Loop
     ========================================== */

  let lastUrl = '';

  function tick() {
    const currentUrl = window.location.href;
    const isStand = isStandingsPage();
    const isZenEnabled = localStorage.getItem('coca_pepsi_qhhoj_zen') === 'true';

    /* SPA Check: Constantly evaluate if we are on the standings page */
    let zenPanel = $('#coca-pepsi-zen-panel');
    if (isStand && (!zenPanel || !document.body.contains(zenPanel))) {
      applyZenState(isZenEnabled);
      zenPanel = $('#coca-pepsi-zen-panel');
    }
    if (zenPanel) {
      zenPanel.style.display = isStand ? 'flex' : 'none';
    }

    if (isStand && isZenEnabled) {
      enforceZenStandings();
    }

    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;

      const problemId = getProblemId();
      if (problemId) {
        setTimeout(() => initHud(problemId), 300);
      } else {
        const hasHud = currentHud ? document.body.contains(currentHud) : false;
        if (hasHud) {
          currentHud.remove();
          currentHud = null;
          currentProblemId = null;
        }
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      }

      applyZenState(isZenEnabled);
    }
  }

  function bootstrap() {
    registerShortcuts();
    initZenMode();
    tick();
    setInterval(tick, 400);
    window.addEventListener('popstate', () => setTimeout(tick, 100));
  }

  const isComplete = document.readyState === 'complete';
  const isInteractive = document.readyState === 'interactive';
  const shouldBoot = isComplete ? true : isInteractive;

  if (shouldBoot) {
    bootstrap();
  } else {
    window.addEventListener('DOMContentLoaded', bootstrap, { once: true });
    window.addEventListener('load', bootstrap, { once: true });
  }
})();
