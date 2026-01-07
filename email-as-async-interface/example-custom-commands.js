const EmailAsyncInterface = require('./email-receiver');

/**
 * Example: Custom Command Handlers
 *
 * This demonstrates how to build custom commands for the email interface.
 * Imagine these as "email-triggered webhooks" or "mail-based APIs"
 */

const emailInterface = new EmailAsyncInterface();

// Command: Save a note
emailInterface.registerCommand('note', async (data) => {
  const note = data.payload || data.body;

  // Here you would save to a database, file, or cloud service
  // For demo, we'll just log it
  console.log(`   📝 Saving note: "${note}"`);

  // Simulate saving
  const noteId = Date.now().toString(36);

  return {
    success: true,
    message: `Note saved successfully!`,
    data: {
      id: noteId,
      content: note.substring(0, 100) + (note.length > 100 ? '...' : ''),
      savedAt: new Date().toISOString()
    }
  };
});

// Command: Add to todo list
emailInterface.registerCommand('todo', async (data) => {
  const task = data.payload || data.body;

  console.log(`   ✅ Adding todo: "${task}"`);

  // Simulate adding to todo list
  const todoId = Date.now().toString(36);

  return {
    success: true,
    message: `Todo item added!`,
    data: {
      id: todoId,
      task: task,
      completed: false,
      createdAt: new Date().toISOString()
    }
  };
});

// Command: Log data (useful for fire-and-forget logging)
emailInterface.registerCommand('log', async (data) => {
  const logData = data.body;

  console.log(`   📊 Logging data:`);
  console.log(`      ${logData}`);

  // Could write to file, send to logging service, etc.

  return {
    success: true,
    message: 'Data logged successfully',
    sendResponse: false // Don't send email response for logs
  };
});

// Command: Trigger a webhook or API call
emailInterface.registerCommand('webhook', async (data) => {
  const webhookUrl = data.payload;
  const webhookData = data.body;

  console.log(`   🔔 Triggering webhook: ${webhookUrl}`);

  // Here you would actually call the webhook
  // const response = await fetch(webhookUrl, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ data: webhookData })
  // });

  return {
    success: true,
    message: `Webhook triggered successfully`,
    data: {
      url: webhookUrl,
      triggeredAt: new Date().toISOString()
    }
  };
});

// Command: Schedule a reminder
emailInterface.registerCommand('remind', async (data) => {
  const reminder = data.payload || data.body;

  console.log(`   ⏰ Scheduling reminder: "${reminder}"`);

  // In a real implementation, you would:
  // - Parse the time/date from the reminder
  // - Schedule a job (using node-cron, agenda, bull, etc.)
  // - Send email back at scheduled time

  return {
    success: true,
    message: `Reminder scheduled!`,
    data: {
      reminder: reminder,
      scheduledAt: new Date().toISOString()
    }
  };
});

// Command: Process data asynchronously
emailInterface.registerCommand('process', async (data) => {
  console.log(`   ⚙️  Starting async processing...`);

  // Simulate long-running process
  // This runs in the background, email confirmation is sent immediately
  setTimeout(() => {
    console.log(`   ✅ Background processing completed`);
    // Could send another email when done
  }, 5000);

  return {
    success: true,
    message: 'Processing started! You will receive another email when complete.',
    data: {
      jobId: Date.now().toString(36),
      status: 'processing',
      estimatedTime: '5 seconds'
    }
  };
});

// Command: Health check
emailInterface.registerCommand('health', async (data) => {
  return {
    success: true,
    message: 'System is healthy!',
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage()
    }
  };
});

// Start the interface
console.log('\n🎯 Starting Email Async Interface with custom commands...\n');
emailInterface.start();

// Graceful shutdown
process.on('SIGINT', () => {
  emailInterface.stop();
  process.exit(0);
});
