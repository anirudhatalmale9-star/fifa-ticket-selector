/**
 * FIFA TICKET SELECTOR - Background Service Worker
 * Handles keyboard shortcut commands
 */

// Listen for keyboard shortcut command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'select-all-matches') {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && tab.url.includes('tickets.fifa.com')) {
      // Send message to content script
      chrome.tabs.sendMessage(tab.id, { action: 'selectMatches' });
    } else {
      console.log('[FIFA Selector] Not on a FIFA tickets page');
    }
  }
});

// Log when extension is installed/updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('[FIFA Selector] Extension installed/updated');
});
