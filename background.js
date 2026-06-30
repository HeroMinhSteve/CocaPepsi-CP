// ==========================================
// Background Service Worker
// Listens for the native "force-submit" command
// and relays it to the active tab's content script.
// ==========================================

chrome.commands.onCommand.addListener((command) => {
  if (command === 'force-submit') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'NUKES_AWAY' });
      }
    });
  }
});
