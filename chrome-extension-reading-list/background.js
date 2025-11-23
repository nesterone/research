// Background service worker for Reading List extension

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveToReadingList',
    title: 'Save to Reading List',
    contexts: ['selection']
  });

  console.log('Reading List extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'saveToReadingList') {
    saveSelection(info.selectionText, tab.url, tab.title);
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'save-selection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelection' }, (response) => {
        if (response && response.selection) {
          saveSelection(response.selection, tabs[0].url, tabs[0].title);
        }
      });
    });
  }
});

// Save selection to storage
async function saveSelection(text, url, title) {
  if (!text || text.trim() === '') {
    return;
  }

  const item = {
    id: Date.now().toString(),
    text: text.trim(),
    url: url,
    pageTitle: title,
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString()
  };

  try {
    const result = await chrome.storage.sync.get(['readingList']);
    const readingList = result.readingList || [];
    readingList.unshift(item); // Add to beginning

    await chrome.storage.sync.set({ readingList: readingList });

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Saved to Reading List',
      message: `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`
    });

    console.log('Saved item:', item);
  } catch (error) {
    console.error('Error saving to reading list:', error);
  }
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveSelection') {
    saveSelection(request.text, request.url, request.title);
    sendResponse({ success: true });
  }
  return true;
});
