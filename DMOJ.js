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
    // Only run if there is a ranking table
    const standingsTable = document.querySelector('table.table, table.users-table, table.ranking-table, table.standings, .contest-ranking table');
    if (!standingsTable) return;

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

    // --- 2. Tag Competitor Rows ---
    function tagRankingRows() {
      const rows = standingsTable.querySelectorAll('tr');
      rows.forEach(row => {
        const rowText = row.textContent || "";
        const isCurrentUser = currentUsername && rowText.includes(currentUsername);
        
        // Competitor rows almost always have a user link
        const hasUserLink = row.querySelector('a[href^="/user/"]');
        
        if (hasUserLink && !isCurrentUser) {
          row.classList.add('coca-pepsi-zen-other');
        } else {
          row.classList.remove('coca-pepsi-zen-other');
        }
      });
    }
    
    // Tag rows immediately and also on a slight delay for dynamic scoreboards
    tagRankingRows();
    setTimeout(tagRankingRows, 1500);

    // --- 3. Inject CSS ---
    const style = document.createElement('style');
    style.textContent = `
      .coca-pepsi-zen table tr.coca-pepsi-zen-other {
        display: none !important;
      }
      .coca-pepsi-zen-btn {
        display: inline-block;
        margin-bottom: 12px;
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

    // --- 4. State management (default ON) ---
    if (localStorage.getItem('coca_pepsi_dmoj_zen') === null) {
      localStorage.setItem('coca_pepsi_dmoj_zen', 'true');
    }
    const isOn = localStorage.getItem('coca_pepsi_dmoj_zen') === 'true';
    if (isOn) {
      document.body.classList.add('coca-pepsi-zen');
    }

    // --- 5. Create Button ---
    const zenBtn = document.createElement('button');
    zenBtn.className = 'coca-pepsi-zen-btn';

    function updateBtn() {
      const active = document.body.classList.contains('coca-pepsi-zen');
      zenBtn.textContent = active ? "❤️ Only You" : "🌍 Reveal Standings";
      zenBtn.classList.toggle('zen-on', active);
      zenBtn.classList.toggle('zen-off', !active);
    }
    updateBtn();

    // Insert the button right above the standings table
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.marginBottom = '15px';
    btnContainer.style.justifyContent = 'center'; // Center alignment
    btnContainer.appendChild(zenBtn);
    standingsTable.parentNode.insertBefore(btnContainer, standingsTable);

    // --- 6. Shared Toggle Logic ---
    function toggleZen() {
      document.body.classList.toggle('coca-pepsi-zen');
      const nowOn = document.body.classList.contains('coca-pepsi-zen');
      localStorage.setItem('coca_pepsi_dmoj_zen', String(nowOn));
      updateBtn();
      tagRankingRows(); // Re-tag in case of dynamic updates
    }

    // Click handler
    zenBtn.addEventListener('click', toggleZen);

    // Alt + Z or \ hotkey
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
