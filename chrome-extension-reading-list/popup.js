// Popup script for Reading List extension

let readingList = [];
let currentFilter = 'all';

// Load reading list on popup open
document.addEventListener('DOMContentLoaded', async () => {
  await loadReadingList();
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

// Setup event listeners
function setupEventListeners() {
  document.getElementById('generateNewsletter').addEventListener('click', generateNewsletter);
  document.getElementById('clearAll').addEventListener('click', clearAll);

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

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
