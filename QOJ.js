(function () {
  // ==========================================
  // 1. Problem Page: Alt + S to Jump to Submit
  // ==========================================

  function setupProblemPageShortcut() {
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        // Find the submit tab link robustly
        const submitLink = document.querySelector('a[href$="/submit"]')
          || Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === 'Submit');
        if (submitLink) {
          submitLink.click();
        } else {
          console.log('CocaPepsi CF: No submit link found on QOJ problem page.');
        }
      }
    });
  }

  // ==========================================
  // 2. Submit Page: Ctrl + Enter via Main World
  // ==========================================

  function setupSubmitPageShortcut() {
    // Inject a <script> directly into the page context to bypass the Isolated World sandbox.
    // This ensures the keydown listener runs in the same world as the Ace/CodeMirror editor.
    const script = document.createElement('script');
    script.textContent = `
      window.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          var btn = document.querySelector('button[type="submit"], #submit, .ui.primary.button, button.ui.button.primary');
          if (btn) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('CocaPepsi CF: MAIN WORLD Injector fired! Submitting...');
            btn.click();
          }
        }
      }, { capture: true });
    `;
    (document.documentElement || document.head).appendChild(script);
    script.remove(); // Clean up the DOM

    // Auto-focus the code editor for instant pasting
    const editor = document.querySelector('.CodeMirror textarea, textarea.code-editor, textarea[name="answer"]');
    if (editor) {
      editor.focus();
    } else {
      const cm = document.querySelector('.CodeMirror');
      if (cm && cm.CodeMirror) {
        cm.CodeMirror.focus();
      }
    }
  }

  // ==========================================
  // Initialization
  // ==========================================

  function init() {
    const isSubmitPage = window.location.href.endsWith('/submit');

    if (!isSubmitPage) {
      setupProblemPageShortcut();
    } else {
      setupSubmitPageShortcut();
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
