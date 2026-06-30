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

  function $all(selector, root = document) {
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch (e) {
      return [];
    }
  }

  // ==========================================
  // 2. Task Page: Alt + S to Jump to Submit
  // ==========================================

  function setupTaskPage() {
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();

        const taskMatch = window.location.pathname.match(/\/contests\/([^/]+)\/tasks\/([^/?]+)/);
        if (taskMatch) {
          const contestId = taskMatch[1];
          const taskScreenName = taskMatch[2];
          window.open(`/contests/${contestId}/submit?taskScreenName=${taskScreenName}`, '_blank');
        } else {
          const submitLink = $('a[href*="/submit"]')
            || Array.from(document.querySelectorAll('a')).find(a =>
              a.textContent.trim() === 'Submit' || a.textContent.trim() === '提出'
            );
          if (submitLink) {
            window.open(submitLink.href, '_blank');
          } else {
            console.log('CocaPepsi CP: No submit link found on AtCoder task page.');
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

      // AtCoder uses Ace Editor — look for its internal text input
      const aceInput = $('.ace_text-input');
      if (aceInput) {
        aceInput.focus();
        clearInterval(focusInterval);
        return;
      }

      // Fallback: plain textarea (#sourceCode or textarea[name="sourceCode"])
      const plainTextarea = $('#sourceCode, textarea[name="sourceCode"]');
      if (plainTextarea) {
        plainTextarea.focus();
        clearInterval(focusInterval);
        return;
      }

      if (elapsed >= 3000) {
        clearInterval(focusInterval);
      }
    }, 100);

    // --- Ctrl + Enter: Submit via capture-phase keydown ---
    // AtCoder's Ace editor does NOT aggressively block keydown like QOJ,
    // so a simple capture-phase listener on document works here.
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();

        const submitBtn = $('#submit');
        if (submitBtn) {
          console.log('CocaPepsi CP: Ctrl+Enter submit on AtCoder!');

          // Use native form submission if possible
          if (submitBtn.form) {
            submitBtn.form.requestSubmit(submitBtn);
          } else {
            submitBtn.click();
          }
        } else {
          console.log('CocaPepsi CP: Submit button #submit not found on AtCoder.');
        }
      }
    }, true);
  }

  // ==========================================
  // 4. The Receiver: Chrome Commands API Bridge
  // ==========================================

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'NUKES_AWAY') {
      console.log('CocaPepsi CP: NUKES_AWAY received on AtCoder! Forcing submit...');
      const btn = $('#submit');
      if (btn) {
        if (btn.form) {
          console.log('CocaPepsi CP: Native form submit via requestSubmit().');
          btn.form.requestSubmit(btn);
        } else {
          console.log('CocaPepsi CP: Fallback to btn.click().');
          btn.click();
        }
      } else {
        console.log('CocaPepsi CP: ERROR - #submit button not found on AtCoder.');
      }
    }
  });

  // ==========================================
  // Initialization
  // ==========================================

  function init() {
    const path = window.location.pathname;

    // Submit page: /contests/{id}/submit
    const isSubmitPage = /\/contests\/[^/]+\/submit/.test(path);

    // Task page: /contests/{id}/tasks/{task_id}
    const isTaskPage = /\/contests\/[^/]+\/tasks\//.test(path);

    if (isSubmitPage) {
      setupSubmitPage();
    } else if (isTaskPage) {
      setupTaskPage();
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
