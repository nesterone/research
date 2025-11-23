// Popup script for Reading List extension

let readingList = [];
let currentFilter = 'all';
let settings = {
  emailAddress: '',
  backendUrl: 'http://localhost:3000'
};

// Load reading list on popup open
document.addEventListener('DOMContentLoaded', async () => {
  await loadReadingList();
  await loadSettings();
  setupEventListeners();
});

// Load items from storage
async function loadReadingList() {
  try {
    const result = await chrome.storage.sync.get(['readingList']);
    readingList = result.readingList || [];
    updateUI();
  } catch (error) {
    console.error('Error loading reading list:', error);
  }
}

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(['emailSettings']);
    if (result.emailSettings) {
      settings = { ...settings, ...result.emailSettings };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Save settings to storage
async function saveSettings() {
  try {
    await chrome.storage.sync.set({ emailSettings: settings });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Existing buttons
  document.getElementById('generateNewsletter').addEventListener('click', generateNewsletter);
  document.getElementById('emailNewsletter').addEventListener('click', emailNewsletter);
  document.getElementById('clearAll').addEventListener('click', clearAll);

  // Settings modal
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('closeSettings').addEventListener('click', closeSettings);
  document.getElementById('saveSettings').addEventListener('click', saveSettingsFromUI);
  document.getElementById('testEmail').addEventListener('click', sendTestEmail);

  // Close modal on background click
  document.getElementById('settingsModal').addEventListener('click', (e) => {
    if (e.target.id === 'settingsModal') {
      closeSettings();
    }
  });

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      updateUI();
    });
  });
}

// Update UI with current items
function updateUI() {
  const filteredItems = filterItems(readingList, currentFilter);

  document.getElementById('itemCount').textContent = `${readingList.length} item${readingList.length !== 1 ? 's' : ''}`;

  const listContainer = document.getElementById('readingList');
  const emptyState = document.getElementById('emptyState');

  if (filteredItems.length === 0) {
    listContainer.classList.add('hidden');
    emptyState.classList.remove('hidden');
  } else {
    emptyState.classList.add('hidden');
    listContainer.classList.remove('hidden');
    listContainer.innerHTML = '';

    filteredItems.forEach(item => {
      const itemElement = createItemElement(item);
      listContainer.appendChild(itemElement);
    });
  }
}

// Filter items based on time period
function filterItems(items, filter) {
  if (filter === 'all') return items;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return items.filter(item => {
    const itemDate = new Date(item.timestamp);

    if (filter === 'today') {
      return itemDate >= today;
    } else if (filter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return itemDate >= weekAgo;
    }

    return true;
  });
}

// Create HTML element for a reading list item
function createItemElement(item) {
  const div = document.createElement('div');
  div.className = 'reading-item';
  div.dataset.id = item.id;

  const formattedDate = new Date(item.timestamp).toLocaleString();

  div.innerHTML = `
    <div class="item-header">
      <div class="item-meta">
        <div class="item-title">${escapeHtml(item.pageTitle)}</div>
        <a href="${escapeHtml(item.url)}" class="item-url" target="_blank" title="${escapeHtml(item.url)}">
          ${escapeHtml(item.url)}
        </a>
        <div class="item-date">${formattedDate}</div>
      </div>
      <div class="item-actions">
        <button class="icon-btn delete-btn" title="Delete">🗑️</button>
      </div>
    </div>
    <div class="item-text">"${escapeHtml(item.text)}"</div>
  `;

  div.querySelector('.delete-btn').addEventListener('click', () => deleteItem(item.id));

  return div;
}

// Delete an item
async function deleteItem(id) {
  readingList = readingList.filter(item => item.id !== id);
  await chrome.storage.sync.set({ readingList: readingList });
  updateUI();
}

// Clear all items
async function clearAll() {
  if (confirm('Are you sure you want to clear all items from your reading list?')) {
    readingList = [];
    await chrome.storage.sync.set({ readingList: [] });
    updateUI();
  }
}

