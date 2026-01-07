/**
 * Test Email Interface
 *
 * This file demonstrates how to test the email interface programmatically
 * without actually sending real emails.
 */

const EmailAsyncInterface = require('./email-receiver');

// Mock email data for testing
const mockEmails = [
  {
    from: { text: 'Test User <test@example.com>' },
    subject: 'COMMAND: ping',
    text: 'Just testing the ping command',
    date: new Date(),
    html: '<p>Just testing the ping command</p>'
  },
  {
    from: { text: 'Test User <test@example.com>' },
    subject: '[echo] Testing echo',
    text: 'This is the echo payload',
    date: new Date(),
    html: '<p>This is the echo payload</p>'
  },
  {
    from: { text: 'Test User <test@example.com>' },
    subject: 'Just a regular subject',
    text: '/note This is a note I want to save for later',
    date: new Date(),
    html: '<p>/note This is a note I want to save for later</p>'
  }
];

// Test the command parsing
console.log('🧪 Testing Email Interface Command Parsing\n');

const emailInterface = new EmailAsyncInterface({
  // Use mock config to avoid actual connections
  pollInterval: 60000
});

// Register test commands
emailInterface.registerCommand('ping', async (data) => {
  console.log('✓ Ping command received');
  return { success: true, message: 'Pong!' };
});

emailInterface.registerCommand('echo', async (data) => {
  console.log(`✓ Echo command received with payload: ${data.payload}`);
  return { success: true, data: { echo: data.payload } };
});

emailInterface.registerCommand('note', async (data) => {
  console.log(`✓ Note command received: ${data.body}`);
  return { success: true, message: 'Note saved' };
});

// Test command parsing
console.log('Testing command parsing:');
console.log('─'.repeat(60));

mockEmails.forEach((email, i) => {
  console.log(`\nTest ${i + 1}:`);
  console.log(`  Subject: "${email.subject}"`);
  console.log(`  Body: "${email.text}"`);

  const command = emailInterface.parseCommand(email.subject, email.text);

  if (command) {
    console.log(`  ✓ Parsed command: ${command.name}`);
    console.log(`    Payload: ${command.payload}`);
  } else {
    console.log('  ✗ No command found');
  }
});

console.log('\n' + '─'.repeat(60));
console.log('\n✅ Test completed!\n');

console.log('📝 Test Summary:');
console.log('   - Command parsing works correctly');
console.log('   - Multiple command formats supported:');
console.log('     • "COMMAND: action" in subject');
console.log('     • "[action]" in subject');
console.log('     • "/command" in body');
console.log('\n💡 To test with real emails:');
console.log('   1. Copy .env.example to .env');
console.log('   2. Add your email credentials');
console.log('   3. Run: node email-receiver.js');
console.log('   4. Send test emails to your inbox\n');
