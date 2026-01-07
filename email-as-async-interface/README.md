# Email as Async Interface

An experimental system that uses email as an asynchronous, "fire and forget" input interface. Send an email, trigger a command. No app needed, works from anywhere.

## Concept

Email is inherently asynchronous and provides natural queuing, persistence, and universal access. This project explores using email as a command interface where:

1. **You send an email** with a command in the subject or body
2. **The system receives and processes it** asynchronously
3. **You get a response email** with the result (optional)

Think of it as an **email-based API** or **mail-triggered webhooks**.

## Why?

### Advantages
- **Universal Access** - Everyone has email, no app installation
- **Asynchronous Nature** - Perfect for non-urgent, queued operations
- **Built-in Persistence** - All commands automatically logged in your sent folder
- **Mobile Friendly** - Easy to trigger from any device
- **Offline Capable** - Compose emails offline, they'll send/process later
- **Natural Queuing** - Email infrastructure handles delivery, retry, queuing

### Use Cases
- Quick note taking from any device
- Adding tasks to your todo list
- Logging data points (weight, expenses, habits)
- Triggering webhooks or API calls
- Remote command execution
- Document processing (OCR, data extraction)
- IoT and home automation control
- Scheduling reminders
- Content publishing (blog posts, social media)

See [use-cases.md](./use-cases.md) for detailed examples.

## Architecture

```
┌─────────────┐
│   You send  │
│   an email  │
└─────┬───────┘
      │
      ▼
┌─────────────────────┐
│   Email Provider    │
│   (Gmail, etc.)     │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│  IMAP Polling       │◄── Checks every 30s (configurable)
│  (This System)      │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│  Command Parser     │
│  Extracts command   │
│  from subject/body  │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│  Command Handler    │
│  Executes command   │
│  (user-defined)     │
└─────┬───────────────┘
      │
      ▼
┌─────────────────────┐
│  Response Email     │
│  (optional)         │
└─────────────────────┘
      │
      ▼
┌─────────────┐
│   You get   │
│   result    │
└─────────────┘
```

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Configuration

Copy the example environment file and add your email credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# IMAP Configuration (for receiving emails)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your-email@gmail.com
IMAP_PASSWORD=your-app-password  # Use app-specific password for Gmail

# SMTP Configuration (for sending responses)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Processing Configuration
POLL_INTERVAL_MS=30000           # Check every 30 seconds
PROCESS_UNSEEN_ONLY=true         # Only process unread emails
MARK_AS_READ=true                # Mark processed emails as read

# Security
ALLOWED_SENDERS=your-email@gmail.com  # Whitelist senders (comma-separated)
```

**For Gmail:**
1. Enable 2-factor authentication
2. Generate an app-specific password at https://myaccount.google.com/apppasswords
3. Use that password in the `.env` file

### 3. Run

Basic example with built-in commands:

```bash
node email-receiver.js
```

Custom commands example:

```bash
node example-custom-commands.js
```

### 4. Test

Send yourself an email:

**Subject:** `COMMAND: ping`

**Body:** (anything)

You should receive a response email with "Pong!"

## Command Formats

The system supports multiple command formats for flexibility:

### Format 1: Subject with "COMMAND:"
```
Subject: COMMAND: ping
Body: (optional payload)
```

### Format 2: Subject with brackets
```
Subject: [echo] Testing the echo
Body: (optional payload)
```

### Format 3: Body with slash command
```
Subject: (anything)
Body: /note This is a note I want to save
```

### Format 4: Subject as command
```
Subject: health
Body: (treated as payload)
```

## Creating Custom Commands

```javascript
const EmailAsyncInterface = require('./email-receiver');

const emailInterface = new EmailAsyncInterface();

// Register a command
emailInterface.registerCommand('mycommand', async (data) => {
  console.log('Received:', data.payload);

  // Your custom logic here
  // - Save to database
  // - Call API
  // - Process data
  // - Etc.

  // Return response (will be sent as email)
  return {
    success: true,
    message: 'Command executed!',
    data: { result: 'some data' }
  };
});

