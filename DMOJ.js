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
  // Initialization
  // ==========================================

  function init() {
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
