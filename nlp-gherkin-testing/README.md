# NLP to Gherkin Testing System

A novel approach to test automation that converts natural language prompts into Gherkin DSL specifications and executes them with Playwright.

## Overview

This project demonstrates a complete workflow for generating and executing automated tests from natural language descriptions:

```
Natural Language → MCP Server → Gherkin DSL → User Review → Playwright Tests → Execution Reports
```

### Key Features

- **Natural Language Input**: Describe tests in plain English (e.g., "test user creation")
- **MCP Integration**: Uses Model Context Protocol for AI-powered conversion
- **Gherkin Generation**: Produces standard BDD specifications
- **User Review Step**: Human-in-the-loop verification before execution
- **Playwright Execution**: Generates and runs browser automation tests
- **Comprehensive Reports**: HTML, JSON, and JUnit formats

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Natural Language Prompt                 │
│                   "test user creation"                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      MCP Server                              │
│  Tools:                                                      │
│  - nlp_to_gherkin                                           │
│  - validate_gherkin                                         │
│  - generate_test_data                                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Gherkin Specification                       │
│  Feature: User Creation                                     │
│    Scenario: Successful Registration                        │
│      Given I am on the registration page                    │
│      When I enter valid credentials                         │
│      Then I should see success message                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    User Review Step                          │
│  Developer reviews and approves specification                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Gherkin to Playwright Converter                 │
│  Converts steps to executable Playwright code                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Playwright Test Code                        │
│  test('Successful Registration', async ({ page }) => {      │
│    await page.goto('/registration');                        │
│    await page.fill('input[name="username"]', 'testuser');   │
│    ...                                                       │
│  });                                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Test Execution                             │
│  Runs tests in Chromium, Firefox, WebKit                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Execution Reports                           │
│  HTML, JSON, JUnit formats with detailed results             │
└─────────────────────────────────────────────────────────────┘
```

## Installation

```bash
# Clone or navigate to the project
cd nlp-gherkin-testing

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Usage

### Quick Demo

Run the demo to see all capabilities:

```bash
node src/cli.js demo
```

This will show conversions for multiple common test scenarios.

### Full Workflow

Run the complete end-to-end workflow:

```bash
node src/cli.js full-workflow "test user creation"
```

This will:
1. Generate Gherkin specification
2. Display it for review
3. Wait for your approval (press Enter)
4. Convert to Playwright tests
5. Execute tests
6. Show results

### Step-by-Step Workflow

#### 1. Generate Gherkin from Natural Language

```bash
node src/cli.js generate "test user creation" -o user-test.feature
```

Output (`user-test.feature`):
```gherkin
Feature: User Creation
  As a user
  I want to test user creation
  So that I can verify the functionality works correctly

  Scenario: Successful User Registration
    Given I am on the registration page
    When I enter a valid username "testuser123"
    And I enter a valid email "testuser@example.com"
    And I enter a valid password "SecurePass123!"
    And I click the register button
    Then I should see a success message
    And I should be redirected to the dashboard
```

#### 2. Convert Gherkin to Playwright

```bash
node src/cli.js convert user-test.feature -o user-test.spec.js
```

Output (`user-test.spec.js`):
```javascript
import { test, expect } from '@playwright/test';

test.describe('User Creation', () => {
  test('Successful User Registration', async ({ page }) => {
    await page.goto('/registration');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('.success')).toBeVisible();
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```

#### 3. Execute Tests

```bash
node src/cli.js execute user-test.spec.js --reporter html
```

or directly with Playwright:

```bash
npx playwright test user-test.spec.js
```

## MCP Server

The MCP server can be used independently for integration with other tools.

### Starting the MCP Server

```bash
node src/mcp-server.js
```

The server runs on stdio and provides three tools:

### Available MCP Tools

#### 1. nlp_to_gherkin

Converts natural language to Gherkin specification.

```json
{
  "name": "nlp_to_gherkin",
  "arguments": {
    "prompt": "test user creation",
    "featureName": "User Management" // optional
  }
}
```

#### 2. validate_gherkin

Validates Gherkin syntax and structure.

```json
{
  "name": "validate_gherkin",
  "arguments": {
    "gherkin": "Feature: Test\n  Scenario: Test\n    Given..."
  }
}
```

#### 3. generate_test_data

Generates test data for scenarios.

```json
{
  "name": "generate_test_data",
  "arguments": {
    "dataType": "user",
    "count": 5
  }
}
```

## Examples

The `examples/` directory contains:

- `example-prompt.txt`: Sample natural language input
- `example-output.feature`: Generated Gherkin specification
- `example-output.spec.js`: Generated Playwright test
- `demo-report.html`: Visual demo of the workflow (open in browser)

## Supported Test Patterns

The system currently recognizes these common patterns:

### User Registration/Creation
```
"test user creation"
"test user registration"
"test signup"
```

Generates scenarios for:
- Successful registration
- Invalid data validation
- Form field validation

### User Login
```
"test login"
"test sign in"
"test user authentication"
```

Generates scenarios for:
- Successful login
- Invalid credentials
- Session management

### Form Validation
```
"test form validation"
"test input validation"
```

Generates scenarios for:
- Required field validation
- Format validation
- Error message display

### Search Functionality
```
"test search"
"test search feature"
```

Generates scenarios for:
- Successful search
- Empty results
- Search results display

## Configuration

### Playwright Configuration

Edit `playwright.config.js` to customize:

