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
  // 4. Zen Mode (Distraction-Free Reading)
  // ==========================================

  function setupZenMode() {
    // --- Inject CSS rules ---
    const style = document.createElement('style');
    style.textContent = `
      /* Hide distractions */
      body.coca-pepsi-zen #nav-container,
      body.coca-pepsi-zen .navbar,
      body.coca-pepsi-zen #header,
      body.coca-pepsi-zen .sidebar,
      body.coca-pepsi-zen .problem-sidebar,
      body.coca-pepsi-zen .col-md-3,
      body.coca-pepsi-zen .col-lg-3,
      body.coca-pepsi-zen .comments-container,
      body.coca-pepsi-zen .comments,
      body.coca-pepsi-zen #footer,
      body.coca-pepsi-zen .footer,
      body.coca-pepsi-zen .user-info,
      body.coca-pepsi-zen .blog-sidebar,
      body.coca-pepsi-zen .right-sidebar,
      body.coca-pepsi-zen #navigation {
        display: none !important;
      }
      /* Expand and center the main content */
      body.coca-pepsi-zen .col-md-9,
      body.coca-pepsi-zen .col-lg-9,
      body.coca-pepsi-zen .content-with-sidebar,
      body.coca-pepsi-zen #page-content,
      body.coca-pepsi-zen .wrapper,
      body.coca-pepsi-zen #content {
        width: 100% !important;
        max-width: 900px !important;
        margin: 0 auto !important;
        float: none !important;
        border: none !important;
        box-shadow: none !important;
      }
      /* In-page toggle button styling */
      #coca-pepsi-zen-btn {
        padding: 6px 12px;
        margin-left: 10px;
        font-weight: bold;
        border-radius: 4px;
        cursor: pointer;
        transition: 0.2s;
        border: none;
        color: #fff;
        outline: none;
      }
      #coca-pepsi-zen-btn.zen-on {
        background-color: #27ae60;
      }
      #coca-pepsi-zen-btn.zen-off {
        background-color: #555;
      }
      #coca-pepsi-zen-btn:hover {
        opacity: 0.9;
      }
    `;
    document.head.appendChild(style);

    // --- State management (default OFF) ---
    const isOn = localStorage.getItem('coca_pepsi_dmoj_zen') === 'true';
    if (isOn) {
      document.body.classList.add('coca-pepsi-zen');
    }

    // --- Create in-page toggle button ---
    const btn = document.createElement('button');
    btn.id = 'coca-pepsi-zen-btn';
    btn.textContent = '🧘 Zen Mode';

    function updateBtn() {
      const active = document.body.classList.contains('coca-pepsi-zen');
      btn.className = active ? 'zen-on' : 'zen-off';
      btn.id = 'coca-pepsi-zen-btn';
    }
    updateBtn();

    // --- Shared toggle logic ---
    function toggleZen() {
      document.body.classList.toggle('coca-pepsi-zen');
      const nowOn = document.body.classList.contains('coca-pepsi-zen');
      localStorage.setItem('coca_pepsi_dmoj_zen', String(nowOn));
      updateBtn();
    }

    // Click handler
    btn.addEventListener('click', toggleZen);

    // --- Inject button into the DOM ---
    const injectionTargets = [
      '.nav-tabs',
      '.nav-pills',
      '.problem-info',
      '.page-header h2',
      '.info-float'
    ];

    let injected = false;
    for (const selector of injectionTargets) {
      const target = document.querySelector(selector);
      if (target) {
        if (target.tagName.toLowerCase() === 'ul' || target.classList.contains('nav-tabs') || target.classList.contains('nav-pills')) {
          const li = document.createElement('li');
          li.style.display = 'inline-block';
          li.style.marginTop = '4px';
          li.appendChild(btn);
          target.appendChild(li);
        } else {
          target.appendChild(btn);
        }
        injected = true;
        break;
      }
    }

    if (!injected) {
      // Ultimate fallback: just append to the body or main content wrapper
      const fallbackTarget = document.querySelector('#page-content') || document.querySelector('.wrapper') || document.body;
      if (fallbackTarget) {
        // If we really can't find a place, float it, but this should be rare
        btn.style.position = 'fixed';
        btn.style.bottom = '16px';
        btn.style.left = '16px';
        btn.style.zIndex = '9999';
        fallbackTarget.appendChild(btn);
      }
    }

    // Alt + Z hotkey
    document.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (e.altKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        toggleZen();
      }
    });
  }

  // ==========================================
  // Initialization
  // ==========================================

  function init() {
    setupZenMode();

    const path = window.location.pathname;

    // Submit page: /problem/{code}/submit
    const isSubmitPage = /^\/problem\/[^/]+\/submit/.test(path);

    // Problem page: /problem/{code} (but NOT /submit, /submissions, etc.)
    const isProblemPage = /^\/problem\/[^/]+\/?$/.test(path);

    if (isSubmitPage) {
      setupSubmitPage();
    } else if (isProblemPage) {
      setupProblemPage();
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
