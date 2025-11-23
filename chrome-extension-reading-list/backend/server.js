const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Email transporter configuration
let transporter;

function createTransporter() {
  // Check if we have environment variables
  if (process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    // Production configuration using environment variables
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE, // e.g., 'gmail', 'outlook', 'yahoo'
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    console.log('✓ Email transporter configured with environment variables');
  } else {
    // Development configuration using ethereal (test email service)
    console.log('⚠ No email credentials found. Using Ethereal test account...');
    nodemailer.createTestAccount((err, account) => {
      if (err) {
        console.error('Failed to create test account:', err);
        return;
      }

      transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass
        }
      });

      console.log('✓ Ethereal test account created');
      console.log('  Test email user:', account.user);
      console.log('  You can preview emails at: https://ethereal.email');
    });
  }
}

createTransporter();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    emailConfigured: !!transporter
  });
});

// Send newsletter endpoint
app.post('/send-newsletter', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    // Validation
    if (!to || !subject || !html) {
      return res.status(400).json({
        error: 'Missing required fields: to, subject, html'
      });
    }

    if (!transporter) {
      return res.status(500).json({
        error: 'Email service not configured. Please check server configuration.'
      });
    }

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER || 'reading-list@example.com',
      to: to,
      subject: subject,
      html: html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);

    // If using ethereal, provide preview URL
    const previewURL = nodemailer.getTestMessageUrl(info);

    res.json({
      success: true,
      messageId: info.messageId,
      previewURL: previewURL || null,
      message: previewURL
        ? 'Test email sent! Preview it at: ' + previewURL
        : 'Email sent successfully!'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Test email endpoint (for quick testing)
app.post('/send-test-email', async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Email address required' });
    }

    if (!transporter) {
      return res.status(500).json({
        error: 'Email service not configured'
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'reading-list@example.com',
      to: to,
      subject: 'Test Email from Reading List Extension',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your Reading List Extension backend.</p>
        <p>If you received this, your email configuration is working correctly! ✓</p>
        <p><small>Sent at: ${new Date().toLocaleString()}</small></p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    const previewURL = nodemailer.getTestMessageUrl(info);

    res.json({
      success: true,
      messageId: info.messageId,
      previewURL: previewURL || null,
      message: 'Test email sent successfully!'
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Reading List Email Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Send newsletter: POST http://localhost:${PORT}/send-newsletter`);
  console.log(`   Test email: POST http://localhost:${PORT}/send-test-email\n`);
});
