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
    // --- 1. Identify Current User ---
    let currentUsername = "";
    const navLinks = document.querySelectorAll('.navbar a[href^="/user/"], header a[href^="/user/"], #nav-container a[href^="/user/"], .nav a[href^="/user/"]');
    for (const link of navLinks) {
      const text = link.textContent.trim();
      if (text && !text.toLowerCase().includes("login") && !text.toLowerCase().includes("register")) {
        currentUsername = text;
        break;
      }
    }

    // --- 2. Inject CSS (once, idempotently) ---
    const STYLE_ID = 'coca-pepsi-zen-style';
    function ensureStyleInjected() {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        .coca-pepsi-zen table tr.coca-pepsi-zen-other {
          display: none !important;
        }
        .coca-pepsi-zen .navbar,
        .coca-pepsi-zen #navigation,
        .coca-pepsi-zen .sidebar,
        .coca-pepsi-zen footer,
        .coca-pepsi-zen .comments,
        .coca-pepsi-zen .user-info {
          display: none !important;
        }
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

    // --- 3. Tag Competitor Rows ---
    function tagRankingRows() {
      const standingsTable = document.querySelector('table.table, table.users-table, table.ranking-table, table.standings, .contest-ranking table');
      if (!standingsTable) return;
      const rows = standingsTable.querySelectorAll('tr');
      rows.forEach(row => {
        const rowText = row.textContent || "";
        const isCurrentUser = currentUsername && rowText.includes(currentUsername);
        const hasUserLink = row.querySelector('a[href^="/user/"]');
        if (hasUserLink && !isCurrentUser) {
          row.classList.add('coca-pepsi-zen-other');
        } else {
          row.classList.remove('coca-pepsi-zen-other');
        }
      });
    }

    // --- 4. Central State Applier (the heart of auto-healing) ---
    const BTN_CONTAINER_ID = 'coca-pepsi-zen-btn-container';

    function applyZenState(isZen) {
      // a) Sync body class
      if (isZen) {
        document.body.classList.add('coca-pepsi-zen');
      } else {
        document.body.classList.remove('coca-pepsi-zen');
      }

      // b) Ensure CSS is still injected
      ensureStyleInjected();

      // c) Re-tag ranking rows
      tagRankingRows();

      // d) Check if our button still exists — re-inject if destroyed
      let btnContainer = document.getElementById(BTN_CONTAINER_ID);
      let zenBtn;

      if (!btnContainer) {
        const standingsTable = document.querySelector('table.table, table.users-table, table.ranking-table, table.standings, .contest-ranking table');
        if (!standingsTable) return;

        btnContainer = document.createElement('div');
        btnContainer.id = BTN_CONTAINER_ID;

        zenBtn = document.createElement('button');
        zenBtn.className = 'coca-pepsi-zen-btn';
        zenBtn.addEventListener('click', toggleZen);
        btnContainer.appendChild(zenBtn);

        standingsTable.parentNode.insertBefore(btnContainer, standingsTable);
      } else {
        zenBtn = btnContainer.querySelector('.coca-pepsi-zen-btn');
      }

      // e) Update button text/styles
      if (zenBtn) {
        zenBtn.textContent = isZen ? "❤️ Only You" : "🌍 Reveal Standings";
        zenBtn.classList.toggle('zen-on', isZen);
        zenBtn.classList.toggle('zen-off', !isZen);
      }
    }

    // --- 5. Toggle Logic ---
    function toggleZen() {
      const nowOn = localStorage.getItem('coca_pepsi_dmoj_zen') !== 'true';
      localStorage.setItem('coca_pepsi_dmoj_zen', String(nowOn));
      applyZenState(nowOn);
    }

    // --- 6. State Management (default ON) ---
    if (localStorage.getItem('coca_pepsi_dmoj_zen') === null) {
      localStorage.setItem('coca_pepsi_dmoj_zen', 'true');
    }

    // Initial application
    const isOn = localStorage.getItem('coca_pepsi_dmoj_zen') === 'true';
    applyZenState(isOn);

    // --- 7. Keybindings (Alt + Z or \) ---
    document.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if ((e.altKey && e.key.toLowerCase() === 'z') || e.key === '\\') {
        e.preventDefault();
        toggleZen();
      }
    });

    // --- 8. The DOM Sentinel (MutationObserver) ---
    let sentinelDebounce = null;

    function sentinelCheck() {
      const shouldBeZen = localStorage.getItem('coca_pepsi_dmoj_zen') === 'true';

      // Check a) Body class was stripped
      const hasClass = document.body.classList.contains('coca-pepsi-zen');
      if (shouldBeZen && !hasClass) {
        applyZenState(true);
        return;
      }

      // Check b) Button was wiped out
      if (!document.getElementById(BTN_CONTAINER_ID)) {
        applyZenState(shouldBeZen);
        return;
      }

      // Check c) CSS was destroyed
      if (!document.getElementById(STYLE_ID)) {
        applyZenState(shouldBeZen);
        return;
      }

      // Check d) New rows appeared without tagging
      tagRankingRows();
    }

    const sentinel = new MutationObserver(() => {
      // Debounce: wait 200ms after the last mutation before checking
      if (sentinelDebounce) clearTimeout(sentinelDebounce);
      sentinelDebounce = setTimeout(sentinelCheck, 200);
    });

    sentinel.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    // Also watch <head> for style removal
    if (document.head) {
      sentinel.observe(document.head, {
        childList: true,
        subtree: false
      });
    }
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
