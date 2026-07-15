(function () {
  // ==========================================
  // 0. Zen Standings Configuration
  // ==========================================
  const ZEN_ON_TEXT = "Only You";
  const ZEN_OFF_TEXT = "🌍 Reveal Standings";
  const ZEN_HOTKEY = "\\";
  const ZEN_ALIGN = "center"; // Options: "left", "center", "right"
  // ==========================================
  // 1. Helper Functions
  // ==========================================

  function $(selector, root = document) {
    try {
      return root.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  function $all(selector, root = document) {
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch (e) {
      return [];
    }
  }

  // ==========================================
  // 2. Core UI Modification (Convert Form)
  // ==========================================

  function convert() {
    let textarea = document.querySelector('textarea[name="sourceFile"]');

    // If there's no textarea, look for a file input and replace it
    if (!textarea) {
      const input = document.querySelector('input[name="sourceFile"]');
      if (!input) return false;

      textarea = document.createElement('textarea');

      // Copy over existing attributes (except type)
      for (const attr of Array.from(input.attributes)) {
        if (attr.name !== 'type') {
          textarea.setAttribute(attr.name, attr.value);
        }
      }

      // Apply clean, dark-mode styling
      Object.assign(textarea.style, {
        minHeight: '150px',
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid #555',
        background: '#131313',
        color: '#e3e3e3',
        boxSizing: 'border-box',
        resize: 'vertical',
        outline: 'none',
        fontFamily: 'monospace',
        fontSize: '14px',
        transition: '0.15s border'
      });

      // Add focus/blur border transitions
      textarea.addEventListener('focus', () => { textarea.style.border = '1px solid #999'; });
      textarea.addEventListener('blur', () => { textarea.style.border = '1px solid #555'; });

      // Swap the input out for the new textarea
      input.parentNode.replaceChild(textarea, input);
    }

    // Insert an easter egg text quote
    const fields = document.querySelectorAll('.field');
    if (fields.length > 1) {
      fields[1].innerHTML = 'The winner takes it all<br>The loser has to fall';
    }

    // Ensure the form opens in a new tab
    const form = document.querySelector('.submitForm, form.submitForm');
    if (form) {
      form.setAttribute('target', '_blank');
    }

    // Style and position the Submit Button
    const btn = document.querySelector(
      '.submitForm input[type="submit"], .submitForm button[type="submit"], input.submit, button.submit'
    );

    if (btn && textarea) {
      if (btn.tagName === 'INPUT') {
        btn.value = 'Here goes nothing';
      } else {
        btn.textContent = 'Here goes nothing';
      }

      const width = Math.floor(textarea.offsetWidth * 0.75);

      Object.assign(btn.style, {
        display: 'block',
        width: width + 'px',
        margin: '12px 0 0 0',
        height: 'auto',
        padding: '6px 10px',
        lineHeight: '1.2',
        boxSizing: 'border-box',
        textAlign: 'center',
        overflow: 'visible',
        fontSize: Math.max(12, Math.min(15, Math.floor(width / 18))) + 'px',
        position: 'relative'
      });

      // Center the button beneath the textarea
      const tRect = textarea.getBoundingClientRect();
      const parentRect = btn.parentElement.getBoundingClientRect();
      const leftOffset = tRect.left - parentRect.left + (textarea.offsetWidth - width) / 2;

      btn.style.left = leftOffset + 'px';
    }

    return true;
  }

  // ==========================================
  // 3. Form Submission & Custom Notices
  // ==========================================

  function notices() {
    function adjustNotice(id) {
      const noticeElement = document.querySelector('.programTypeNotice');
      if (!noticeElement) return;

      noticeElement.textContent = '';

      // IDs 7 and 31 refer to PyPy submissions
      if (id === 7 || id === 31) {
        noticeElement.textContent = 'Almost always, if you send a solution on PyPy, it works much faster';
      }
    }

    adjustNotice(54);

    // Listen for language selector changes
    const selector = document.querySelector("select[name='programTypeId']");
    if (selector) {
      selector.addEventListener('change', function () {
        adjustNotice(parseInt(this.value || '0', 10));
      });
    }

    // Handle form submission logic
    const forms = $all('.submit-form, .submitForm');
    forms.forEach(form => {
      form.addEventListener('submit', function () {

        // Inject background global tokens if present
        try {
          const ftaa = form.querySelector("textarea[name='ftaa']");
          const bfaa = form.querySelector("textarea[name='bfaa']");
          if (window._ftaa && window._bfaa) {
            if (ftaa) ftaa.value = window._ftaa;
            if (bfaa) bfaa.value = window._bfaa;
          }
        } catch (e) { }

        // Fix encoding types if sending plain text instead of a file
        try {
          if (form.getAttribute('enctype') === 'multipart/form-data') {
            const sourceFile = form.querySelector(".table-form textarea[name=sourceFile]");
            if (sourceFile && (!sourceFile.files || sourceFile.files.length === 0)) {
              form.removeAttribute('enctype');
            }
          }
        } catch (e) { }

        // Temporarily disable submit buttons to prevent accidental double-clicks
        const btns = $all('button[type="submit"], .submit', form);
        btns.forEach(b => b.disabled = true);
        setTimeout(() => btns.forEach(b => b.disabled = false), 1500);

        return true;
      });
    });
  }

  // ==========================================
  // 4. Global Keyboard Shortcuts
  // ==========================================

  function globalShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Alt + S: scroll to and focus the code textarea
      if (event.altKey && event.key.toLowerCase() === 's') {

        const textarea = document.querySelector('textarea[name="sourceFile"]');
        if (textarea) {
          event.preventDefault();

          // Smoothly scroll the page so the box is in the center
          textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // Focus the cursor inside the box
          textarea.focus();
        }
      }
    });
  }

  // ==========================================
  // 5. Timer & Live Verdict Tracker
  // ==========================================

  function timerAndTracker() {
    if (!window.location.href.includes('/problem/')) return;

    const profileLink = document.querySelector('a[href^="/profile/"]');
    if (!profileLink) return;
    const handle = profileLink.textContent.trim();

    // Create the floating UI widget
    const widget = document.createElement('div');

    Object.assign(widget.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#131313',
      border: '1px solid #555',
      borderRadius: '8px',
      padding: '8px 16px 16px 16px',
      color: '#e3e3e3',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
      resize: 'both',
      overflow: 'hidden',
      minWidth: '160px',
      minHeight: '110px'
    });

    widget.innerHTML = `
      <div id="cf-drag-handle" style="width: 100%; height: 12px; background: #2a2a2a; border-radius: 4px; cursor: grab; margin-bottom: 4px;"></div>
      <div id="cf-timer" style="font-size: 18px; font-weight: bold; color: #fff;">00:00</div>
      <div id="cf-status" style="color: #aaa; font-size: 12px; text-align: center;">Solving...</div>
      <div style="display: flex; gap: 6px; width: 100%;">
        <button id="cf-stop-btn" style="flex: 1; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; padding: 4px 0; cursor: pointer;">Pause</button>
        <button id="cf-reset-btn" style="flex: 1; background: #552222; color: #ff9999; border: 1px solid #773333; border-radius: 4px; padding: 4px 0; cursor: pointer;">Reset</button>
      </div>
    `;
    document.body.appendChild(widget);

    // --- Dragging Logic ---
    const dragHandle = document.getElementById('cf-drag-handle');
    let isDragging = false;
    let offsetX, offsetY;

    dragHandle.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragHandle.style.cursor = 'grabbing';
      const rect = widget.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      widget.style.bottom = 'auto';
      widget.style.right = 'auto';
      widget.style.left = rect.left + 'px';
      widget.style.top = rect.top + 'px';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      widget.style.left = (e.clientX - offsetX) + 'px';
      widget.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      dragHandle.style.cursor = 'grab';
    });

    // --- Timer, Memory & Toggle Logic ---
    const timerEl = document.getElementById('cf-timer');
    const statusEl = document.getElementById('cf-status');
    const stopBtn = document.getElementById('cf-stop-btn');
    const resetBtn = document.getElementById('cf-reset-btn');

    const storageKey = `cf_state_${window.location.pathname}`;

    let savedState = JSON.parse(localStorage.getItem(storageKey)) || {
      seconds: 0,
      isRunning: false,
      statusText: 'Solving...',
      statusColor: '#aaa',
      isFinished: false
    };

    // Page Load Scanner to fix the Refresh Bug
    function checkIfAlreadySolved() {
      const acSpan = document.querySelector('.verdict-accepted');
      const topAlert = document.querySelector('.alert-success');
      if (acSpan || (topAlert && topAlert.textContent.toLowerCase().includes('correct solution'))) {
        return true;
      }
      return false;
    }

    // If the page proves it's solved, force the state to Finished immediately
    if (checkIfAlreadySolved()) {
      savedState.isFinished = true;
      savedState.isRunning = false;
      savedState.statusText = 'Accepted! 🎉';
      savedState.statusColor = '#00ff00';
    }

    let seconds = savedState.seconds;
    let timerInterval;
    let isRunning = false;

    function saveState() {
      localStorage.setItem(storageKey, JSON.stringify({
        seconds: seconds,
        isRunning: isRunning,
        statusText: statusEl.textContent,
        statusColor: statusEl.style.color,
        isFinished: stopBtn.style.display === 'none'
      }));
    }

    function updateTimerDisplay() {
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
    }

    function startTimer() {
      if (isRunning) return;
      isRunning = true;
      statusEl.textContent = 'Solving...';
      statusEl.style.color = '#aaa';
      stopBtn.textContent = 'Pause';
      stopBtn.style.background = '#333';

      timerInterval = setInterval(() => {
        seconds++;
        updateTimerDisplay();
        saveState();
      }, 1000);
      saveState();
    }

    function pauseTimer(finalText = 'Paused', color = '#fff', hideButton = false) {
      isRunning = false;
      clearInterval(timerInterval);
      statusEl.textContent = finalText;
      statusEl.style.color = color;

      if (hideButton) {
        stopBtn.style.display = 'none';
      } else {
        stopBtn.style.display = 'block';
        stopBtn.textContent = 'Resume';
        stopBtn.style.background = '#2e8b57';
      }
      saveState();
    }

    // --- Boot up the state ---
    updateTimerDisplay();
    statusEl.textContent = savedState.statusText;
    statusEl.style.color = savedState.statusColor;

    if (savedState.isFinished) {
      stopBtn.style.display = 'none';
      timerEl.style.color = '#00ff00';
    } else if (savedState.isRunning) {
      startTimer();
    } else {
      if (savedState.seconds > 0) pauseTimer(savedState.statusText, savedState.statusColor);
      else startTimer();
    }

    // Manual Buttons
    stopBtn.addEventListener('click', () => {
      if (isRunning) pauseTimer('Paused by User');
      else startTimer();
    });

    resetBtn.addEventListener('click', () => {
      localStorage.removeItem(storageKey);
      seconds = 0;
      updateTimerDisplay();
      timerEl.style.color = '#fff';
      if (stopBtn.style.display === 'none') stopBtn.style.display = 'block';
      if (!isRunning) startTimer();
      else {
        statusEl.textContent = 'Solving...';
        statusEl.style.color = '#aaa';
        saveState();
      }
    });

    // --- API Polling on Submit ---
    const forms = $all('.submit-form, .submitForm');
    forms.forEach(form => {
      form.addEventListener('submit', () => {
        statusEl.textContent = 'Submitted! Waiting for judge...';
        statusEl.style.color = '#ffcc00';
        saveState();

        const checker = setInterval(async () => {
          try {
            const res = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1`);
            const data = await res.json();

            if (data.status === 'OK' && data.result.length > 0) {
              const submission = data.result[0];

              if (submission.verdict === 'TESTING') {
                statusEl.textContent = `Testing on case ${submission.passedTestCount + 1}...`;
                return;
              }

              clearInterval(checker);
              if (submission.verdict === 'OK') {
                pauseTimer('Accepted! 🎉', '#00ff00', true);
                timerEl.style.color = '#00ff00';
                saveState();
              } else {
                const verdictText = submission.verdict.replace(/_/g, ' ');
                statusEl.textContent = verdictText;
                statusEl.style.color = '#ff3333';
                saveState();
              }
            }
          } catch (e) {
            console.log('Error checking CF API', e);
          }
        }, 3000);
      });
    });
  }

  // ==========================================
  // 6. Contest PDF Downloader
  // ==========================================

  function contestPdfDownloader() {
    // Extract the full path prefix up to the contest/gym ID (preserves /group/GROUPID/ if present)
    const pathMatch = window.location.pathname.match(/(.*\/(?:contest|gym)\/\d+)/);
    if (!pathMatch) return;
    const basePath = pathMatch[1];

    // On a contest/gym page (not a specific problem), inject the download button
    if (!window.location.href.includes('/problem/')) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        const btn = document.createElement('button');
        btn.textContent = 'Download Contest PDF';
        Object.assign(btn.style, {
          display: 'block',
          width: '100%',
          padding: '10px 16px',
          marginBottom: '12px',
          background: '#1a73e8',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          textAlign: 'center',
          transition: '0.2s background'
        });
        btn.addEventListener('mouseenter', () => { btn.style.background = '#1558b0'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#1a73e8'; });
        btn.addEventListener('click', () => {
          window.open(`${window.location.origin}${basePath}/problems?cocapepsi_print=true`, '_blank');
        });
        sidebar.insertBefore(btn, sidebar.firstChild);
      }
    }
  }

  // ==========================================
  // 7. Clean Room PDF Print
  // ==========================================

  function executeCleanRoomPrint() {
    if (!window.location.href.includes('cocapepsi_print=true')) return;

    // Create a loading screen covering the page
    const loading = document.createElement('div');
    loading.textContent = 'CocaPepsi CP: Waiting for problems to load...';
    Object.assign(loading.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: '#1a73e8',
      color: '#fff',
      fontSize: '22px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '99999'
    });
    document.body.prepend(loading);

    // Poll until problem content actually appears in the DOM
    let elapsed = 0;
    const pollInterval = setInterval(() => {
      elapsed += 500;
      const problems = document.querySelectorAll('.problemindexholder');

      // Proceed once problems are found, or give up after 20 seconds
      if (problems.length > 0 || elapsed >= 20000) {
        clearInterval(pollInterval);

        if (problems.length === 0) {
          loading.textContent = 'CocaPepsi CP: No problems found on this page.';
          return;
        }

        loading.textContent = 'CocaPepsi CP: Rendering MathJax...';

        // Give MathJax an extra 2 seconds to finish rendering after content is in the DOM
        setTimeout(() => {
          // Build a clean container with only the problems
          const container = document.createElement('div');
          problems.forEach(p => container.appendChild(p.cloneNode(true)));

          // Completely overwrite the body with the clean content
          document.body.innerHTML = '';
          document.body.appendChild(container);

          // Inject clean print-ready styling
          const style = document.createElement('style');
          style.textContent = `
            body {
              background: #fff;
              color: #000;
              margin: 0;
              padding: 20px;
              font-family: sans-serif;
            }
            .problemindexholder {
              display: block;
              width: 100%;
              page-break-after: always;
              margin-bottom: 50px;
            }
            .problemindexholder:last-child {
              page-break-after: auto;
            }
            .sample-test {
              border: 1px solid #ccc;
              background: #f9f9f9;
              padding: 10px;
              page-break-inside: avoid;
            }
          `;
          document.head.appendChild(style);

          window.print();
        }, 2000);
      }
    }, 500);
  }

  // ==========================================
  // 8. Hide Tags Except Rating
  // ==========================================

  function hideTagsExceptRating() {
    const tags = $all('.tag-box');
    const spoilerTags = tags.filter(tag => tag.getAttribute('title') !== 'Difficulty');
    if (spoilerTags.length === 0) return;

    // Hide tags by default
    let tagsHidden = true;
    spoilerTags.forEach(tag => {
      tag.style.setProperty('display', 'none', 'important');
    });

    // Create toggle button
    const toggleBtn = document.createElement('span');
    toggleBtn.textContent = 'Show tags';
    Object.assign(toggleBtn.style, {
      display: 'inline-block',
      padding: '2px 8px',
      marginLeft: '6px',
      fontSize: '11px',
      color: '#888',
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer',
      verticalAlign: 'middle',
      userSelect: 'none'
    });

    toggleBtn.addEventListener('click', () => {
      tagsHidden = !tagsHidden;
      spoilerTags.forEach(tag => {
        if (tagsHidden) {
          tag.style.setProperty('display', 'none', 'important');
        } else {
          tag.style.removeProperty('display');
        }
      });
      toggleBtn.textContent = tagsHidden ? 'Show tags' : 'Hide tags';
    });

    // Insert the toggle button next to the tags
    const tagParent = spoilerTags[0].parentElement;
    if (tagParent) {
      tagParent.appendChild(toggleBtn);
    }
  }

  // ==========================================
  // 9. Show Submission Ratings
  // ==========================================

  function showSubmissionRatings() {
    if (!window.location.href.includes('/status')) return;

    const CACHE_KEY = 'cf_problem_ratings';
    const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

    function applyRatings(ratingsMap) {
      const rows = $all('.status-frame-datatable tr');
      rows.forEach(row => {
        const links = $all('a', row);
        for (const link of links) {
          const match = link.href.match(/\/(contest|gym)\/(\d+)\/problem\/([A-Za-z0-9]+)/);
          if (match) {
            const key = `${match[2]}-${match[3]}`;
            const rating = ratingsMap[key];
            if (rating) {
              const span = document.createElement('span');
              span.textContent = `(*${rating})`;
              Object.assign(span.style, {
                color: '#888',
                fontSize: '11px',
                marginLeft: '6px',
                fontWeight: 'bold'
              });
              link.parentElement.appendChild(span);
            }
            break;
          }
        }
      });
    }

    // Check localStorage cache
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && cached.timestamp && (Date.now() - cached.timestamp < CACHE_MAX_AGE)) {
        applyRatings(cached.data);
        return;
      }
    } catch (e) { }

    // Fetch fresh data from the API
    fetch('https://codeforces.com/api/problemset.problems')
      .then(res => res.json())
      .then(data => {
        if (data.status !== 'OK') return;
        const ratingsMap = {};
        data.result.problems.forEach(p => {
          if (p.rating) {
            ratingsMap[`${p.contestId}-${p.index}`] = p.rating;
          }
        });
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: ratingsMap,
          timestamp: Date.now()
        }));
        applyRatings(ratingsMap);
      })
      .catch(e => console.log('Error fetching CF problem ratings', e));
  }

  // ==========================================
  // 10. Zen Standings (Hide Everyone Except You)
  // ==========================================

  function initZenMode() {
    const standingsTable = document.querySelector('table.standings');
    const problemsTable = document.querySelector('table.problems');

    // Only activate if we're on standings or contest problems page
    if (!standingsTable && !problemsTable) return;

    // --- Inject CSS: standings row-hiding + rank column hiding + button styles ---
    const style = document.createElement('style');
    style.textContent = `
      .coca-pepsi-zen table.standings tr[participantid]:not(.highlighted-row):not(.current) {
        display: none !important;
      }
      .coca-pepsi-zen table.standings th:nth-child(1),
      .coca-pepsi-zen table.standings td:nth-child(1) {
        display: none !important;
      }
      .coca-pepsi-zen-btn {
        display: inline-block;
        margin-bottom: 8px;
        padding: 6px 14px;
        font-size: 13px;
        font-weight: bold;
        font-family: inherit;
        cursor: pointer;
        border: 1px solid;
        border-radius: 8px;
        transition: all 0.2s ease;
        outline: none;
        user-select: none;
      }
      .coca-pepsi-zen-btn.zen-on {
        background: linear-gradient(135deg, #ff6b6b, #ee5a24);
        color: #fff;
        border-color: #d63031;
        box-shadow: 0 2px 8px rgba(238, 90, 36, 0.3);
      }
      .coca-pepsi-zen-btn.zen-on:hover {
        background: linear-gradient(135deg, #ff4757, #c44569);
        box-shadow: 0 3px 12px rgba(238, 90, 36, 0.45);
        transform: translateY(-1px);
      }
      .coca-pepsi-zen-btn.zen-off {
        background: linear-gradient(135deg, #636e72, #2d3436);
        color: #dfe6e9;
        border-color: #555;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      }
      .coca-pepsi-zen-btn.zen-off:hover {
        background: linear-gradient(135deg, #74b9ff, #0984e3);
        color: #fff;
        border-color: #0984e3;
        box-shadow: 0 3px 12px rgba(9, 132, 227, 0.4);
        transform: translateY(-1px);
      }
      #coca-pepsi-zen-nav-btn {
        padding: 4px 12px;
        font-weight: bold;
        font-family: arial, sans-serif;
        font-size: 13px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-left: 10px;
        vertical-align: middle;
      }
    `;
    document.head.appendChild(style);

    // --- State management — default to ON ---
    if (localStorage.getItem('coca_pepsi_zen') === null) {
      localStorage.setItem('coca_pepsi_zen', 'true');
    }
    const isOn = localStorage.getItem('coca_pepsi_zen') === 'true';
    if (isOn) {
      document.body.classList.add('coca-pepsi-zen');
    }

    // --- JS DOM-Stripping: Hide/Restore solver count column on problems table ---
    function stripSolverColumn(hide) {
      if (!problemsTable) return;
      const rows = problemsTable.querySelectorAll('tr');
      rows.forEach(row => {
        if (row.children.length > 0) {
          const lastCell = row.children[row.children.length - 1];
          lastCell.style.display = hide ? 'none' : '';
        }
      });
      // Bulletproof fallback: hide participant links and icons
      document.querySelectorAll('table.problems a[title*="Participants"], table.problems a[title*="solved"]').forEach(el => {
        el.style.display = hide ? 'none' : '';
      });
    }

    // Apply immediately based on saved state
    if (isOn) stripSolverColumn(true);

    // --- Create standings table button (if on standings page) ---
    let zenBtn = null;
    if (standingsTable) {
      zenBtn = document.createElement('button');
      zenBtn.className = 'coca-pepsi-zen-btn';

      const btnContainer = document.createElement('div');
      btnContainer.style.display = 'flex';
      btnContainer.style.marginBottom = '15px';
      const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
      btnContainer.style.justifyContent = alignMap[ZEN_ALIGN] || 'flex-end';
      btnContainer.appendChild(zenBtn);
      standingsTable.parentNode.insertBefore(btnContainer, standingsTable);
    }

    // --- Create nav menu button (injected into secondary menu) ---
    let navBtn = null;
    const secondMenu = document.querySelector('ul.second-level-menu-list');
    if (secondMenu) {
      const li = document.createElement('li');
      navBtn = document.createElement('button');
      navBtn.id = 'coca-pepsi-zen-nav-btn';
      li.appendChild(navBtn);
      secondMenu.appendChild(li);
    }

    // --- Sync all button states ---
    function updateButtons() {
      const active = document.body.classList.contains('coca-pepsi-zen');
      if (zenBtn) {
        zenBtn.textContent = active ? ZEN_ON_TEXT : ZEN_OFF_TEXT;
        zenBtn.classList.toggle('zen-on', active);
        zenBtn.classList.toggle('zen-off', !active);
      }
      if (navBtn) {
        navBtn.textContent = active ? 'Zen: ON' : 'Zen: OFF';
        if (active) {
          navBtn.style.background = 'linear-gradient(to bottom, #e8f5e9, #c8e6c9)';
          navBtn.style.border = '1px solid #81c784';
          navBtn.style.color = '#2e7d32';
          navBtn.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.1)';
        } else {
          navBtn.style.background = 'linear-gradient(to bottom, #ffffff, #f0f0f0)';
          navBtn.style.border = '1px solid #cccccc';
          navBtn.style.color = '#777777';
          navBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
        }
      }
    }
    updateButtons();

    // --- Shared toggle logic ---
    function toggleZen() {
      document.body.classList.toggle('coca-pepsi-zen');
      const nowOn = document.body.classList.contains('coca-pepsi-zen');
      localStorage.setItem('coca_pepsi_zen', String(nowOn));
      stripSolverColumn(nowOn);
      updateButtons();
    }

    // Click handlers
    if (zenBtn) zenBtn.addEventListener('click', toggleZen);
    if (navBtn) navBtn.addEventListener('click', toggleZen);

    // Global keyboard shortcut
    document.addEventListener('keydown', (e) => {
      // Don't trigger while typing in inputs or textareas
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (e.key === ZEN_HOTKEY) {
        e.preventDefault();
        toggleZen();
      }
    });
  }

  // ==========================================
  // Initialization
  // ==========================================

  function init() {
    convert();
    notices();
    globalShortcuts();
    timerAndTracker();
    contestPdfDownloader();
    executeCleanRoomPrint();
    hideTagsExceptRating();
    showSubmissionRatings();
    initZenMode();

    // Ctrl + Enter to submit (capture phase, registered once globally)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const submitBtn = document.querySelector(
          '.submit-form input[type="submit"], .submitForm input[type="submit"], button.submit'
        );
        if (submitBtn) {
          console.log('CocaPepsi CP: Triggering submit...');
          submitBtn.click();
        }
      }
    }, true);
  }

  // Run on load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    window.addEventListener('DOMContentLoaded', init, { once: true });
    window.addEventListener('load', init, { once: true });
  }

  // Watch the DOM for changes (helps if Codeforces dynamically loads elements)
  const observer = new MutationObserver(() => {
    if (document.querySelector('input[name="sourceFile"]')) {
      convert();
      notices();
    }
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true
  });

  // Failsafe retry loop just in case the element loads slightly delayed
  const retry = setInterval(() => {
    if (convert()) {
      notices();
      clearInterval(retry);
    }
  }, 500);

  setTimeout(() => clearInterval(retry), 10000); // Stop retrying after 10 seconds

})();
