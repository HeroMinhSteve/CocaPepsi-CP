(function () {
  // ==========================================
  // UOJ-Based OJ Helper (QOJ, LOJ, etc.)
  // File-Spoofing Architecture + Anti-Logout
  // ==========================================

  function $(selector, root = document) {
    try { return root.querySelector(selector); } catch (e) { return null; }
  }

  // ==========================================
  // 1. Problem Page: Alt + S to Jump to Submit
  // ==========================================

  function setupProblemPage() {
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        const submitLink = $('a[href$="/submit"]')
          || Array.from(document.querySelectorAll('a')).find(a => a.textContent.trim() === 'Submit');
        if (submitLink) {
          submitLink.click();
        } else {
          console.log('CocaPepsi CP: No submit link found on UOJ problem page.');
        }
      }
    });
  }

  // ==========================================
  // 2. Submit Page: File-Spoofing Editor
  // ==========================================

  function setupSubmitPage() {
    // --- Find the file input (UOJ uses various naming conventions) ---
    const fileInput = $('input[type="file"][name="answer_answer_upload"]')
      || $('input[type="file"][name="file"]')
      || $('input[type="file"][id="file"]')
      || $('input[type="file"][name="answer"]')
      || $('input[type="file"]');

    if (!fileInput) {
      console.log('CocaPepsi CP: No file input found on UOJ submit page. Falling back to editor focus.');
      fallbackEditorFocus();
      return;
    }

    const form = fileInput.closest('form');
    if (!form) {
      console.log('CocaPepsi CP: File input has no parent form.');
      return;
    }

    // --- Switch to file-upload mode if UOJ has tabs ---
    // UOJ often has radio buttons or links to switch between "editor" and "file upload"
    const uploadTab = $('input[type="radio"][value="upload"]', form)
      || Array.from(form.querySelectorAll('a, label')).find(el =>
        el.textContent.trim().toLowerCase().includes('file upload') ||
        el.textContent.trim().toLowerCase().includes('upload')
      );
    if (uploadTab) {
      if (uploadTab.tagName === 'INPUT') {
        uploadTab.checked = true;
        uploadTab.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        uploadTab.click();
      }
    }

    // --- Hide native file input, inject our editor ---
    fileInput.style.display = 'none';

    const divider = document.createElement('div');
    divider.innerHTML = '<strong style="color: #00ffcc;">⚡ CocaPepsi Editor</strong> — Paste code below:';
    divider.style.cssText = 'margin: 10px 0 5px 0; font-family: sans-serif; color: #ccc; font-size: 14px;';
    fileInput.parentNode.insertBefore(divider, fileInput.nextSibling);

    const editor = document.createElement('textarea');
    editor.id = 'coca-pepsi-editor';
    editor.placeholder = "// Paste your code here...\n// Ctrl + Enter to spoof file & submit safely.\n// Language auto-detected from extension.";
    editor.style.cssText = `
      width: 100%; height: 400px; font-family: Consolas, monospace; font-size: 14px;
      padding: 12px; background: #1e1e1e; color: #d4d4d4; border: 1px solid #333;
      border-radius: 6px; margin-bottom: 15px; box-sizing: border-box; resize: vertical;
      tab-size: 4;
    `;

    divider.parentNode.insertBefore(editor, divider.nextSibling);

    // Auto-focus after a tiny delay
    setTimeout(() => editor.focus(), 100);

    // --- Tab key support in the editor ---
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
      }
    });

    // --- Language detection from native dropdown ---
    function getExtension() {
      const langSelect = $('select[name="answer_language"], select[name="language"], select[name="lang"]', form)
        || $('select[name="answer_language"], select[name="language"], select[name="lang"]');
      if (langSelect) {
        const langText = (langSelect.options[langSelect.selectedIndex]?.text || '').toLowerCase();
        if (langText.includes('python')) return '.py';
        if (langText.includes('java')) return '.java';
        if (langText.includes('pascal')) return '.pas';
        if (langText.includes('rust')) return '.rs';
      }
      return '.cpp'; // Default
    }

    // --- The File Spoofing Payload ---
    function applyPayload() {
      const code = editor.value;
      if (!code.trim()) return false;

      const ext = getExtension();
      const fakeFile = new File([code], "solution" + ext, { type: "text/plain" });
      const dt = new DataTransfer();
      dt.items.add(fakeFile);
      fileInput.files = dt.files;

      // Dispatch change event so UOJ's JS recognizes the file
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      console.log('CocaPepsi CP: Spoofed file payload -> solution' + ext + ' (' + code.length + ' bytes)');
      return true;
    }

    // --- Find the physical submit button ---
    const submitBtn = $('button[type="submit"]', form)
      || $('input[type="submit"]', form)
      || $('#button-submit-answer', form)
      || $('button[type="submit"]')
      || $('input[type="submit"]')
      || $('#button-submit-answer');

    // --- Intercept native submit button click to inject payload ---
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        const code = editor.value;
        if (code.trim()) {
          applyPayload();
        }
        // Let the click proceed naturally — preserves CSRF tokens
      });
    }

    // --- Ctrl + Enter: Safe Submit (editor-only) ---
    editor.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const code = editor.value;
        if (!code.trim()) {
          alert("CocaPepsi CP: Editor is empty! Cannot submit the void.");
          return;
        }

        applyPayload();

        if (submitBtn) {
          console.log('CocaPepsi CP: Ctrl+Enter -> safe .click() on submit button.');
          submitBtn.click();
        } else {
          console.log('CocaPepsi CP: No submit button found. Trying form.requestSubmit().');
          form.requestSubmit();
        }
      }
    });

    // --- Global Ctrl + Enter fallback (capture phase) ---
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        // Only fire if the editor has content
        const code = editor.value;
        if (!code.trim()) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        applyPayload();

        if (submitBtn) {
          submitBtn.click();
        }
      }
    }, true);
  }

  // --- Fallback: just focus the native editor if no file input found ---
  function fallbackEditorFocus() {
    setTimeout(() => {
      const ed = $('.ace_text-input, .monaco-mouse-target, .CodeMirror textarea, textarea[name="answer"]');
      if (ed) {
        ed.focus();
      } else {
        const cm = $('.CodeMirror');
        if (cm && cm.CodeMirror) cm.CodeMirror.focus();
      }
    }, 300);
  }

  // ==========================================
  // 3. The Receiver: Chrome Commands API Bridge
  // ==========================================

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'NUKES_AWAY') {
      console.log('CocaPepsi CP: NUKES_AWAY received on UOJ!');

      // Try file-spoofing path first
      const editor = $('#coca-pepsi-editor');
      if (editor && editor.value.trim()) {
        const fileInput = $('input[type="file"][name="answer_answer_upload"]')
          || $('input[type="file"][name="file"]')
          || $('input[type="file"]');
        if (fileInput) {
          const fakeFile = new File([editor.value], "solution.cpp", { type: "text/plain" });
          const dt = new DataTransfer();
          dt.items.add(fakeFile);
          fileInput.files = dt.files;
          fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      // Always use safe .click()
      const btn = $('#button-submit-answer')
        || $('button[type="submit"]')
        || $('input[type="submit"]');
      if (btn) {
        console.log('CocaPepsi CP: NUKES_AWAY -> safe .click().');
        btn.click();
      } else {
        console.log('CocaPepsi CP: ERROR - submit button not found on UOJ.');
      }
    }
  });

  // ==========================================
  // Initialization
  // ==========================================

  function init() {
    const isSubmitPage = window.location.href.includes('/submit');

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