```javascript
export default defineConfig({
  testDir: './generated-tests',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

### Base URL

Set the base URL for your application:

```bash
node src/cli.js full-workflow "test login" --base-url http://localhost:8080
```

## How It Works

### 1. Natural Language Processing

The MCP server analyzes the input prompt using pattern matching:

```javascript
if (prompt.includes('user') && prompt.includes('creation')) {
  // Generate user registration scenarios
}
```

In production, this could be enhanced with:
- LLM integration (Claude, GPT-4)
- Custom trained models
- Domain-specific vocabularies

### 2. Gherkin Generation

Structured scenarios are generated following BDD best practices:

```gherkin
Feature: [Extracted from prompt]
  As a [role]
  I want to [action]
  So that [benefit]

  Scenario: [Specific test case]
    Given [initial state]
    When [action]
    Then [expected outcome]
```

### 3. Playwright Conversion

Each Gherkin step is mapped to Playwright actions:

| Gherkin Step | Playwright Code |
|-------------|-----------------|
| `Given I am on the login page` | `await page.goto('/login')` |
| `When I enter my username` | `await page.fill('input[name="username"]', 'testuser')` |
| `Then I should see a success message` | `await expect(page.locator('.success')).toBeVisible()` |

### 4. Test Execution

Playwright runs the generated tests across multiple browsers with:
- Screenshots on failure
- Video recordings (optional)
- Trace files for debugging
- Parallel execution support

## Advantages of This Approach

### 1. Accessibility
- Non-technical stakeholders can describe tests
- Lower barrier to entry for test automation
- Natural language is more intuitive than code

### 2. Consistency
- Standardized Gherkin format ensures consistency
- Pattern-based generation creates uniform test structure
- Reduces human error in test writing

### 3. Review Step
- Human verification before execution
- Catches AI misunderstandings early
- Allows customization and refinement

### 4. MCP Integration
- Standardized protocol for AI tools
- Reusable across different contexts
- Easy integration with existing workflows

### 5. Separation of Concerns
- Test specification (Gherkin) separate from implementation (Playwright)
- Can swap execution frameworks without changing specs
- Clear documentation of test intent

## Limitations and Future Work

### Current Limitations

1. **Pattern Matching**: Currently uses simple pattern matching rather than full NLP
2. **Selector Generation**: Uses generic selectors that may not work for all applications
3. **Limited Coverage**: Supports common patterns but may miss edge cases
4. **No Context Awareness**: Doesn't analyze actual application structure

### Future Enhancements

1. **Advanced NLP**
   - Integration with Claude or GPT-4 for better understanding
   - Learning from corrections and feedback
   - Support for complex multi-step scenarios

2. **Intelligent Selector Generation**
   - Analyze actual page HTML to generate robust selectors
   - Support for accessibility attributes (ARIA, data-testid)
   - Visual element recognition

3. **Test Data Intelligence**
   - Parse API schemas for appropriate test data
   - Database fixture integration
   - Realistic data generation using AI

4. **Enhanced Workflow**
   - Visual editor for Gherkin specifications
   - Real-time preview of generated tests
   - Collaborative review and approval process

5. **CI/CD Integration**
   - GitHub Actions / GitLab CI templates
   - Automatic PR comments with test results
   - Integration with test management platforms (TestRail, Zephyr)

6. **Self-Healing Tests**
   - Automatic selector updates when UI changes
   - AI-powered test maintenance
   - Failure analysis and suggestions

## Use Cases

### 1. Rapid Prototyping
Quickly generate test suites for new features without writing code.

### 2. Documentation
Use generated Gherkin as living documentation of system behavior.

### 3. Non-Technical Stakeholders
Product managers and QA can describe test scenarios in natural language.

### 4. Test Coverage Analysis
Generate comprehensive test scenarios automatically to identify gaps.

### 5. Onboarding
New team members can contribute to testing without deep technical knowledge.

## Technical Stack

- **Node.js**: Runtime environment
- **MCP SDK**: Model Context Protocol implementation
- **Playwright**: Browser automation and testing
- **Commander.js**: CLI framework
- **Gherkin**: BDD specification language

## Project Structure

```
nlp-gherkin-testing/
├── src/
│   ├── mcp-server.js              # MCP server implementation
│   ├── gherkin-to-playwright.js   # Converter logic
│   └── cli.js                     # CLI orchestration
├── examples/
│   ├── example-prompt.txt         # Sample input
│   ├── example-output.feature     # Generated Gherkin
│   ├── example-output.spec.js     # Generated Playwright test
│   └── demo-report.html           # Visual demo
├── generated-tests/               # Output directory for generated tests
├── playwright-report/             # Test execution reports
├── playwright.config.js           # Playwright configuration
├── package.json                   # Dependencies and scripts
├── notes.md                       # Development notes
└── README.md                      # This file
```

## Contributing

This is a research project demonstrating the concept. Potential areas for contribution:

1. Additional test pattern recognition
2. Better NLP integration
3. Support for more frameworks (Cypress, Selenium)
4. Visual test builder
5. Cloud execution support

## Conclusion

This project demonstrates a promising approach to making test automation more accessible through natural language processing. By combining:

- Natural language input
- Gherkin standardization
- MCP protocol integration
- Playwright execution

We create a system that bridges the gap between human intent and automated testing.

The inclusion of a review step ensures that AI-generated tests meet quality standards while still providing significant time savings over manual test writing.

## License

MIT

## References

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Gherkin Language Reference](https://cucumber.io/docs/gherkin/reference/)
- [Playwright Documentation](https://playwright.dev/)
- [Behavior-Driven Development (BDD)](https://cucumber.io/docs/bdd/)
