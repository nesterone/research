#!/usr/bin/env node

import { Command } from 'commander';
import { GherkinToPlaywright } from './gherkin-to-playwright.js';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const program = new Command();

/**
 * NLP to Gherkin Testing CLI
 * Orchestrates the workflow: NLP → Gherkin → Review → Execute → Report
 */

program
  .name('nlp-gherkin-test')
  .description('Convert natural language to Gherkin DSL and execute with Playwright')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate Gherkin from natural language prompt')
  .argument('<prompt>', 'Natural language test description')
  .option('-o, --output <file>', 'Output Gherkin file', 'test.feature')
  .option('-f, --feature <name>', 'Custom feature name')
  .action(async (prompt, options) => {
    console.log('🔄 Converting natural language to Gherkin...\n');

    try {
      // In a real implementation, this would call the MCP server
      // For demo purposes, we'll use the local conversion logic
      const gherkin = await convertNLPToGherkin(prompt, options.feature);

      await fs.writeFile(options.output, gherkin);
      console.log(`✅ Gherkin specification generated: ${options.output}\n`);
      console.log('Generated Gherkin:');
      console.log('─'.repeat(50));
      console.log(gherkin);
      console.log('─'.repeat(50));
      console.log('\n💡 Review the specification and run "nlp-gherkin-test convert" to generate Playwright tests');
    } catch (error) {
      console.error('❌ Error generating Gherkin:', error.message);
      process.exit(1);
    }
  });

program
  .command('convert')
  .description('Convert Gherkin to Playwright test code')
  .argument('<gherkin-file>', 'Gherkin feature file')
  .option('-o, --output <file>', 'Output Playwright test file', 'test.spec.js')
  .option('-b, --base-url <url>', 'Base URL for tests', 'http://localhost:3000')
  .action(async (gherkinFile, options) => {
    console.log('🔄 Converting Gherkin to Playwright...\n');

    try {
      const gherkin = await fs.readFile(gherkinFile, 'utf-8');
      const converter = new GherkinToPlaywright({ baseURL: options.baseUrl });
      const playwrightCode = converter.convert(gherkin);

      await fs.writeFile(options.output, playwrightCode);
      console.log(`✅ Playwright test generated: ${options.output}\n`);
      console.log('Generated Test Code:');
      console.log('─'.repeat(50));
      console.log(playwrightCode);
      console.log('─'.repeat(50));
      console.log('\n💡 Run "npx playwright test" to execute the tests');
    } catch (error) {
      console.error('❌ Error converting to Playwright:', error.message);
      process.exit(1);
    }
  });

program
  .command('execute')
  .description('Execute Playwright tests and generate report')
  .argument('<test-file>', 'Playwright test file')
  .option('-r, --reporter <type>', 'Reporter type (html, json, junit)', 'html')
  .action(async (testFile, options) => {
    console.log('🧪 Executing Playwright tests...\n');

    try {
      const cmd = `npx playwright test ${testFile} --reporter=${options.reporter}`;
      const { stdout, stderr } = await execAsync(cmd);

      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);

      console.log('\n✅ Test execution completed');
      console.log('📊 Report available in: playwright-report/');
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      if (error.stdout) console.log(error.stdout);
      if (error.stderr) console.error(error.stderr);
      process.exit(1);
    }
  });

