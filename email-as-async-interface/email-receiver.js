const Imap = require('imap');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email-based Async Interface
 *
 * This system receives emails via IMAP and processes them as asynchronous commands/input.
 * Think of it as an email-based API or command queue.
 */

class EmailAsyncInterface {
  constructor(config = {}) {
    // IMAP configuration for receiving emails
    this.imapConfig = {
      user: config.imapUser || process.env.IMAP_USER,
      password: config.imapPassword || process.env.IMAP_PASSWORD,
      host: config.imapHost || process.env.IMAP_HOST || 'imap.gmail.com',
      port: config.imapPort || process.env.IMAP_PORT || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };

    // SMTP configuration for sending responses
    this.smtpConfig = {
      host: config.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: config.smtpPort || process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: config.smtpUser || process.env.SMTP_USER || this.imapConfig.user,
        pass: config.smtpPassword || process.env.SMTP_PASSWORD || this.imapConfig.password
      }
    };

    // Processing configuration
    this.pollInterval = config.pollInterval || process.env.POLL_INTERVAL_MS || 30000;
    this.mailbox = config.mailbox || process.env.MAILBOX || 'INBOX';
    this.processUnseenOnly = config.processUnseenOnly !== undefined
      ? config.processUnseenOnly
      : (process.env.PROCESS_UNSEEN_ONLY === 'true');
    this.markAsRead = config.markAsRead !== undefined
      ? config.markAsRead
      : (process.env.MARK_AS_READ === 'true');

    // Security - only process emails from allowed senders
    this.allowedSenders = config.allowedSenders ||
      (process.env.ALLOWED_SENDERS ? process.env.ALLOWED_SENDERS.split(',').map(s => s.trim()) : []);

    this.imap = null;
    this.smtpTransporter = null;
    this.isProcessing = false;
    this.commandHandlers = new Map();