// Start listening for emails
emailInterface.start();
```

### Command Handler Data Object

Your handler receives an object with:

```javascript
{
  command: 'commandname',      // The command name
  payload: 'extracted data',   // Data from subject/body
  body: 'full email body',     // Complete email text
  email: { /* parsed email */ }, // Full parsed email object
  from: 'sender@example.com',  // Sender address
  subject: 'email subject',    // Email subject
  timestamp: Date              // Email timestamp
}
```

### Command Handler Response

Return an object like:

```javascript
{
  success: true,                    // true/false
  message: 'Human readable message',
  data: { /* any data */ },         // Will be JSON formatted in email
  sendResponse: true                // Set to false to not send email response
}
```

## Example Commands

### Built-in Commands (`email-receiver.js`)

- **ping** - Health check, responds with "Pong!"
- **echo** - Echoes back the payload
- **info** - Returns email metadata

### Extended Commands (`example-custom-commands.js`)

- **note** - Save a note
  ```
  Subject: [note] Meeting notes
  Body: Had a great discussion about the new feature...
  ```

- **todo** - Add a todo item
  ```
  Subject: COMMAND: todo
  Body: Review pull request #123
  ```

- **log** - Log data (no response email)
  ```
  Subject: [log] Daily weight
  Body: 75.2kg
  ```

- **webhook** - Trigger a webhook
  ```
  Subject: [webhook] https://api.example.com/deploy
  Body: {"branch": "main"}
  ```

- **remind** - Schedule a reminder
  ```
  Subject: [remind] Team meeting tomorrow
  Body: Prepare presentation slides
  ```

- **process** - Async background processing
  ```
  Subject: COMMAND: process
  Body: Large dataset to process...
  ```

- **health** - System health check
  ```
  Subject: [health]
  ```

## Security Features

### 1. Sender Whitelisting

Only process emails from specific addresses:

```bash
# In .env
ALLOWED_SENDERS=your-email@gmail.com,trusted@example.com
```

### 2. Command Validation

- Commands must be registered to execute
- Unknown commands are logged but ignored
- Full audit trail in console logs

### 3. Best Practices

- Use app-specific passwords (never your main password)
- Enable 2-factor authentication
- Whitelist senders
- Review logs regularly
- Use HTTPS/TLS for email connections

## Testing

Run the test suite:

```bash
npm test
# or
node test-email-interface.js
```

This tests command parsing without making actual email connections.

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `IMAP_HOST` | `imap.gmail.com` | IMAP server hostname |
| `IMAP_PORT` | `993` | IMAP port (usually 993 for SSL) |
| `IMAP_USER` | - | Your email address |
| `IMAP_PASSWORD` | - | App-specific password |
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server for responses |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | Same as IMAP | Email for sending responses |
| `SMTP_PASSWORD` | Same as IMAP | Password for sending |
| `POLL_INTERVAL_MS` | `30000` | How often to check for new emails (ms) |
| `MAILBOX` | `INBOX` | Which mailbox to monitor |
| `PROCESS_UNSEEN_ONLY` | `true` | Only process unread emails |
| `MARK_AS_READ` | `true` | Mark processed emails as read |
| `ALLOWED_SENDERS` | - | Comma-separated list of allowed email addresses |

### Programmatic Configuration

```javascript
const emailInterface = new EmailAsyncInterface({
  imapHost: 'imap.gmail.com',
  imapPort: 993,
  imapUser: 'your-email@gmail.com',
  imapPassword: 'your-app-password',
  pollInterval: 60000, // 1 minute
  allowedSenders: ['trusted@example.com']
});
```

## Performance

- **Latency:** Depends on poll interval (default 30 seconds)
- **Throughput:** Sequential processing, suitable for personal use
- **Resource Usage:** Minimal (IMAP connection only during polling)
- **Scalability:** Single inbox, single process

For high-volume production use, consider:
- IMAP IDLE for real-time processing
- Multiple workers
- Queue system (Bull, BeeQueue)
- Database for command history

## Limitations

1. **Not Real-time** - Email has inherent delays (seconds to minutes)
2. **Size Limits** - Email size constraints (typically 25-50MB)
3. **Spam Risk** - Automated emails may trigger spam filters
4. **Security** - Email is not end-to-end encrypted by default

## When NOT to Use

- Real-time requirements (use WebSockets instead)
- Large data transfers (use file upload/API)
- High-frequency operations (use proper API)
- Highly interactive workflows (use web/mobile app)

## Email Provider Setup

### Gmail

1. Enable 2FA: https://myaccount.google.com/security
2. Generate app password: https://myaccount.google.com/apppasswords
3. Enable IMAP: Settings → Forwarding and POP/IMAP → Enable IMAP

### Outlook/Office 365

```bash
IMAP_HOST=outlook.office365.com
IMAP_PORT=993
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
```

### Yahoo

```bash
IMAP_HOST=imap.mail.yahoo.com
IMAP_PORT=993
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=465
```

## Files

- `email-receiver.js` - Main implementation, EmailAsyncInterface class
- `example-custom-commands.js` - Extended examples with custom commands
- `test-email-interface.js` - Test suite for command parsing
- `package.json` - Dependencies
- `.env.example` - Configuration template
- `notes.md` - Development notes and learning
- `use-cases.md` - Detailed use cases and patterns
- `README.md` - This file

## Development

### Adding New Commands

1. Create handler function:
```javascript
async function myHandler(data) {
  // Your logic
  return { success: true, message: 'Done!' };
}
```

2. Register it:
```javascript
emailInterface.registerCommand('mycommand', myHandler);
```

3. Test by sending email with subject: `[mycommand] test`

### Debugging

Set logging to verbose:

```javascript
// The system logs to console
// Check output for:
// - Email receipts
// - Command parsing
// - Handler execution
// - Response sending
```

## Future Ideas

- IMAP IDLE for real-time processing
- Natural language command parsing (AI-powered)
- Attachment processing (images, PDFs)
- Multi-user support with permissions
- Web dashboard for monitoring
- Command templates and macros
- Email threading support
- Database integration for history
- Webhook recorder/debugger
- Rate limiting per sender

## Contributing

This is an experimental project. Feel free to:
- Try it out
- Add your own commands
- Extend functionality
- Share use cases

## License

MIT

## Acknowledgments

Built to explore asynchronous interfaces and the potential of email as a universal, accessible command gateway.

---

**Remember:** Email is asynchronous. Embrace the delay. Use it for "fire and forget" operations where immediate response isn't critical but universal access and persistence matter.