program
  .command('full-workflow')
  .description('Run complete workflow: NLP → Gherkin → Playwright → Execute')
  .argument('<prompt>', 'Natural language test description')
  .option('-b, --base-url <url>', 'Base URL for tests', 'http://localhost:3000')
  .option('--skip-review', 'Skip manual review step', false)
  .action(async (prompt, options) => {
    console.log('🚀 Starting full testing workflow...\n');

    const workDir = path.join(process.cwd(), 'generated-tests');
    await fs.mkdir(workDir, { recursive: true });

    const gherkinFile = path.join(workDir, 'test.feature');
    const playwrightFile = path.join(workDir, 'test.spec.js');

    try {
      // Step 1: Generate Gherkin
      console.log('📝 Step 1: Generating Gherkin from natural language...');
      const gherkin = await convertNLPToGherkin(prompt);
      await fs.writeFile(gherkinFile, gherkin);
      console.log('✅ Gherkin generated\n');
      console.log(gherkin);
      console.log('\n' + '─'.repeat(50) + '\n');

      // Step 2: User Review (if not skipped)
      if (!options.skipReview) {
        console.log('⏸️  Step 2: Review the Gherkin specification above');
        console.log('Press Enter to continue or Ctrl+C to abort...');
        await waitForUserInput();
      }

      // Step 3: Convert to Playwright
      console.log('🔄 Step 3: Converting to Playwright tests...');
      const converter = new GherkinToPlaywright({ baseURL: options.baseUrl });
      const playwrightCode = converter.convert(gherkin);
      await fs.writeFile(playwrightFile, playwrightCode);
      console.log('✅ Playwright test generated\n');

      // Step 4: Execute tests
      console.log('🧪 Step 4: Executing tests...');
      console.log('(Note: Tests may fail if the application is not running)\n');

      try {
        const { stdout } = await execAsync(`npx playwright test ${playwrightFile} --reporter=list`);
        console.log(stdout);
      } catch (error) {
        console.log('Test execution output:');
        if (error.stdout) console.log(error.stdout);
        console.log('\n⚠️  Some tests may have failed - this is expected for demo purposes');
      }

      // Step 5: Generate summary
      console.log('\n' + '─'.repeat(50));
      console.log('✨ Workflow completed!');
      console.log('─'.repeat(50));
      console.log(`📁 Generated files:`);
      console.log(`   - Gherkin: ${gherkinFile}`);
      console.log(`   - Playwright: ${playwrightFile}`);
      console.log(`\n💡 To run tests again: npx playwright test ${playwrightFile}`);
    } catch (error) {
      console.error('\n❌ Workflow failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('demo')
  .description('Run a demo of the system with sample scenarios')
  .action(async () => {
    console.log('🎬 Running NLP to Gherkin Testing Demo\n');

    const scenarios = [
      'test user creation',
      'test login functionality',
      'test form validation',
      'test search feature'
    ];

    for (const scenario of scenarios) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Scenario: "${scenario}"`);
      console.log('='.repeat(60) + '\n');

      const gherkin = await convertNLPToGherkin(scenario);
      console.log('Generated Gherkin:');
      console.log('─'.repeat(50));
      console.log(gherkin);
      console.log('─'.repeat(50) + '\n');

      const converter = new GherkinToPlaywright();
      const playwright = converter.convert(gherkin);
      console.log('Generated Playwright Code (preview):');
      console.log('─'.repeat(50));
      console.log(playwright.split('\n').slice(0, 20).join('\n'));
      console.log('... (truncated for brevity)');
      console.log('─'.repeat(50) + '\n');

      await sleep(1000);
    }

    console.log('\n✨ Demo completed!');
    console.log('💡 Try: npx nlp-gherkin-test full-workflow "your test description here"');
  });

// Helper functions
async function convertNLPToGherkin(prompt, featureName) {
  // Simplified version - in production this would call MCP server
  const promptLower = prompt.toLowerCase();
  const scenarios = [];

  if (promptLower.includes('user') && (promptLower.includes('creation') || promptLower.includes('register'))) {
    scenarios.push({
      name: 'Successful User Registration',
      steps: [
        'Given I am on the registration page',
        'When I enter a valid username "testuser123"',
        'And I enter a valid email "testuser@example.com"',
        'And I enter a valid password "SecurePass123!"',
        'And I click the register button',
        'Then I should see a success message',
        'And I should be redirected to the dashboard',
        'And the user should be created in the database'
      ]
    });
    scenarios.push({
      name: 'Registration with Invalid Data',
      steps: [
        'Given I am on the registration page',
        'When I submit the form with empty fields',
        'Then I should see validation error messages',
        'And the form should not be submitted'
      ]
    });
  }

  if (promptLower.includes('login')) {
    scenarios.push({
      name: 'Successful User Login',
      steps: [
        'Given I am on the login page',
        'And I have a registered account',
        'When I enter my valid username',
        'And I enter my valid password',
        'And I click the login button',
        'Then I should be redirected to the dashboard',
        'And I should see my username displayed'
      ]
    });
    scenarios.push({
      name: 'Login with Invalid Credentials',
      steps: [
        'Given I am on the login page',
        'When I enter invalid credentials',
        'And I click the login button',
        'Then I should see an error message',
        'And I should remain on the login page'
      ]
    });
  }

  if (promptLower.includes('form') && promptLower.includes('validation')) {
    scenarios.push({
      name: 'Form Validation for Required Fields',
      steps: [
        'Given I am on the form page',
        'When I submit the form with empty required fields',
        'Then I should see validation error messages for each field',
        'And the form should not be submitted'
      ]
    });
  }

  if (promptLower.includes('search')) {
    scenarios.push({
      name: 'Search with Valid Query',
      steps: [
        'Given I am on the search page',
        'When I enter a valid search term',
        'And I click the search button',
        'Then I should see relevant search results',
        'And the results should be displayed in a list'
      ]
    });
  }

  if (scenarios.length === 0) {
    scenarios.push({
      name: 'Generic Test Scenario',
      steps: [
        'Given the application is running',
        'When I interact with the feature',
        'Then the expected behavior should occur'
      ]
    });
  }

  const feature = featureName || extractFeatureName(prompt);
  let gherkin = `Feature: ${feature}\n`;
  gherkin += `  As a user\n`;
  gherkin += `  I want to ${prompt}\n`;
  gherkin += `  So that I can verify the functionality works correctly\n\n`;

  scenarios.forEach(scenario => {
    gherkin += `  Scenario: ${scenario.name}\n`;
    scenario.steps.forEach(step => {
      gherkin += `    ${step}\n`;
    });
    gherkin += '\n';
  });

  return gherkin.trim();
}

function extractFeatureName(prompt) {
  const words = prompt.split(' ');
  const significantWords = words.filter(w =>
    !['test', 'testing', 'a', 'the', 'and', 'or'].includes(w.toLowerCase())
  );
  return significantWords
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Application Feature';
}

function waitForUserInput() {
  return new Promise(resolve => {
    process.stdin.once('data', () => {
      resolve();
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

program.parse();