    console.log('📧 Email Async Interface initialized');
    console.log(`   IMAP: ${this.imapConfig.user} @ ${this.imapConfig.host}`);
    console.log(`   Poll interval: ${this.pollInterval}ms`);
    console.log(`   Allowed senders: ${this.allowedSenders.length > 0 ? this.allowedSenders.join(', ') : 'ALL (⚠️  Warning: No sender filtering)'}`);
  }

  /**
   * Register a command handler
   * @param {string} command - Command name or pattern
   * @param {function} handler - Function to handle the command (receives parsed email)
   */
  registerCommand(command, handler) {
    this.commandHandlers.set(command.toLowerCase(), handler);
    console.log(`✓ Registered command: ${command}`);
  }

  /**
   * Start the email receiver
   */
  start() {
    console.log('\n🚀 Starting Email Async Interface...\n');

    // Initialize SMTP transporter for sending responses
    this.smtpTransporter = nodemailer.createTransporter(this.smtpConfig);

    // Start polling
    this.poll();
    setInterval(() => this.poll(), this.pollInterval);
  }

  /**
   * Poll the mailbox for new emails
   */
  poll() {
    if (this.isProcessing) {
      console.log('⏳ Still processing previous batch, skipping poll...');
      return;
    }

    this.isProcessing = true;
    console.log(`🔍 Polling mailbox... [${new Date().toLocaleTimeString()}]`);

    this.imap = new Imap(this.imapConfig);

    this.imap.once('ready', () => {
      this.imap.openBox(this.mailbox, false, (err, box) => {
        if (err) {
          console.error('❌ Error opening mailbox:', err.message);
          this.cleanup();
          return;
        }

        // Search for emails to process
        const searchCriteria = this.processUnseenOnly ? ['UNSEEN'] : ['ALL'];

        this.imap.search(searchCriteria, (err, results) => {
          if (err) {
            console.error('❌ Error searching emails:', err.message);
            this.cleanup();
            return;
          }

          if (results.length === 0) {
            console.log('   No new emails to process');
            this.cleanup();
            return;
          }

          console.log(`   📬 Found ${results.length} email(s) to process`);

          const fetch = this.imap.fetch(results, { bodies: '', markSeen: this.markAsRead });

          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('❌ Error parsing email:', err.message);
                  return;
                }

                await this.processEmail(parsed, seqno);
              });
            });
          });

          fetch.once('error', (err) => {
            console.error('❌ Fetch error:', err.message);
          });

          fetch.once('end', () => {
            console.log('✓ Finished processing batch\n');
            this.cleanup();
          });
        });
      });
    });

    this.imap.once('error', (err) => {
      console.error('❌ IMAP connection error:', err.message);
      this.cleanup();
    });

    this.imap.connect();
  }

  /**
   * Process a parsed email
   */
  async processEmail(email, seqno) {
    const from = email.from?.text || 'unknown';
    const subject = email.subject || '(no subject)';
    const text = email.text || '';
    const html = email.html || '';

    console.log(`\n📨 Processing email #${seqno}`);
    console.log(`   From: ${from}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Preview: ${text.substring(0, 100)}...`);

    // Security check: verify sender
    if (this.allowedSenders.length > 0) {
      const senderEmail = this.extractEmail(from);
      if (!this.allowedSenders.includes(senderEmail)) {
        console.log(`   ⚠️  Skipped: Sender ${senderEmail} not in allowed list`);
        return;
      }
    }

    // Parse command from subject or body
    const command = this.parseCommand(subject, text);

    if (!command) {
      console.log('   ⚠️  No command found in email');
      return;
    }

    console.log(`   🎯 Command detected: ${command.name}`);
    console.log(`   📦 Payload:`, command.payload);

    // Execute command
    try {
      await this.executeCommand(command, email);
    } catch (error) {
      console.error(`   ❌ Error executing command: ${error.message}`);

      // Send error response
      await this.sendResponse(from, subject, {
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Parse command from email subject/body
   * Commands can be in format:
   * - Subject: "COMMAND: action"
   * - Subject: "[action] description"
   * - Body first line: "/command args"
   */
  parseCommand(subject, body) {
    // Try parsing from subject
    let match;

    // Format: "COMMAND: action"
    match = subject.match(/^COMMAND:\s*(\w+)(.*)$/i);
    if (match) {
      return {
        name: match[1].toLowerCase(),
        payload: match[2].trim()
      };
    }

    // Format: "[action] description"
    match = subject.match(/^\[(\w+)\](.*)$/);
    if (match) {
      return {
        name: match[1].toLowerCase(),
        payload: match[2].trim()
      };
    }

    // Try parsing from body first line
    const firstLine = body.split('\n')[0].trim();

    // Format: "/command args"
    match = firstLine.match(/^\/(\w+)(.*)$/);
    if (match) {
      return {
        name: match[1].toLowerCase(),
        payload: match[2].trim(),
        body: body
      };
    }

    // Default: treat entire subject as command name, body as payload
    if (subject) {
      return {
        name: subject.toLowerCase().replace(/[^a-z0-9]/g, ''),
        payload: body,
        rawSubject: subject
      };
    }

    return null;
  }

  /**
   * Execute a command
   */
  async executeCommand(command, email) {
    const handler = this.commandHandlers.get(command.name);

    if (!handler) {
      console.log(`   ⚠️  No handler registered for command: ${command.name}`);
      console.log(`   Available commands: ${Array.from(this.commandHandlers.keys()).join(', ') || '(none)'}`);
      return;
    }

    const result = await handler({
      command: command.name,
      payload: command.payload,
      body: command.body || email.text,
      email: email,
      from: email.from?.text,
      subject: email.subject,
      timestamp: email.date
    });

    console.log(`   ✅ Command executed successfully`);

    // Send success response
    if (result && result.sendResponse !== false) {
      await this.sendResponse(
        email.from?.text,
        email.subject,
        result
      );
    }
  }

  /**
   * Send an email response
   */
  async sendResponse(to, originalSubject, result) {
    try {
      const mailOptions = {
        from: this.smtpConfig.auth.user,
        to: this.extractEmail(to),
        subject: `Re: ${originalSubject}`,
        html: this.formatResponse(result)
      };

      await this.smtpTransporter.sendMail(mailOptions);
      console.log(`   📤 Response sent to ${to}`);
    } catch (error) {
      console.error(`   ❌ Failed to send response: ${error.message}`);
    }
  }

  /**
   * Format response as HTML
   */
  formatResponse(result) {
    if (typeof result === 'string') {
      return `<p>${result}</p>`;
    }

    if (result.success === false) {
      return `
        <h2>❌ Command Failed</h2>
        <p><strong>Error:</strong> ${result.error}</p>
      `;
    }

    return `
      <h2>✅ Command Executed Successfully</h2>
      ${result.message ? `<p>${result.message}</p>` : ''}
      ${result.data ? `<pre>${JSON.stringify(result.data, null, 2)}</pre>` : ''}
    `;
  }

  /**
   * Extract email address from "Name <email>" format
   */
  extractEmail(fromString) {
    const match = fromString.match(/<(.+?)>/);
    return match ? match[1] : fromString;
  }

  /**
   * Cleanup IMAP connection
   */
  cleanup() {
    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }
    this.isProcessing = false;
  }

  /**
   * Stop the interface
   */
  stop() {
    console.log('\n🛑 Stopping Email Async Interface...\n');
    this.cleanup();
  }
}

// Export for use as module
module.exports = EmailAsyncInterface;

// Run as standalone if executed directly
if (require.main === module) {
  const emailInterface = new EmailAsyncInterface();

  // Example command handlers
  emailInterface.registerCommand('ping', async (data) => {
    console.log('   🏓 Pong!');
    return {
      success: true,
      message: 'Pong! Your email interface is working.',
      timestamp: new Date().toISOString()
    };
  });

  emailInterface.registerCommand('echo', async (data) => {
    console.log(`   🔊 Echo: ${data.payload}`);
    return {
      success: true,
      message: 'Echo response',
      data: {
        received: data.payload,
        timestamp: new Date().toISOString()
      }
    };
  });

  emailInterface.registerCommand('info', async (data) => {
    return {
      success: true,
      message: 'Email Interface Information',
      data: {
        receivedAt: new Date().toISOString(),
        from: data.from,
        subject: data.subject,
        bodyLength: data.body.length,
        command: data.command
      }
    };
  });

  // Start the interface
  emailInterface.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    emailInterface.stop();
    process.exit(0);
  });
}
