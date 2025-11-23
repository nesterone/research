# 📚 Reading List with Newsletter - Chrome Extension

A Chrome Extension that lets you save text selections from any webpage to a personal reading list and generate beautiful, personalized newsletters.

## ✨ Features

- **Quick Text Selection**: Select any text on any webpage and save it instantly
- **Multiple Save Methods**:
  - Keyboard shortcut: `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
  - Right-click context menu: "Save to Reading List"
- **Beautiful Popup Interface**: View and manage your saved items with a modern, gradient-styled UI
- **Smart Filtering**: Filter saved items by All / Today / This Week
- **Newsletter Generation**: Create a beautiful, personalized HTML newsletter with all your saved items
- **📧 Email Newsletters**: Send newsletters directly to your email inbox
- **Test Email Functionality**: Verify email setup before sending newsletters
- **Visual Feedback**: Animated notifications when items are saved
- **Cross-Device Sync**: Uses Chrome Storage Sync API (if signed into Chrome)
- **Organized by Date**: Newsletter groups items by date for easy reading

## 🚀 Installation

### Local Development Installation

1. **Clone or download this repository**

2. **Generate icons** (if not already present):
   ```bash
   cd icons
   bash create_simple_icons.sh
   ```

3. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `chrome-extension-reading-list` folder
   - The extension icon should appear in your Chrome toolbar

4. **Pin the extension** (optional but recommended):
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Reading List with Newsletter"
   - Click the pin icon to keep it visible

## 📧 Email Setup (Optional)

To enable email newsletter functionality, you need to set up the backend server:

### 1. Install Backend Dependencies

```bash
cd chrome-extension-reading-list/backend
npm install
```

### 2. Configure Email Settings

**For Testing (No Real Email Needed):**
- Just run the server - it will use Ethereal test account
- Preview emails at https://ethereal.email

**For Real Email Sending:**

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your email credentials
nano .env
```

For **Gmail**:
1. Enable 2-Step Verification in your Google Account
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Update `.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

For **other providers** (Outlook, Yahoo, etc.), see `backend/README.md`

### 3. Start the Backend Server

```bash
cd backend
npm start
```

The server will run on `http://localhost:3000`

### 4. Configure Extension Settings

1. Click the extension icon
2. Click the ⚙️ Settings button
3. Enter your email address
4. Verify backend URL (default: `http://localhost:3000`)
5. Click "🧪 Send Test Email" to verify setup
6. Click "Save Settings"

You're all set! You can now email newsletters to yourself.

## 📖 Usage

### Saving Text Selections

#### Method 1: Keyboard Shortcut
1. Navigate to any webpage
2. Select text you want to save
3. Press `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
4. A green notification will appear confirming the save

#### Method 2: Context Menu
1. Navigate to any webpage
2. Select text you want to save
3. Right-click on the selected text
4. Choose "Save to Reading List" from the menu

### Viewing Your Reading List

1. Click the extension icon in your Chrome toolbar
2. The popup will show all your saved items
3. Each item displays:
   - Page title
   - URL (clickable)
   - The saved text excerpt
   - Timestamp when it was saved

### Filtering Items

Use the filter buttons at the top of the popup:
- **All**: Shows all saved items
- **Today**: Shows items saved today
- **This Week**: Shows items saved in the last 7 days

### Managing Items

- **Delete an item**: Click the 🗑️ icon on any item
- **Clear all items**: Click the "🗑️ Clear All" button (confirmation required)
- **Visit source page**: Click the blue URL link on any item

### Generating a Newsletter

You have two options:

#### Option 1: Generate HTML Newsletter

1. Open the extension popup
2. Click the "📄 Generate HTML" button
3. A new tab will open with a beautifully formatted newsletter containing:
   - All your saved items grouped by date
   - Page titles and URLs
   - Your saved text excerpts
   - Timestamps
   - Professional typography and layout
4. You can:
   - Save the newsletter as HTML
   - Print it (print-friendly design)
   - Share it
   - Keep it for your records

#### Option 2: Email Newsletter (requires backend setup)

1. Open the extension popup
2. Click the "📧 Email Newsletter" button
3. The newsletter will be sent to your configured email address
4. You'll receive a confirmation when the email is sent
5. Check your inbox for the formatted newsletter

**Note**: Make sure you've completed the Email Setup section above and the backend server is running.

## 🏗️ Project Structure

```
chrome-extension-reading-list/
├── manifest.json          # Extension configuration and permissions
├── background.js          # Service worker for shortcuts and storage
├── content.js            # Content script for text selection
├── content.css           # Styles for notifications
├── popup.html            # Popup interface HTML
├── popup.css             # Popup interface styles
├── popup.js              # Popup interface logic
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── create_simple_icons.sh
│   ├── generate_icons.py
│   └── generate-icons.html
├── backend/              # Email backend server
│   ├── server.js         # Express server
│   ├── package.json      # Node dependencies
│   ├── .env.example      # Example environment variables
│   ├── .gitignore        # Git ignore rules
│   └── README.md         # Backend documentation
├── notes.md              # Development notes
└── README.md             # This file
```

## 🔧 Technical Details

### Architecture

- **Manifest Version**: V3 (latest Chrome Extension format)
- **Permissions**:
  - `storage`: Save and sync reading list
  - `contextMenus`: Right-click menu option
  - `activeTab`: Access current page information
  - `notifications`: Show save confirmations
- **Storage**: Chrome Storage Sync API (cross-device sync, ~100KB limit)

### Key Components

1. **Background Service Worker** (`background.js`):
   - Handles keyboard shortcuts
   - Manages context menu
   - Coordinates storage operations
   - Shows notifications

2. **Content Script** (`content.js`):
   - Runs on all webpages
   - Captures text selections
   - Shows visual feedback

3. **Popup Interface** (`popup.html/css/js`):
   - Displays reading list
   - Filters and manages items
   - Generates newsletters

### Data Structure

Each saved item contains:
```javascript
{
  id: "1234567890",           // Timestamp-based unique ID
  text: "Selected text...",    // The saved text excerpt
  url: "https://...",          // Page URL
  pageTitle: "Page Title",     // Page title
  timestamp: "2024-01-01T...", // ISO timestamp
  date: "1/1/2024"            // Formatted date
}
```

## 🎨 Customization

### Changing the Keyboard Shortcut

Edit `manifest.json`:
```json
"commands": {
  "save-selection": {
    "suggested_key": {
      "default": "Ctrl+Shift+S",  // Change this
      "mac": "Command+Shift+S"     // And this
    }
  }
}
```

### Modifying Newsletter Design

Edit the `createNewsletterHTML()` function in `popup.js` to customize:
- Colors and typography
- Layout and spacing
- Content organization
- Additional metadata

### Changing UI Colors

Edit `popup.css` and look for:
- `#667eea` (primary purple)
- `#764ba2` (secondary purple)
- Modify the gradient in the header section

