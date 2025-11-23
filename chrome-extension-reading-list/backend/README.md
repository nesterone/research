# Reading List Email Backend

A simple Node.js/Express server that handles email sending for the Reading List Chrome Extension.

## Features

- Send newsletters via email
- Support for multiple email providers (Gmail, Outlook, Yahoo, etc.)
- Test email functionality
- Development mode with Ethereal (test email service)
- CORS enabled for Chrome Extension integration

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Email (Optional for Testing)

For **testing without real email** (uses Ethereal test service):
- Just run the server - it will auto-configure with a test account
- Preview emails at https://ethereal.email

For **real email sending**:

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your email credentials
nano .env  # or use your preferred editor
```

#### Gmail Configuration

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated password
3. Update `.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

#### Outlook Configuration

```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

#### Other Email Providers

Supported services: gmail, outlook, yahoo, icloud, mail.ru, and more.

### 3. Start the Server

```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "emailConfigured": true
}
```

### Send Newsletter
```bash
POST /send-newsletter
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Your Reading List Newsletter",
  "html": "<html>...</html>"
}
```

Response:
```json
{
  "success": true,
  "messageId": "<message-id>",
  "previewURL": "https://ethereal.email/message/...",
  "message": "Email sent successfully!"
}
```

### Send Test Email
```bash
POST /send-test-email
Content-Type: application/json

{
  "to": "your-email@example.com"
}
```

## Testing with cURL

```bash
# Check server health
curl http://localhost:3000/health

# Send test email
curl -X POST http://localhost:3000/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com"}'
```

## Troubleshooting

### Gmail Authentication Errors

- Make sure 2-Step Verification is enabled
- Use App Password, not your regular password
- Allow less secure apps if needed

### Connection Refused

- Make sure the server is running
- Check if port 3000 is available
- Verify firewall settings

### Email Not Sending

- Check your email credentials in `.env`
- Verify your internet connection
- Check server logs for detailed error messages

## Security Notes

- Never commit `.env` file to version control
- Use App Passwords instead of regular passwords
- Consider using environment variables in production
- The server accepts requests from any origin (CORS enabled for development)

## Development

### Dependencies

- **express**: Web framework
- **cors**: Enable CORS for Chrome Extension
- **nodemailer**: Email sending library
- **dotenv**: Environment variable management
- **nodemon**: Auto-restart during development

### Project Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── .env.example       # Example environment variables
├── .env               # Your actual config (not committed)
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## Production Deployment

For production, consider:

1. Use a proper hosting service (Heroku, Railway, DigitalOcean, etc.)
2. Set environment variables through your hosting provider
3. Enable HTTPS
4. Implement rate limiting
5. Add authentication for the API endpoints
6. Use a production-grade SMTP service (SendGrid, Mailgun, etc.)

## License

MIT
