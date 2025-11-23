// Content script for Reading List extension

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelection') {
    const selection = window.getSelection().toString();
    sendResponse({ selection: selection });
  }
  return true;
});

// Show visual feedback when text is saved
function showSaveAnimation() {
  const notification = document.createElement('div');
  notification.className = 'reading-list-notification';
  notification.textContent = '✓ Saved to Reading List';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 2000);
}

// Optional: Listen for keyboard shortcut directly in page
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    const selection = window.getSelection().toString();
    if (selection) {
      chrome.runtime.sendMessage({
        action: 'saveSelection',
        text: selection,
        url: window.location.href,
        title: document.title
      });
      showSaveAnimation();
    }
  }
});

console.log('Reading List content script loaded');
