(function () {
  'use strict';


  function initKeyboardShortcuts() {
    document.addEventListener('keydown', function (keyboardEvent) {
      const isAltS = keyboardEvent.altKey && keyboardEvent.key.toLowerCase() === 's';
      const isCtrlEnter = (keyboardEvent.ctrlKey || keyboardEvent.metaKey) && keyboardEvent.key === 'Enter';

      if (isAltS) {
        const nativeSubmitButton = document.querySelector('#btn-submit, a[href="#submit"]') || 
          Array.from(document.querySelectorAll('button, a, .btn')).find(function (elementNode) {
            const elementText = elementNode.textContent || elementNode.innerText || '';
            return elementText.toLowerCase().includes('submit');
          });
          
        if (nativeSubmitButton) {
          keyboardEvent.preventDefault();
          nativeSubmitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          nativeSubmitButton.click();
        }
      }

      if (isCtrlEnter) {
        const payloadSubmitButton = document.querySelector('#form-submit button[type="submit"], #btn-submit-solution') ||
          document.querySelector('form button[type="submit"]');
          
        if (payloadSubmitButton) {
          keyboardEvent.preventDefault();
          keyboardEvent.stopPropagation();
          payloadSubmitButton.click();
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initKeyboardShortcuts();
    });
  } else {
    initKeyboardShortcuts();
  }
})();
