(function () {
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

  // ==========================================
  // 2. Problem Page: Alt + S to Jump to Submit
  // ==========================================

  function setupProblemPage() {
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();

        const problemMatch = window.location.pathname.match(/\/problem\/view\/([^/?]+)/);
        if (problemMatch) {
          const problemId = problemMatch[1];
          window.open(`/problem/submit/${problemId}`, '_blank');
        } else {
          const submitLink = $('a[href*="/submit/"]')
            || Array.from(document.querySelectorAll('a')).find(a =>
              a.textContent.trim() === 'Submit' || a.textContent.trim() === '提出'
            );
          if (submitLink) {
            window.open(submitLink.href, '_blank');
          } else {
            console.log('CocaPepsi CP: No submit link found on oj.uz problem page.');
          }
        }
      }
    });
  }

  // ==========================================
  // 3. Submit Page: Auto-Focus & Ctrl + Enter
  // ==========================================

  function setupSubmitPage() {
    // Scroll to the bottom of the page so Cloudflare lazy content loads
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    }, 360);

    // --- Auto-focus the Ace editor ---
    let elapsed = 0;
    const focusInterval = setInterval(() => {
      elapsed += 100;

      // oj.uz uses Ace Editor — look for its internal text input
      const aceInput = $('.ace_text-input');
      if (aceInput) {
        aceInput.focus();
        clearInterval(focusInterval);
        return;
      }

      // Fallback: plain textarea
      const plainTextarea = $('textarea');
      if (plainTextarea && plainTextarea.offsetParent !== null) { // visible
        plainTextarea.focus();
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

        const submitBtn = $('button[type="submit"], input[type="submit"]');
        if (submitBtn) {
          console.log('CocaPepsi CP: Ctrl+Enter submit on oj.uz!');

          // Use native form submission if possible
          if (submitBtn.form) {
            submitBtn.form.requestSubmit(submitBtn);
          } else {
            submitBtn.click();
          }
        } else {
          console.log('CocaPepsi CP: Submit button not found on oj.uz.');
        }
      }
    }, true);
  }

  // ==========================================
  // 4. The Receiver: Chrome Commands API Bridge
  // ==========================================

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'NUKES_AWAY') {
      console.log('CocaPepsi CP: NUKES_AWAY received on oj.uz! Forcing submit...');
      const btn = $('button[type="submit"], input[type="submit"]');
      if (btn) {
        if (btn.form) {
          console.log('CocaPepsi CP: Native form submit via requestSubmit().');
          btn.form.requestSubmit(btn);
        } else {
          console.log('CocaPepsi CP: Fallback to btn.click().');
          btn.click();
        }
      } else {
        console.log('CocaPepsi CP: ERROR - submit button not found on oj.uz.');
      }
    }
  });

  // ==========================================
  // Initialization
  // ==========================================

  function init() {
    const path = window.location.pathname;

    // Submit page: /problem/submit/{id}
    const isSubmitPage = /\/problem\/submit\/[^/]+/.test(path);

    // Problem page: /problem/view/{id}
    const isProblemPage = /\/problem\/view\/[^/]+/.test(path);

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
