(function () {
  /* ==========================================
     Kilonova Helper (kilonova.ro)
     SPA-aware with DOM polling, Dark HUD,
     persistent timer, and submission shortcuts
     ========================================== */

  let currentHud = null;
  let currentProblemId = null;
  let timerInterval = null;
  let hudDragListenersAttached = false;
  let isHudDragging = false;
  let hudHasMoved = false;
  let hudDragOffsetX = 0;
  let hudDragOffsetY = 0;
  let shortcutsRegistered = false;
  let lastUrl = '';

  const timerState = {
    isRunning: false,
    accumulatedTime: 0,
    startTime: 0,
    lsRunning: '',
    lsAccumulated: '',
    lsStart: '',
    pauseButton: null,
    timerLabel: null,
  };

  /* ==========================================
     1. Helper: Element Visibility Check
     ========================================== */

  function isElementVisible(element) {
    if (!element) {
      return false;
    }
    const style = window.getComputedStyle(element);
    if (style.display === 'none') {
      return false;
    }
    if (style.visibility === 'hidden') {
      return false;
    }
    if (style.opacity === '0') {
      return false;
    }
    const rect = element.getBoundingClientRect();
    const hasWidth = rect.width > 0;
    const hasHeight = rect.height > 0;
    return hasWidth ? hasHeight : false;
  }

  /* ==========================================
     2. Dynamic Problem ID Extraction
     ========================================== */

  function getProblemId() {
    const pathname = window.location.pathname ? window.location.pathname : '';
    const contestMatch = pathname.match(/\/contests\/[A-Za-z0-9_-]+\/problems\/([A-Za-z0-9_-]+)/);
    const problemMatch = pathname.match(/\/problems\/([A-Za-z0-9_-]+)/);
    const match = contestMatch ? contestMatch : problemMatch;
    return match ? match[1] : null;
  }

  /* ==========================================
     3. Persistent Timer Logic
     ========================================== */

  function pauseTimer() {
    if (!timerState.isRunning) {
      return;
    }
    timerState.accumulatedTime += Date.now() - timerState.startTime;
    timerState.isRunning = false;
    localStorage.setItem(timerState.lsRunning, 'false');
    localStorage.setItem(timerState.lsAccumulated, String(timerState.accumulatedTime));
    if (timerState.pauseButton) {
      timerState.pauseButton.innerText = '▶ Resume';
    }
  }

  function resumeTimer() {
    if (timerState.isRunning) {
      return;
    }
    timerState.startTime = Date.now();
    timerState.isRunning = true;
    localStorage.setItem(timerState.lsRunning, 'true');
    localStorage.setItem(timerState.lsStart, String(timerState.startTime));
    if (timerState.pauseButton) {
      timerState.pauseButton.innerText = '⏸ Pause';
    }
  }

  function resetTimer() {
    timerState.accumulatedTime = 0;
    timerState.startTime = Date.now();
    timerState.isRunning = false;
    localStorage.setItem(timerState.lsRunning, 'false');
    localStorage.setItem(timerState.lsAccumulated, '0');
    localStorage.removeItem(timerState.lsStart);
    if (timerState.pauseButton) {
      timerState.pauseButton.innerText = '▶ Resume';
    }
    if (timerState.timerLabel) {
      timerState.timerLabel.innerText = '00:00:00';
      timerState.timerLabel.style.color = '#00ffcc';
    }
  }

  function getTotalSeconds() {
    const elapsedMs = timerState.isRunning ? (Date.now() - timerState.startTime) : 0;
    return Math.floor((timerState.accumulatedTime + elapsedMs) / 1000);
  }

  function formatTime(totalSeconds) {
    const hoursPart = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutesPart = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secondsPart = String(totalSeconds % 60).padStart(2, '0');
    return `${hoursPart}:${minutesPart}:${secondsPart}`;
  }

  function updateTimerDisplay() {
    if (timerState.timerLabel) {
      timerState.timerLabel.innerText = formatTime(getTotalSeconds());
    }
  }

  /* Re-render timer immediately upon tab visibility restoration */
  document.addEventListener('visibilitychange', () => {
    const isVisible = !document.hidden;
    const hasProblem = currentProblemId ? true : false;
    if (isVisible ? hasProblem : false) {
      updateTimerDisplay();
    }
  });

  /* ==========================================
     4. Draggable Dark Mode HUD & Mobility Logic
     ========================================== */

  function attachHudDragListeners() {
    if (hudDragListenersAttached) {
      return;
    }
    hudDragListenersAttached = true;

    document.addEventListener('mousemove', (e) => {
      const shouldDrag = isHudDragging ? (currentHud ? true : false) : false;
      if (!shouldDrag) {
        return;
      }
      hudHasMoved = true;
      const hudWidth = currentHud.offsetWidth;
      const hudHeight = currentHud.offsetHeight;
      let newX = e.clientX - hudDragOffsetX;
      let newY = e.clientY - hudDragOffsetY;
      newX = Math.max(0, Math.min(newX, window.innerWidth - hudWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - hudHeight));
      currentHud.style.left = `${newX}px`;
      currentHud.style.top = `${newY}px`;
      currentHud.style.right = 'auto';
      currentHud.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!isHudDragging) {
        return;
      }
      isHudDragging = false;
      if (currentHud) {
        currentHud.style.cursor = 'grab';
        if (hudHasMoved) {
          const parsedX = parseInt(currentHud.style.left, 10);
          const parsedY = parseInt(currentHud.style.top, 10);
          if (!Number.isNaN(parsedX) ? !Number.isNaN(parsedY) : false) {
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
    if (isSameProblem ? hasHud : false) {
      return;
    }

    if (hasHud) {
      currentHud.remove();
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

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

    const controlButtonStyle = `
      background: rgba(34, 34, 40, 0.9); color: #ccc; border: 1px solid #555; border-radius: 5px;
      font-size: 11px; padding: 4px 12px; cursor: pointer; font-family: inherit;
      transition: all 0.2s ease; outline: none;
    `;
    const applyButtonHover = (btn) => {
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

    const pauseButton = document.createElement('button');
    pauseButton.style.cssText = controlButtonStyle;
    pauseButton.innerText = timerState.isRunning ? '⏸ Pause' : '▶ Resume';
    timerState.pauseButton = pauseButton;
    applyButtonHover(pauseButton);

    pauseButton.addEventListener('click', () => {
      if (timerState.isRunning) {
        pauseTimer();
      } else {
        resumeTimer();
      }
      updateTimerDisplay();
    });

    const resetButton = document.createElement('button');
    resetButton.style.cssText = controlButtonStyle;
    resetButton.innerText = '⏹ Reset';
    applyButtonHover(resetButton);

    resetButton.addEventListener('click', () => {
      resetTimer();
    });

    buttonRow.appendChild(pauseButton);
    buttonRow.appendChild(resetButton);
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
    const savedXRaw = localStorage.getItem('coca_pepsi_hud_x');
    const savedYRaw = localStorage.getItem('coca_pepsi_hud_y');
    const savedX = parseInt(savedXRaw ? savedXRaw : '', 10);
    const savedY = parseInt(savedYRaw ? savedYRaw : '', 10);
    if (!Number.isNaN(savedX) ? !Number.isNaN(savedY) : false) {
      hudContainer.style.left = `${savedX}px`;
      hudContainer.style.top = `${savedY}px`;
      hudContainer.style.right = 'auto';
      hudContainer.style.bottom = 'auto';
    }
    hudContainer.style.cursor = 'grab';

    hudContainer.addEventListener('mousedown', (e) => {
      const targetTagName = e.target ? e.target.tagName : '';
      const isInteractive = ['BUTTON', 'SELECT', 'OPTION', 'INPUT', 'A', 'TEXTAREA'].includes(targetTagName);
      if (isInteractive) {
        return;
      }
      isHudDragging = true;
      hudHasMoved = false;
      hudDragOffsetX = e.clientX - hudContainer.getBoundingClientRect().left;
      hudDragOffsetY = e.clientY - hudContainer.getBoundingClientRect().top;
      hudContainer.style.cursor = 'grabbing';
      e.preventDefault();
    });

    attachHudDragListeners();
  }

  function removeHud() {
    const hasHud = currentHud ? document.body.contains(currentHud) : false;
    if (hasHud) {
      currentHud.remove();
    }
    currentHud = null;
    currentProblemId = null;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /* ==========================================
     5. Alt + S (Jump to Submit) & Focus Logic
     ========================================== */

  function focusCodeEditor() {
    let attemptCount = 0;
    const maxAttempts = 15;
    const checkInterval = setInterval(() => {
      attemptCount += 1;

      // Ace editor
      const aceInput = document.querySelector('.ace_text-input');
      if (aceInput) {
        aceInput.focus();
        clearInterval(checkInterval);
        return;
      }

      // Monaco editor
      const monacoInput = document.querySelector('.monaco-editor textarea, .monaco-editor [contenteditable="true"]');
      if (monacoInput) {
        monacoInput.focus();
        clearInterval(checkInterval);
        return;
      }

      // CodeMirror
      const cmInput = document.querySelector('.cm-content, .CodeMirror textarea');
      if (cmInput) {
        cmInput.focus();
        clearInterval(checkInterval);
        return;
      }

      // Standard textarea
      const textareas = Array.from(document.querySelectorAll('textarea'));
      for (let index = 0; index < textareas.length; index += 1) {
        const textareaElement = textareas[index];
        if (isElementVisible(textareaElement)) {
          textareaElement.focus();
          clearInterval(checkInterval);
          return;
        }
      }

      // File input
      const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
      for (let index = 0; index < fileInputs.length; index += 1) {
        const fileElement = fileInputs[index];
        if (isElementVisible(fileElement)) {
          fileElement.focus();
          clearInterval(checkInterval);
          return;
        }
      }

      if (attemptCount >= maxAttempts) {
        clearInterval(checkInterval);
      }
    }, 100);
  }

  function findSubmitTrigger() {
    // 1. Direct submit links matching problem submit path
    const submitLinks = Array.from(document.querySelectorAll('a[href*="/submit"], a[href$="/submit"]'));
    for (let index = 0; index < submitLinks.length; index += 1) {
      const linkElement = submitLinks[index];
      if (isElementVisible(linkElement)) {
        return linkElement;
      }
    }

    // 2. Buttons, links, tabs, or labels by Romanian and English keywords
    const candidateElements = Array.from(document.querySelectorAll('a, button, [role="button"], [role="tab"], label, input[type="button"], input[type="submit"]'));
    const keywords = [
      'trimite solutia',
      'trimite soluția',
      'trimite',
      'incarcare cod',
      'încărcare cod',
      'incarca cod',
      'încarcă cod',
      'incarcare',
      'încărcare',
      'incarca',
      'încarcă',
      'upload code',
      'upload',
      'submit'
    ];

    for (let index = 0; index < candidateElements.length; index += 1) {
      const candidate = candidateElements[index];
      const textContent = candidate.textContent ? candidate.textContent.trim().toLowerCase() : '';
      const ariaLabel = candidate.getAttribute('aria-label') ? candidate.getAttribute('aria-label').toLowerCase() : '';
      const combinedText = `${textContent} ${ariaLabel}`;

      for (let k = 0; k < keywords.length; k += 1) {
        if (combinedText.includes(keywords[k])) {
          if (isElementVisible(candidate)) {
            return candidate;
          }
        }
      }
    }

    // 3. File input or its corresponding label
    const fileInputLabel = document.querySelector('label[for="source-file"], label[for="file"], label[for*="file"], label[for*="source"]');
    if (fileInputLabel ? isElementVisible(fileInputLabel) : false) {
      return fileInputLabel;
    }

    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput ? isElementVisible(fileInput) : false) {
      return fileInput;
    }

    return null;
  }

  function handleJumpToSubmit() {
    const triggerElement = findSubmitTrigger();
    if (triggerElement) {
      triggerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      triggerElement.click();
      console.log('CocaPepsi CP: Alt+S -> Found and clicked submit trigger.');
      focusCodeEditor();
    } else {
      const problemId = getProblemId();
      if (problemId) {
        const isAlreadyOnSubmitPage = window.location.pathname ? window.location.pathname.endsWith('/submit') : false;
        if (!isAlreadyOnSubmitPage) {
          console.log('CocaPepsi CP: Alt+S -> Navigating to problem submit page.');
          window.location.href = `/problems/${problemId}/submit`;
        } else {
          focusCodeEditor();
        }
      }
    }
  }

  /* ==========================================
     6. Ctrl + Enter (Launch Payload) Logic
     ========================================== */

  function findPhysicalSubmitButton() {
    // 1. Inside forms (e.g., active submission form)
    const forms = Array.from(document.querySelectorAll('form'));
    for (let f = 0; f < forms.length; f += 1) {
      const formElement = forms[f];
      const formSubmitButtons = Array.from(formElement.querySelectorAll('button[type="submit"], input[type="submit"], button.btn-blue, button.btn-primary, button'));
      for (let b = 0; b < formSubmitButtons.length; b += 1) {
        const btn = formSubmitButtons[b];
        const text = btn.textContent ? btn.textContent.trim().toLowerCase() : '';
        const isSubmitText = text.includes('trimite') ? true : (text.includes('submit') ? true : (text.includes('încărcare') ? true : (text.includes('upload') ? true : false)));
        const isTypeSubmit = btn.getAttribute('type') === 'submit';
        if (isSubmitText ? true : isTypeSubmit) {
          if (isElementVisible(btn)) {
            return btn;
          }
        }
      }
    }

    // 2. Global buttons
    const candidates = Array.from(document.querySelectorAll('button, input[type="submit"], [role="button"]'));
    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      const text = candidate.textContent ? candidate.textContent.trim().toLowerCase() : '';
      const isSubmitText = text.includes('trimite') ? true : (text.includes('submit') ? true : (text.includes('încărcare') ? true : (text.includes('upload') ? true : false)));
      const isTypeSubmit = candidate.getAttribute('type') === 'submit';
      if (isSubmitText ? true : isTypeSubmit) {
        if (isElementVisible(candidate)) {
          return candidate;
        }
      }
    }

    // 3. Visible submit input fallback
    const anySubmit = document.querySelector('button[type="submit"], input[type="submit"]');
    if (anySubmit ? isElementVisible(anySubmit) : false) {
      return anySubmit;
    }

    return null;
  }

  /* ==========================================
     7. Shortcut Registration (Capture Phase)
     ========================================== */

  function registerShortcuts() {
    if (shortcutsRegistered) {
      return;
    }
    shortcutsRegistered = true;

    // Alt + S: Jump to Submit
    document.addEventListener('keydown', (event) => {
      const isAlt = event.altKey;
      const isS = event.key ? (event.key.toLowerCase() === 's') : false;
      if (isAlt ? isS : false) {
        event.preventDefault();
        event.stopPropagation();
        handleJumpToSubmit();
      }
    }, true);

    // Ctrl + Enter / Meta + Enter: Launch Payload
    document.addEventListener('keydown', (event) => {
      const isCtrlOrMeta = event.ctrlKey ? true : event.metaKey;
      const isEnter = event.key === 'Enter';
      if (isCtrlOrMeta ? isEnter : false) {
        if (!getProblemId()) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const physicalSubmitButton = findPhysicalSubmitButton();
        if (physicalSubmitButton) {
          console.log('CocaPepsi CP: Ctrl+Enter -> Launching payload on Kilonova.');
          physicalSubmitButton.click();
        } else {
          console.log('CocaPepsi CP: Ctrl+Enter -> Physical submit button not found.');
        }
      }
    }, true);
  }

  /* ==========================================
     8. SPA Polling Loop (tick) & Life Cycle
     ========================================== */

  function tick() {
    const currentUrl = window.location.href ? window.location.href : '';
    const problemId = getProblemId();

    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      if (problemId) {
        setTimeout(() => {
          initHud(problemId);
        }, 300);
      } else {
        removeHud();
      }
    } else {
      if (problemId) {
        const hasHudInDom = currentHud ? document.body.contains(currentHud) : false;
        if (!hasHudInDom) {
          initHud(problemId);
        }
      }
    }
  }

  // Register shortcuts once
  registerShortcuts();

  // Initial tick
  tick();

  // Polling loop for SPA navigation changes and DOM detachment
  setInterval(tick, 500);

  // Browser navigation listeners
  window.addEventListener('popstate', () => {
    setTimeout(tick, 100);
  });
  window.addEventListener('hashchange', () => {
    setTimeout(tick, 100);
  });

  // HTMX dynamic content swap listener
  document.addEventListener('htmx:afterSwap', () => {
    setTimeout(tick, 100);
  });
})();
