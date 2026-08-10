(function () {
  // ==========================================
  // DMOJ-based OJ Helper
  // Supports: dmoj.ca, oj.vnoi.info, qhhoj.com
  // ==========================================

  function $(selector, root = document) {
    try {
      return root.querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  // ==========================================
  // 1. Problem Page: Alt + S to Jump to Submit
  // ==========================================

  function setupProblemPage() {
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();

        // DMOJ problem URL: /problem/{code}
        // Submit URL: /problem/{code}/submit
        const problemMatch = window.location.pathname.match(/^\/problem\/([^/]+)\/?$/);
        if (problemMatch) {
          const problemCode = problemMatch[1];
          window.open(`/problem/${problemCode}/submit`, '_blank');
        } else {
          // Fallback: look for a Submit link in the page
          const submitLink = $('a[href$="/submit"]')
            || Array.from(document.querySelectorAll('a')).find(a =>
              a.textContent.trim() === 'Submit' || a.textContent.trim() === 'Submit solution'
            );
          if (submitLink) {
            window.open(submitLink.href, '_blank');
          } else {
            console.log('CocaPepsi CP: No submit link found on DMOJ problem page.');
          }
        }
      }
    });
  }

  // ==========================================
  // 2. Submit Page: Auto-Focus & Ctrl + Enter
  // ==========================================

  function setupSubmitPage() {
    // Scroll to the bottom after a short delay for Cloudflare / lazy content
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    }, 360);

    // --- Auto-focus the Ace editor ---
    let elapsed = 0;
    const focusInterval = setInterval(() => {
      elapsed += 100;

      // DMOJ uses Ace Editor — look for its internal text input
      const aceInput = $('.ace_text-input');
      if (aceInput) {
        aceInput.focus();
        clearInterval(focusInterval);
        return;
      }

      // Fallback: the hidden source textarea (#id_source)
      const sourceTextarea = $('#id_source, textarea[name="source"]');
      if (sourceTextarea && sourceTextarea.offsetParent !== null) {
        sourceTextarea.focus();
        clearInterval(focusInterval);
        return;
      }

      if (elapsed >= 3000) {
        clearInterval(focusInterval);
      }
    }, 100);

    // --- Ctrl + Enter: Submit via capture-phase keydown ---
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();

        const submitBtn = $('button[type="submit"], input[type="submit"], #submit-id, .submit');
        if (submitBtn) {
          console.log('CocaPepsi CP: Ctrl+Enter submit on DMOJ!');
          if (submitBtn.form) {
            submitBtn.form.requestSubmit(submitBtn);
          } else {
            submitBtn.click();
          }
        } else {
          console.log('CocaPepsi CP: Submit button not found on DMOJ.');
        }
      }
    }, true);
  }

  // ==========================================
  // 3. The Receiver: Chrome Commands API Bridge
  // ==========================================

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'NUKES_AWAY') {
      console.log('CocaPepsi CP: NUKES_AWAY received on DMOJ! Forcing submit...');
      const btn = $('button[type="submit"], input[type="submit"], #submit-id, .submit');
      if (btn) {
        if (btn.form) {
          btn.form.requestSubmit(btn);
        } else {
          btn.click();
        }
      } else {
        console.log('CocaPepsi CP: ERROR - submit button not found on DMOJ.');
      }
    }
  });

  // ==========================================
  // 4. Zen Standings (Hide Everyone Except You)
  // ==========================================

  function setupZenMode() {
    // --- 1. Inject CSS (once, idempotently) ---
    const styleId = 'coca-pepsi-zen-style';
    function ensureStyleInjected() {
      if (document.getElementById(styleId)) return;
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Hide page chrome in zen mode */
        body.coca-pepsi-zen .sidebar,
        body.coca-pepsi-zen footer,
        body.coca-pepsi-zen .comments {
          display: none !important;
        }
        /* Zen toggle button */
        #coca-pepsi-zen-btn-container {
          display: flex;
          margin-bottom: 15px;
          justify-content: center;
        }
        .coca-pepsi-zen-btn {
          display: inline-block;
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
      `;
      document.head.appendChild(style);
    }

    // --- 2. The Enforcer: Asynchronous Row Filtering ---
    function enforceZenStandings() {
      const tableRows = document.querySelectorAll('table.standings tbody tr, .table tbody tr');

      // If the table hasn't loaded yet, return early — the interval will retry
      if (tableRows.length === 0) return;

      const rawInput = localStorage.getItem('coca_pepsi_zen_whitelist') || '';
      const visibleUsers = rawInput.split(',').map(name => name.trim()).filter(name => name.length > 0);

      for (const currentRow of tableRows) {
        const rowText = currentRow.textContent;
        const isStatsRow = rowText.includes('Total AC') || currentRow.classList.contains('statistics') || currentRow.classList.contains('standings-statistics') || currentRow.closest('tfoot');

        if (isStatsRow) {
          const showStats = localStorage.getItem('coca_pepsi_show_stats') === 'true';
          currentRow.style.display = showStats ? '' : 'none';
          continue;
        }
        const shouldShow = visibleUsers.some(targetUser => rowText.toLowerCase().includes(targetUser.toLowerCase())) || currentRow.classList.contains('info');
        currentRow.style.display = shouldShow ? '' : 'none';
      }
    }

    // --- 3. Restore all rows to visible ---
    function restoreAllRows() {
      const tableRows = document.querySelectorAll('table.standings tbody tr, .table tbody tr');
      for (const currentRow of tableRows) {
        currentRow.style.display = '';
      }
    }

    // --- 4. Zen State Manager (with polling interval) ---
    const btnContainerId = 'coca-pepsi-zen-btn-container';

    function applyZenState(isZen) {
      // a) Sync body class
      if (isZen) {
        document.body.classList.add('coca-pepsi-zen');
      } else {
        document.body.classList.remove('coca-pepsi-zen');
      }

      // b) Ensure CSS is still injected
      ensureStyleInjected();

      if (isZen) {
        // c) Run the enforcer immediately
        enforceZenStandings();

        // d) Start persistent polling to catch async-loaded table data
        if (!window.zenInterval) {
          window.zenInterval = setInterval(enforceZenStandings, 500);
        }
      } else {
        // e) Restore all rows and kill the polling interval
        restoreAllRows();
        if (window.zenInterval) {
          clearInterval(window.zenInterval);
          window.zenInterval = null;
        }
      }

      // f) Check if our button still exists — re-inject if destroyed
      const standingsTable = document.querySelector(
        'table#users-table, table.users-table, table.ranking-table, ' +
        'table.standings, .contest-ranking table, table.table.striped, table.table'
      );

      let controlWrapper = document.getElementById(btnContainerId);
      let zenBtn;
      let statsToggleBtn;
      let whitelistInput;

      if (!controlWrapper) {
        if (!standingsTable) return;

        controlWrapper = document.createElement('div');
        controlWrapper.id = btnContainerId;
        controlWrapper.style.display = 'flex';
        controlWrapper.style.justifyContent = 'center';
        controlWrapper.style.alignItems = 'center';
        controlWrapper.style.gap = '10px';
        controlWrapper.style.margin = '15px 0';
        controlWrapper.style.width = '100%';

        zenBtn = document.createElement('button');
        zenBtn.className = 'coca-pepsi-zen-btn';
        zenBtn.addEventListener('click', toggleZen);
        
        statsToggleBtn = document.createElement('button');
        statsToggleBtn.id = 'coca-pepsi-stats-btn';
        statsToggleBtn.style.padding = '4px 12px';
        statsToggleBtn.style.fontWeight = 'bold';
        statsToggleBtn.style.borderRadius = '4px';
        statsToggleBtn.style.border = '1px solid #555';
        statsToggleBtn.style.background = '#333';
        statsToggleBtn.style.color = '#fff';
        statsToggleBtn.style.cursor = 'pointer';
        
        const initialShowStats = localStorage.getItem('coca_pepsi_show_stats') === 'true';
        statsToggleBtn.textContent = initialShowStats ? '📊 Stats: ON' : '📊 Stats: OFF';
        
        statsToggleBtn.addEventListener('click', () => {
          const currentStats = localStorage.getItem('coca_pepsi_show_stats') === 'true';
          localStorage.setItem('coca_pepsi_show_stats', String(!currentStats));
          statsToggleBtn.textContent = !currentStats ? '📊 Stats: ON' : '📊 Stats: OFF';
          enforceZenStandings();
        });

        whitelistInput = document.createElement('input');
        whitelistInput.type = 'text';
        whitelistInput.id = 'coca-pepsi-whitelist';
        whitelistInput.placeholder = 'Zen Mode Rivals (comma separated)...';
        whitelistInput.style.padding = '4px';
        whitelistInput.style.borderRadius = '4px';
        whitelistInput.style.border = '1px solid #555';
        whitelistInput.style.background = '#222';
        whitelistInput.style.color = '#fff';
        whitelistInput.style.flexGrow = '1';
        whitelistInput.style.maxWidth = '300px';
        whitelistInput.value = localStorage.getItem('coca_pepsi_zen_whitelist') || '';
        
        whitelistInput.addEventListener('input', (e) => {
          localStorage.setItem('coca_pepsi_zen_whitelist', e.target.value);
          enforceZenStandings();
        });

        controlWrapper.appendChild(zenBtn);
        controlWrapper.appendChild(statsToggleBtn);
        controlWrapper.appendChild(whitelistInput);

        const filterForm = document.querySelector('.form-inline, form#filter, #filter');
        if (filterForm && filterForm.parentNode) {
          filterForm.parentNode.insertBefore(controlWrapper, filterForm.nextSibling);
        } else {
          standingsTable.parentNode.insertBefore(controlWrapper, standingsTable);
        }
      } else {
        zenBtn = controlWrapper.querySelector('.coca-pepsi-zen-btn');
        statsToggleBtn = controlWrapper.querySelector('#coca-pepsi-stats-btn');
        whitelistInput = controlWrapper.querySelector('#coca-pepsi-whitelist');
      }

      // g) Update button text/styles
      if (zenBtn) {
        zenBtn.textContent = isZen ? "❤️ Only You" : "🌍 Reveal Standings";
        zenBtn.classList.toggle('zen-on', isZen);
        zenBtn.classList.toggle('zen-off', !isZen);
      }
      if (whitelistInput) {
        whitelistInput.style.display = isZen ? 'block' : 'none';
      }
      if (statsToggleBtn) {
        statsToggleBtn.style.display = isZen ? 'block' : 'none';
      }
    }

    // --- 6. Toggle Logic ---
    function toggleZen() {
      const nowOn = localStorage.getItem('coca_pepsi_dmoj_zen') !== 'true';
      localStorage.setItem('coca_pepsi_dmoj_zen', String(nowOn));
      applyZenState(nowOn);
    }

    // --- 7. State Management (default ON) ---
    if (localStorage.getItem('coca_pepsi_dmoj_zen') === null) {
      localStorage.setItem('coca_pepsi_dmoj_zen', 'true');
    }

    // Initial application
    const isOn = localStorage.getItem('coca_pepsi_dmoj_zen') === 'true';
    applyZenState(isOn);

    // --- 8. Keybindings (Alt + Z or \) ---
    document.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if ((e.altKey && e.key.toLowerCase() === 'z') || e.key === '\\') {
        e.preventDefault();
        toggleZen();
      }
    });
  }

  // ==========================================
  // Initialization
  // ==========================================

  function init() {
    const path = window.location.pathname;

    // Submit page: /problem/{code}/submit
    const isSubmitPage = /^\/problem\/[^/]+\/submit/.test(path);

    // Problem page: /problem/{code} (but NOT /submit, /submissions, etc.)
    const isProblemPage = /^\/problem\/[^/]+\/?$/.test(path);

    // Ranking pages: */ranking or /users
    const isRankingPage = /\/ranking\/?/.test(path) || /^\/users\/?/.test(path);

    if (isSubmitPage) {
      setupSubmitPage();
    } else if (isProblemPage) {
      setupProblemPage();
    }

    if (isRankingPage) {
      setupZenMode();
    }
  }

  // Run on load
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    window.addEventListener('DOMContentLoaded', init, { once: true });
    window.addEventListener('load', init, { once: true });
  }

})();
