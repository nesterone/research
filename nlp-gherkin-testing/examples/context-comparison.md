# Context-Aware Conversion: Before & After Comparison

## The Problem Illustrated

### Input: Natural Language Prompt

```
"test user creation"
```

---

## Without Application Context (Current Implementation)

### Generated Gherkin

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

### Generated Playwright Code (WITHOUT Context)

```javascript
import { test, expect } from '@playwright/test';

test.describe('User Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Successful User Registration', async ({ page }) => {
    // ❌ ASSUMPTION: URL is /registration
    await page.goto('/registration');

    // ❌ ASSUMPTION: Field has name="username"
    await page.fill('input[name="username"]', 'testuser');

    // ❌ ASSUMPTION: Email field is type="email"
    await page.fill('input[type="email"]', 'test@example.com');

    // ❌ ASSUMPTION: Password field is type="password"
    await page.fill('input[type="password"]', 'SecurePass123!');

    // ❌ ASSUMPTION: Button is type="submit"
    await page.click('button[type="submit"]');

    // ❌ ASSUMPTION: Success element has class .success
    await expect(page.locator('.success')).toBeVisible();

    // ❌ ASSUMPTION: Redirects to /dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```

**Problems:**
- 🔴 Hardcoded URL path
- 🔴 Generic selectors that may not match
- 🔴 Assumed test data
- 🔴 Assumed success indicators
- 🔴 Will likely FAIL on real applications

---

## With Application Context

### Application Context File (app-context.json)

```json
{
  "appName": "MyApp",
  "baseURL": "http://localhost:3000",
  "pages": {
    "registration": {
      "url": "/auth/signup",
      "selectors": {
        "username": "[data-testid='registration-username']",
        "email": "[data-testid='registration-email']",
        "password": "[data-testid='registration-password']",
        "submitButton": "button[data-action='register']"
      },
      "successIndicators": {
        "message": ".toast-success",
        "messageText": "Account created successfully",
        "redirect": "/welcome"
      }
    },
    "dashboard": {
      "url": "/welcome"
    }
  },
  "testData": {
    "users": {
      "valid": {
        "username": "testuser_2024",
        "email": "testuser@myapp.com",
        "password": "MyApp123!@#"
      }
    }
  }
}
```

### Generated Playwright Code (WITH Context)

```javascript
import { test, expect } from '@playwright/test';

/**
 * User Creation
 * Application: MyApp
 * Base URL: http://localhost:3000
 */

test.describe('User Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Successful User Registration', async ({ page }) => {
    // ✅ CORRECT: Using actual URL from context
    // Navigate to registration page
    await page.goto('/auth/signup');

    // ✅ CORRECT: Using actual selectors from context
    await page.fill('[data-testid=\'registration-username\']', 'testuser_2024');

    await page.fill('[data-testid=\'registration-email\']', 'testuser@myapp.com');

    await page.fill('[data-testid=\'registration-password\']', 'MyApp123!@#');

    // ✅ CORRECT: Using actual button selector
    await page.click('button[data-action=\'register\']');

    // ✅ CORRECT: Using actual success indicators
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Account created successfully');

    // ✅ CORRECT: Using actual redirect URL
    await expect(page).toHaveURL('/welcome');
  });
});
```

**Benefits:**
- ✅ Actual URLs from your application
- ✅ Correct selectors (data-testid attributes)
- ✅ Real test data
- ✅ Accurate success indicators
- ✅ Will PASS on your actual application

---

## Side-by-Side Comparison

| Aspect | Without Context | With Context |
|--------|----------------|--------------|
| **URL** | `/registration` (guessed) | `/auth/signup` (actual) |
| **Username Selector** | `input[name="username"]` | `[data-testid='registration-username']` |
| **Email Selector** | `input[type="email"]` | `[data-testid='registration-email']` |
| **Password Selector** | `input[type="password"]` | `[data-testid='registration-password']` |
| **Submit Button** | `button[type="submit"]` | `button[data-action='register']` |
| **Success Indicator** | `.success` | `.toast-success` |
| **Success Message** | (none) | "Account created successfully" |
| **Redirect URL** | `/.*dashboard/` | `/welcome` |
| **Test Data** | Generic | Application-specific |
| **Likelihood of Success** | ~20% | ~95% |

