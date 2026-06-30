(function () {
  // ==========================================
  // 1. Problem Page: Alt + S to Jump to Submit
  // ==========================================

  function setupProblemPage() {
    // Alt + S: Navigate to the submit page
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        const submitLink = document.querySelector('a[href$="/submit"]')
          || Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === 'Submit');
        if (submitLink) {
          submitLink.click();
        } else {
          console.log('CocaPepsi CP: No submit link found on QOJ problem page.');
        }
      }
    });

    // Aggressively hunt for the editor and focus it as soon as it appears
    let elapsed = 0;
    const focusInterval = setInterval(() => {
      elapsed += 100;
      const editor = document.querySelector('.ace_text-input, .monaco-mouse-target, .CodeMirror textarea, textarea[name="answer"]');
      if (editor) {
        editor.focus();
        clearInterval(focusInterval);
      }
      if (elapsed >= 2000) {
        clearInterval(focusInterval);
      }
    }, 100);
  }

  // ==========================================
  // 2. Submit Page: Auto-Focus Editor
  // ==========================================

  function setupSubmitPage() {
    // Auto-focus the code editor after page load
    setTimeout(() => {
      const editor = document.querySelector('.ace_text-input, .monaco-mouse-target, .CodeMirror textarea, textarea[name="answer"]');
      if (editor) {
        editor.focus();
      } else {
        const cm = document.querySelector('.CodeMirror');
        if (cm && cm.CodeMirror) {
          cm.CodeMirror.focus();
        }
      }
    }, 300);
  }

  // ==========================================
  // 3. The Receiver: Chrome Commands API Bridge
  // ==========================================

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'NUKES_AWAY') {
      console.log('CocaPepsi CP: NUKES_AWAY received! Executing Silent Form Payload...');

      // Step 1: Locate the submission form via the submit button
      const btn = document.querySelector('#button-submit-answer');
      if (!btn) {
        console.log('CocaPepsi CP: ERROR - #button-submit-answer not found.');
        return;
      }

      const form = btn.closest('form');
      if (!form) {
        console.log('CocaPepsi CP: ERROR - No parent <form> found. Falling back to click.');
        btn.click();
        return;
      }

      // Step 2: Sync the Advanced Editor's code into the hidden textarea
      // UOJ typically uses a hidden textarea[name="answer"] that Ace/CodeMirror syncs to
      const hiddenTextarea = form.querySelector('textarea[name="answer"]');

      if (hiddenTextarea) {
        // Try syncing from Ace Editor
        const aceEl = form.querySelector('.ace_editor');
        if (aceEl && aceEl.env && aceEl.env.editor) {
          hiddenTextarea.value = aceEl.env.editor.getValue();
          console.log('CocaPepsi CP: Synced code from Ace Editor.');
        } else {
          // Try syncing from CodeMirror
          const cmEl = form.querySelector('.CodeMirror');
          if (cmEl && cmEl.CodeMirror) {
            hiddenTextarea.value = cmEl.CodeMirror.getValue();
            console.log('CocaPepsi CP: Synced code from CodeMirror.');
          } else {
            console.log('CocaPepsi CP: No editor API found. Using textarea value as-is.');
          }
        }
      }

      // Step 3: Construct FormData from the form
      const formData = new FormData(form);

      // Ensure the submit button's name/value is included in the payload
      if (btn.name) {
        formData.set(btn.name, btn.value || '');
      }

      // Step 4: POST directly to the backend
      const actionUrl = form.action || window.location.href;
      console.log('CocaPepsi CP: POSTing to', actionUrl);

      fetch(actionUrl, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin' // include session cookies
      })
        .then(response => {
          if (response.ok || response.redirected) {
            console.log('CocaPepsi CP: Submission sent successfully! Redirecting...');
            // Redirect to submissions page so user can see their result
            window.location.href = window.location.href.replace(/\/submit$/, '/submissions');
          } else {
            console.log('CocaPepsi CP: Server responded with status', response.status);
            alert('CocaPepsi CP: Submission failed (HTTP ' + response.status + '). Please submit manually.');
          }
        })
        .catch(err => {
          console.log('CocaPepsi CP: Fetch error:', err);
          alert('CocaPepsi CP: Network error during submission. Please submit manually.');
        });
    }
  });

  // ==========================================
  // Initialization
  // ==========================================

  function init() {
    const isSubmitPage = window.location.href.endsWith('/submit');

    if (!isSubmitPage) {
      setupProblemPage();
    } else {
      setupSubmitPage();
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
