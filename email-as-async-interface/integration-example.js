/**
 * Integration Example: Email Interface + Reading List
 *
 * This demonstrates how to integrate the email interface with
 * the existing Chrome Extension Reading List functionality.
 */

const EmailAsyncInterface = require('./email-receiver');
const nodemailer = require('nodemailer');

// Initialize email interface
const emailInterface = new EmailAsyncInterface();

// Mock database/storage (in real app, use actual database)
const readingList = [];

/**
 * Command: Add URL to reading list
 * Usage: Send email with subject "[read] URL" or body with URL
 */
emailInterface.registerCommand('read', async (data) => {
  // Extract URL from payload or body
  const urlMatch = (data.payload + ' ' + data.body).match(/https?:\/\/[^\s]+/);

  if (!urlMatch) {
    return {
      success: false,
      error: 'No URL found in email. Please include a URL.'
    };
  }

  const url = urlMatch[0];

  // Add to reading list
  const article = {
    id: Date.now().toString(36),
    url: url,
    title: data.payload || 'Article from email',
    addedAt: new Date().toISOString(),
    addedVia: 'email',
    sender: data.from
  };

  readingList.push(article);

  console.log(`   📖 Added to reading list: ${url}`);

  return {
    success: true,
    message: `Article added to your reading list!`,
    data: {
      url: url,
      title: article.title,
      readingListSize: readingList.length
    }
  };
});

/**
 * Command: Send reading list as newsletter
 * Usage: Send email with subject "[newsletter]"
 */
emailInterface.registerCommand('newsletter', async (data) => {
  if (readingList.length === 0) {
    return {
      success: false,
      error: 'Your reading list is empty!'
    };
  }

  console.log(`   📧 Generating newsletter with ${readingList.length} articles...`);

  // Generate newsletter HTML
  const newsletterHTML = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          h1 { color: #333; }
          .article {
            margin: 20px 0;
            padding: 15px;
            border-left: 3px solid #4CAF50;
            background: #f9f9f9;
          }
          .article h2 { margin: 0 0 10px 0; font-size: 18px; }
          .article a { color: #1a73e8; text-decoration: none; }
          .article .meta { color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>📚 Your Reading List Newsletter</h1>
        <p>Here are your saved articles (${readingList.length} total):</p>
        ${readingList.map((article, i) => `
          <div class="article">
            <h2>${i + 1}. ${article.title}</h2>
            <p><a href="${article.url}">${article.url}</a></p>
            <div class="meta">Added ${new Date(article.addedAt).toLocaleDateString()}</div>
          </div>
        `).join('')}
        <hr>
        <p style="color: #666; font-size: 12px;">
          Generated at ${new Date().toLocaleString()}
        </p>
      </body>
    </html>
  `;

  // In production, this would use the actual newsletter sending endpoint
  // from chrome-extension-reading-list/backend/server.js

  return {
    success: true,
    message: `Newsletter with ${readingList.length} articles sent!`,
    data: {
      articlesIncluded: readingList.length,
      generatedAt: new Date().toISOString()
    }
  };
});

/**
 * Command: Clear reading list
 * Usage: Send email with subject "[clear]"
 */
emailInterface.registerCommand('clear', async (data) => {
  const count = readingList.length;

  // Clear the list
  readingList.length = 0;

  console.log(`   🗑️  Reading list cleared (${count} articles removed)`);

  return {
    success: true,
    message: `Reading list cleared! ${count} articles removed.`,
    data: {
      articlesRemoved: count
    }
  };
});

/**
 * Command: Show reading list stats
 * Usage: Send email with subject "[stats]"
 */
emailInterface.registerCommand('stats', async (data) => {
  const stats = {
    totalArticles: readingList.length,
    oldestArticle: readingList[0],
    newestArticle: readingList[readingList.length - 1],
    articles: readingList.map(a => ({
      title: a.title,
      url: a.url,
      added: a.addedAt
    }))
  };

  return {
    success: true,
    message: `Reading List Statistics`,
    data: stats
  };
});

// Start the email interface
console.log('\n📚 Reading List Email Interface\n');
console.log('Available commands:');
console.log('  [read] <url>     - Add URL to reading list');
console.log('  [newsletter]     - Send reading list as newsletter');
console.log('  [stats]          - Show reading list statistics');
console.log('  [clear]          - Clear reading list');
console.log('');

emailInterface.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n📊 Session stats: ${readingList.length} articles in reading list`);
  emailInterface.stop();
  process.exit(0);
});

// Example usage:
/*

Send these emails to test:

1. Add article:
   Subject: [read] Interesting article about Node.js
   Body: https://nodejs.org/en/blog/

2. Add another:
   Subject: COMMAND: read
   Body: Check out this cool project: https://github.com/anthropics/claude-code

3. Get stats:
   Subject: [stats]

4. Generate newsletter:
   Subject: [newsletter]

5. Clear list:
   Subject: [clear]

*/