// Generate newsletter
async function generateNewsletter() {
  if (readingList.length === 0) {
    alert('Your reading list is empty. Add some items first!');
    return;
  }

  const newsletter = createNewsletterHTML(readingList);

  // Create a new tab with the newsletter
  const blob = new Blob([newsletter], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  chrome.tabs.create({ url: url });
}

// Create newsletter HTML
function createNewsletterHTML(items) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Group items by date
  const itemsByDate = {};
  items.forEach(item => {
    if (!itemsByDate[item.date]) {
      itemsByDate[item.date] = [];
    }
    itemsByDate[item.date].push(item);
  });

  let itemsHTML = '';
  Object.keys(itemsByDate).sort().reverse().forEach(date => {
    itemsHTML += `<h2>📅 ${date}</h2>`;
    itemsByDate[date].forEach((item, index) => {
      itemsHTML += `
        <div class="item">
          <h3>${index + 1}. ${escapeHtml(item.pageTitle)}</h3>
          <p class="url"><a href="${escapeHtml(item.url)}" target="_blank">${escapeHtml(item.url)}</a></p>
          <blockquote>"${escapeHtml(item.text)}"</blockquote>
          <p class="time">Saved at ${new Date(item.timestamp).toLocaleTimeString()}</p>
        </div>
      `;
    });
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reading List Newsletter - ${dateStr}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #667eea;
    }
    h1 {
      font-size: 32px;
      color: #667eea;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      font-size: 18px;
    }
    .stats {
      background: #f0f4ff;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      text-align: center;
      color: #667eea;
      font-weight: 600;
    }
    h2 {
      color: #444;
      margin-top: 30px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e0e0e0;
    }
    .item {
      margin-bottom: 30px;
      padding: 20px;
      background: #fafafa;
      border-left: 4px solid #667eea;
      border-radius: 4px;
    }
    .item h3 {
      color: #333;
      margin-bottom: 10px;
      font-size: 18px;
    }
    .url {
      margin: 8px 0;
      font-size: 14px;
    }
    .url a {
      color: #667eea;
      text-decoration: none;
      word-break: break-all;
    }
    .url a:hover {
      text-decoration: underline;
    }
    blockquote {
      margin: 15px 0;
      padding: 15px 20px;
      background: white;
      border-left: 3px solid #764ba2;
      font-style: italic;
      color: #555;
      line-height: 1.8;
    }
    .time {
      font-size: 12px;
      color: #999;
      margin-top: 10px;
    }
    footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #999;
      font-size: 14px;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📚 Your Personal Reading List Newsletter</h1>
      <p class="subtitle">${dateStr}</p>
    </header>

    <div class="stats">
      📊 Total Items: ${items.length}
    </div>

    ${itemsHTML}

    <footer>
      <p>Generated by Reading List Extension</p>
      <p>Keep learning and saving! 🚀</p>
    </footer>
  </div>
</body>
</html>
  `;
}

// Settings modal functions
function openSettings() {
  // Populate modal with current settings
  document.getElementById('emailAddress').value = settings.emailAddress;
  document.getElementById('backendUrl').value = settings.backendUrl;
  document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettings() {
  document.getElementById('settingsModal').classList.add('hidden');
  document.getElementById('testStatus').textContent = '';
}

async function saveSettingsFromUI() {
  settings.emailAddress = document.getElementById('emailAddress').value.trim();
  settings.backendUrl = document.getElementById('backendUrl').value.trim();

  await saveSettings();

  const statusEl = document.getElementById('testStatus');
  statusEl.textContent = '✓ Settings saved!';
  statusEl.className = 'test-status success';

  setTimeout(() => {
    statusEl.textContent = '';
  }, 3000);
}

// Send test email
async function sendTestEmail() {
  const emailAddress = document.getElementById('emailAddress').value.trim();
  const backendUrl = document.getElementById('backendUrl').value.trim();
  const statusEl = document.getElementById('testStatus');

  if (!emailAddress) {
    statusEl.textContent = '⚠ Please enter an email address first';
    statusEl.className = 'test-status error';
    return;
  }

  if (!backendUrl) {
    statusEl.textContent = '⚠ Please enter a backend URL first';
    statusEl.className = 'test-status error';
    return;
  }

  try {
    statusEl.textContent = '⏳ Sending test email...';
    statusEl.className = 'test-status loading';

    const response = await fetch(`${backendUrl}/send-test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to: emailAddress })
    });

    const data = await response.json();

    if (response.ok) {
      statusEl.textContent = '✓ Test email sent! Check your inbox.';
      statusEl.className = 'test-status success';

      // If using Ethereal, show preview URL
      if (data.previewURL) {
        setTimeout(() => {
          if (confirm('Test email sent to Ethereal test account. Would you like to preview it?')) {
            window.open(data.previewURL, '_blank');
          }
        }, 1000);
      }
    } else {
      statusEl.textContent = `✗ Error: ${data.error || 'Failed to send'}`;
      statusEl.className = 'test-status error';
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    statusEl.textContent = `✗ Error: ${error.message}. Is the backend running?`;
    statusEl.className = 'test-status error';
  }
}

// Email newsletter
async function emailNewsletter() {
  if (readingList.length === 0) {
    alert('Your reading list is empty. Add some items first!');
    return;
  }

  if (!settings.emailAddress) {
    alert('Please configure your email address in Settings first!');
    openSettings();
    return;
  }

  if (!settings.backendUrl) {
    alert('Please configure your backend server URL in Settings first!');
    openSettings();
    return;
  }

  try {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `Your Reading List Newsletter - ${dateStr}`;
    const html = createNewsletterHTML(readingList);

    // Show loading state (disable button)
    const btn = document.getElementById('emailNewsletter');
    const originalText = btn.textContent;
    btn.textContent = '📧 Sending...';
    btn.disabled = true;

    const response = await fetch(`${settings.backendUrl}/send-newsletter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: settings.emailAddress,
        subject: subject,
        html: html
      })
    });

    const data = await response.json();

    btn.textContent = originalText;
    btn.disabled = false;

    if (response.ok) {
      alert(`✓ Newsletter sent successfully to ${settings.emailAddress}!`);

      // If using Ethereal, offer to preview
      if (data.previewURL) {
        if (confirm('Preview the email in your browser?')) {
          window.open(data.previewURL, '_blank');
        }
      }
    } else {
      alert(`✗ Failed to send newsletter: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error emailing newsletter:', error);
    alert(`✗ Error: ${error.message}\n\nMake sure your backend server is running at ${settings.backendUrl}`);

    const btn = document.getElementById('emailNewsletter');
    btn.textContent = '📧 Email Newsletter';
    btn.disabled = false;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