## 📝 Limitations

- **Storage Limit**: Chrome Storage Sync has a ~100KB limit (approximately 500-1000 items depending on text length)
- **Local Storage**: No cloud backend for reading list data, stored in Chrome's sync storage
- **Email Backend**: Requires local server to be running for email functionality
- **Icons**: Basic placeholder icons (can be enhanced with custom graphics)

## 🚀 Future Enhancements

Potential features for future versions:
- ✅ ~~Automated email newsletter sending~~ (COMPLETED!)
- ⏰ Scheduled/automated newsletter sending (daily/weekly)
- 🏷️ Categories and tags for organization
- 🔍 Search functionality
- 📄 Export to PDF, Markdown, or other formats
- 🌙 Dark mode support
- ⚙️ Customizable keyboard shortcuts in UI
- 🔗 Integration with Pocket, Instapaper, etc.
- 📊 Reading statistics and analytics
- 🖼️ Screenshot capture alongside text
- 📱 Mobile app companion
- 🎨 Email template customization

## 🐛 Troubleshooting

### Extension not appearing
- Make sure Developer mode is enabled in `chrome://extensions/`
- Check that all files are present in the folder
- Look for errors in the Extensions page

### Keyboard shortcut not working
- Check if another extension is using the same shortcut
- Try reassigning the shortcut in `chrome://extensions/shortcuts/`

### Items not saving
- Check Chrome's storage quota: `chrome://quota-internals/`
- Look for errors in the extension's service worker console
- Ensure you're selecting text before pressing the shortcut

### Newsletter not generating
- Make sure you have items in your reading list
- Check browser console for errors (F12)
- Try disabling popup blockers

### Email not sending
- **Backend not running**: Make sure the backend server is running (`npm start` in the backend folder)
- **Wrong URL**: Verify backend URL in Settings (should be `http://localhost:3000` by default)
- **Email not configured**: Check your email settings in the Settings modal
- **Server errors**: Check the backend server console for error messages
- **Test email works but newsletter doesn't**: Make sure you have items in your reading list

### Email credentials not working (Gmail)
- Enable 2-Step Verification in your Google Account
- Use App Password, not your regular password (https://myaccount.google.com/apppasswords)
- Make sure EMAIL_SERVICE is set to "gmail" in .env

### Backend server won't start
- Make sure you ran `npm install` in the backend folder
- Check if port 3000 is already in use
- Look for error messages in the console
- Verify Node.js is installed (`node --version`)

## 📄 License

This is a prototype/educational project. Feel free to use, modify, and distribute as needed.

## 🤝 Contributing

This is a simple prototype built for local testing. Suggestions and improvements are welcome!

## 📚 Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)

---

**Built with ❤️ for better reading and learning**

Last updated: 2024