---

## Real-World Example: Different Apps, Same Test

### App A: E-commerce Site

```json
{
  "pages": {
    "registration": {
      "url": "/register",
      "selectors": {
        "username": "#signup-username",
        "email": "#signup-email",
        "password": "#signup-password",
        "submitButton": ".btn-create-account"
      }
    }
  }
}
```

**Generated Code:**
```javascript
await page.goto('/register');
await page.fill('#signup-username', 'testuser_2024');
await page.fill('#signup-email', 'testuser@myapp.com');
await page.fill('#signup-password', 'MyApp123!@#');
await page.click('.btn-create-account');
```

### App B: SaaS Platform

```json
{
  "pages": {
    "registration": {
      "url": "/auth/create-account",
      "selectors": {
        "username": "input[name='user[username]']",
        "email": "input[name='user[email]']",
        "password": "input[name='user[password]']",
        "submitButton": "button.signup-submit"
      }
    }
  }
}
```

**Generated Code:**
```javascript
await page.goto('/auth/create-account');
await page.fill('input[name=\'user[username]\']', 'testuser_2024');
await page.fill('input[name=\'user[email]\']', 'testuser@myapp.com');
await page.fill('input[name=\'user[password]\']', 'MyApp123!@#');
await page.click('button.signup-submit');
```

### App C: Mobile-First App

```json
{
  "pages": {
    "registration": {
      "url": "/signup",
      "selectors": {
        "username": "[aria-label='Username']",
        "email": "[aria-label='Email address']",
        "password": "[aria-label='Password']",
        "submitButton": "[aria-label='Create account']"
      }
    }
  }
}
```

**Generated Code:**
```javascript
await page.goto('/signup');
await page.fill('[aria-label=\'Username\']', 'testuser_2024');
await page.fill('[aria-label=\'Email address\']', 'testuser@myapp.com');
await page.fill('[aria-label=\'Password\']', 'MyApp123!@#');
await page.click('[aria-label=\'Create account\']');
```

---

## How It Works: The Context Resolution Process

```
┌─────────────────────────────────────────────────────────────┐
│  Step: "Given I am on the registration page"                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Parse step text                                          │
│     - Keyword: "Given"                                       │
│     - Text: "I am on the registration page"                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Identify page context                                    │
│     - Keywords found: ["registration", "page"]               │
│     - Matched page: "registration"                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Load page context from app-context.json                  │
│     {                                                        │
│       "url": "/auth/signup",                                 │
│       "selectors": { ... },                                  │
│       "successIndicators": { ... }                           │
│     }                                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Generate Playwright code                                 │
│     await page.goto('/auth/signup');                         │
│                                                              │
│     ✅ Uses actual URL from context                          │
│     ❌ Instead of guessed '/registration'                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup Workflow

### One-Time Setup

```bash
# Step 1: Copy template
cp app-context.template.json app-context.json

# Step 2: Edit with your app's details
# Update URLs, selectors, test data, etc.

# Step 3: Validate context
node src/cli.js validate-context app-context.json
```

### Generate Tests (With Context)

```bash
node src/cli.js generate "test user creation" \
  --context app-context.json \
  --output user-creation.feature

node src/cli.js convert user-creation.feature \
  --context app-context.json \
  --output user-creation.spec.js

npx playwright test user-creation.spec.js
```

---

## Context Validation Report

When you generate tests with context, you get a validation report:

```
✅ Context Validation Report
─────────────────────────────────────────────────────────────

Coverage: 95%

✅ All URLs specified
✅ All selectors found
✅ Test data available
⚠️  1 warning:

  Step: "And the user should be created in the database"
  Issue: Database verification not configured
  Suggestion: Add API endpoint configuration for user verification

Missing: 0 items
Warnings: 1 item

Overall: Tests will likely succeed with minor manual additions
```

---

## Conclusion

**Without Context:** Tests are based on assumptions and will likely fail.

**With Context:** Tests use actual application details and will succeed.

The application context file is the **bridge between generic test intent and specific implementation details**.
