(function () {
  function getProblemId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || urlParams.get('problem_id');
  }

  function initHudContainer(problemId) {
    if (!problemId) return;

    if (document.getElementById('coca-pepsi-hud')) return;

    const hudContainer = document.createElement('div');
    hudContainer.id = 'coca-pepsi-hud';
    hudContainer.style.cssText = `
      position: fixed; top: 70px; right: 20px; z-index: 99999;
      background: rgba(30, 30, 30, 0.95); backdrop-filter: blur(8px);
      border: 1px solid #444; border-radius: 8px; padding: 15px 20px;
      color: white; font-family: sans-serif; display: flex; flex-direction: column;
      align-items: center; box-shadow: 0 8px 16px rgba(0,0,0,0.5);
      min-width: 160px;
    `;

    const problemBadge = document.createElement('div');
    problemBadge.style.cssText = "font-size: 11px; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;";
    problemBadge.innerText = problemId;
    hudContainer.appendChild(problemBadge);

    const timerLabel = document.createElement('div');
    timerLabel.style.cssText = "font-size: 22px; font-weight: bold; font-family: Consolas, monospace; letter-spacing: 2px; margin-bottom: 12px; color: #00ffcc;";
    timerLabel.innerText = "00:00:00";
    hudContainer.appendChild(timerLabel);

    const lsRunningKey = `coca_pepsi_timer_running_${problemId}`;
    const lsAccumulatedKey = `coca_pepsi_timer_accumulated_${problemId}`;
    const lsStartKey = `coca_pepsi_timer_start_${problemId}`;

    let isTimerRunning = localStorage.getItem(lsRunningKey) === 'true';
    let accumulatedTime = parseInt(localStorage.getItem(lsAccumulatedKey) || '0', 10);
    let startTime = parseInt(localStorage.getItem(lsStartKey) || '0', 10);

    if (localStorage.getItem(lsRunningKey) === null) {
      isTimerRunning = true;
      startTime = Date.now();
      localStorage.setItem(lsRunningKey, 'true');
      localStorage.setItem(lsAccumulatedKey, '0');
      localStorage.setItem(lsStartKey, String(startTime));
    }

    function getTotalSeconds() {
      const elapsedTime = isTimerRunning ? (Date.now() - startTime) : 0;
      return Math.floor((accumulatedTime + elapsedTime) / 1000);
    }

    function formatTime(totalSeconds) {
      const displayHours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const displayMinutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const displaySeconds = String(totalSeconds % 60).padStart(2, '0');
      return `${displayHours}:${displayMinutes}:${displaySeconds}`;
    }

    function updateDisplay() {
      timerLabel.innerText = formatTime(getTotalSeconds());
    }

    updateDisplay();
    setInterval(updateDisplay, 1000);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = "display: flex; gap: 6px; margin-bottom: 4px;";

    const buttonStyle = `
      background: #222; color: #eee; border: 1px solid #666; border-radius: 4px;
      font-size: 11px; padding: 4px 10px; cursor: pointer; font-family: sans-serif;
      transition: background 0.2s, color 0.2s, border-color 0.2s; outline: none;
    `;

    const pauseButton = document.createElement('button');
    pauseButton.style.cssText = buttonStyle;
    pauseButton.innerText = isTimerRunning ? '⏸ Pause' : '▶ Resume';

    pauseButton.addEventListener('mouseenter', () => { pauseButton.style.background = '#333'; pauseButton.style.color = '#fff'; pauseButton.style.borderColor = '#888'; });
    pauseButton.addEventListener('mouseleave', () => { pauseButton.style.background = '#222'; pauseButton.style.color = '#eee'; pauseButton.style.borderColor = '#666'; });

    pauseButton.addEventListener('click', () => {
      if (isTimerRunning) {
        accumulatedTime += Date.now() - startTime;
        isTimerRunning = false;
        localStorage.setItem(lsRunningKey, 'false');
        localStorage.setItem(lsAccumulatedKey, String(accumulatedTime));
        pauseButton.innerText = '▶ Resume';
      } else {
        startTime = Date.now();
        isTimerRunning = true;
        localStorage.setItem(lsRunningKey, 'true');
        localStorage.setItem(lsStartKey, String(startTime));
        pauseButton.innerText = '⏸ Pause';
      }
      updateDisplay();
    });

    const resetButton = document.createElement('button');
    resetButton.style.cssText = buttonStyle;
    resetButton.innerText = '⏹ Reset';

    resetButton.addEventListener('mouseenter', () => { resetButton.style.background = '#333'; resetButton.style.color = '#fff'; resetButton.style.borderColor = '#888'; });
    resetButton.addEventListener('mouseleave', () => { resetButton.style.background = '#222'; resetButton.style.color = '#eee'; resetButton.style.borderColor = '#666'; });

    resetButton.addEventListener('click', () => {
      accumulatedTime = 0;
      startTime = Date.now();
      isTimerRunning = false;
      localStorage.setItem(lsRunningKey, 'false');
      localStorage.setItem(lsAccumulatedKey, '0');
      localStorage.removeItem(lsStartKey);
      pauseButton.innerText = '▶ Resume';
      timerLabel.innerText = '00:00:00';
    });

    buttonContainer.appendChild(pauseButton);
    buttonContainer.appendChild(resetButton);
    hudContainer.appendChild(buttonContainer);

    document.body.appendChild(hudContainer);

    const savedXPosition = localStorage.getItem('coca_pepsi_hud_x');
    const savedYPosition = localStorage.getItem('coca_pepsi_hud_y');
    if (savedXPosition !== null && savedYPosition !== null) {
      hudContainer.style.left = savedXPosition + 'px';
      hudContainer.style.top = savedYPosition + 'px';
      hudContainer.style.right = 'auto';
      hudContainer.style.bottom = 'auto';
    }
    hudContainer.style.cursor = 'grab';

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    hudContainer.addEventListener('mousedown', (e) => {
      if (['BUTTON', 'SELECT', 'OPTION', 'INPUT'].includes(e.target.tagName)) return;
      isDragging = true;
      dragOffsetX = e.clientX - hudContainer.getBoundingClientRect().left;
      dragOffsetY = e.clientY - hudContainer.getBoundingClientRect().top;
      hudContainer.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const containerWidth = hudContainer.offsetWidth;
      const containerHeight = hudContainer.offsetHeight;
      let newXPosition = e.clientX - dragOffsetX;
      let newYPosition = e.clientY - dragOffsetY;
      newXPosition = Math.max(0, Math.min(newXPosition, window.innerWidth - containerWidth));
      newYPosition = Math.max(0, Math.min(newYPosition, window.innerHeight - containerHeight));
      hudContainer.style.left = newXPosition + 'px';
      hudContainer.style.top = newYPosition + 'px';
      hudContainer.style.right = 'auto';
      hudContainer.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      hudContainer.style.cursor = 'grab';
      localStorage.setItem('coca_pepsi_hud_x', parseInt(hudContainer.style.left, 10));
      localStorage.setItem('coca_pepsi_hud_y', parseInt(hudContainer.style.top, 10));
    });
  }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const problemId = getProblemId();
        const submitLink = document.querySelector('a[href*="submit?problem_id="]');
        
        if (submitLink) {
          submitLink.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => submitLink.click(), 300);
        } else if (problemId) {
          window.location.href = `/submit?problem_id=${problemId}`;
        }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (window.location.pathname.includes('submit')) {
          e.preventDefault();
          e.stopPropagation();
          const submitButton = document.querySelector('input[type="submit"][name="Submit"], input[type="submit"]');
          if (submitButton) {
            submitButton.click();
          }
        }
      }
    }, true);
  }

  function initializeExtension() {
    const problemId = getProblemId();
    if (problemId) {
      initHudContainer(problemId);
    }
    setupKeyboardShortcuts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    initializeExtension();
  }

})();
