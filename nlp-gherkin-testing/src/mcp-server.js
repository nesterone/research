#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP Server for NLP to Gherkin conversion
 * Provides tools for generating and validating Gherkin specifications
 */

// Simple NLP to Gherkin converter (in production, this would use an LLM)
function nlpToGherkin(naturalLanguagePrompt, context = {}) {
  const prompt = naturalLanguagePrompt.toLowerCase();

  // Extract key information from the prompt
  const scenarios = [];

  // Pattern matching for common test scenarios
  if (prompt.includes('user') && (prompt.includes('creation') || prompt.includes('register') || prompt.includes('signup'))) {
    scenarios.push({
      name: 'User Registration',
      steps: [
        'Given I am on the registration page',
        'When I enter valid user details',
        'And I submit the registration form',
        'Then I should see a success message',
        'And the user should be created in the database'
      ]
    });
  }

  if (prompt.includes('login') || prompt.includes('sign in')) {
    scenarios.push({
      name: 'User Login',
      steps: [
        'Given I am on the login page',
        'When I enter valid credentials',
        'And I click the login button',
        'Then I should be redirected to the dashboard',
        'And I should see my username displayed'
      ]
    });
  }

  if (prompt.includes('form') && prompt.includes('validation')) {
    scenarios.push({
      name: 'Form Validation',
      steps: [
        'Given I am on the form page',
        'When I submit the form with empty fields',
        'Then I should see validation error messages',
        'And the form should not be submitted'
      ]
    });
  }

  if (prompt.includes('search')) {
    scenarios.push({
      name: 'Search Functionality',
      steps: [
        'Given I am on the search page',
        'When I enter a search term',
        'And I click the search button',
        'Then I should see relevant search results',
        'And the results should be displayed in a list'
      ]
    });
  }

  // Default scenario if no patterns match
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

  // Generate Gherkin
  const feature = context.featureName || extractFeatureName(prompt);
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

function validateGherkin(gherkinText) {
  const errors = [];
  const warnings = [];

  // Basic validation
  if (!gherkinText.includes('Feature:')) {
    errors.push('Gherkin must start with a Feature declaration');
  }

  if (!gherkinText.includes('Scenario:')) {
    errors.push('Gherkin must contain at least one Scenario');
  }

  const lines = gherkinText.split('\n');
  const stepKeywords = ['Given', 'When', 'Then', 'And', 'But'];
  let hasSteps = false;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (stepKeywords.some(keyword => trimmed.startsWith(keyword))) {
      hasSteps = true;
    }
  });

  if (!hasSteps) {
    errors.push('Scenarios must contain test steps (Given/When/Then)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function generateTestData(dataType, count = 5) {
  const testData = [];

  switch (dataType.toLowerCase()) {
    case 'user':
    case 'users':
      for (let i = 0; i < count; i++) {
        testData.push({
          username: `testuser${i + 1}`,
          email: `testuser${i + 1}@example.com`,
          password: `SecurePass${i + 1}!`,
          firstName: `Test${i + 1}`,
          lastName: `User${i + 1}`
        });
      }
      break;

    case 'product':
    case 'products':
      const products = ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 'Headphones'];
      for (let i = 0; i < Math.min(count, products.length); i++) {
        testData.push({
          id: `PROD${i + 1}`,
          name: products[i],
          price: (Math.random() * 1000 + 50).toFixed(2),
          stock: Math.floor(Math.random() * 100) + 1
        });
      }
      break;

    case 'email':
    case 'emails':
      const domains = ['example.com', 'test.com', 'demo.org'];
      for (let i = 0; i < count; i++) {
        testData.push(`test${i + 1}@${domains[i % domains.length]}`);
      }
      break;

    default:
      for (let i = 0; i < count; i++) {
        testData.push({
          id: i + 1,
          value: `test_value_${i + 1}`
        });
      }
  }

  return testData;
}

// Create MCP server
const server = new Server(
  {
    name: 'nlp-gherkin-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'nlp_to_gherkin',
        description: 'Convert natural language test description to Gherkin DSL specification',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'Natural language description of the test (e.g., "test user creation")',
            },
            featureName: {
              type: 'string',
              description: 'Optional: Custom feature name',
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'validate_gherkin',
        description: 'Validate Gherkin DSL syntax and structure',
        inputSchema: {
          type: 'object',
          properties: {
            gherkin: {
              type: 'string',
              description: 'Gherkin specification to validate',
            },
          },
          required: ['gherkin'],
        },
      },
      {
        name: 'generate_test_data',
        description: 'Generate test data for scenarios',
        inputSchema: {
          type: 'object',
          properties: {
            dataType: {
              type: 'string',
              description: 'Type of test data (e.g., "user", "product", "email")',
            },
            count: {
              type: 'number',
              description: 'Number of test data items to generate',
              default: 5,
            },
          },
          required: ['dataType'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'nlp_to_gherkin': {
        const gherkin = nlpToGherkin(args.prompt, {
          featureName: args.featureName,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ gherkin }, null, 2),
            },
          ],
        };
      }

      case 'validate_gherkin': {
        const validation = validateGherkin(args.gherkin);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(validation, null, 2),
            },
          ],
        };
      }

      case 'generate_test_data': {
        const testData = generateTestData(args.dataType, args.count || 5);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ testData }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('NLP to Gherkin MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
