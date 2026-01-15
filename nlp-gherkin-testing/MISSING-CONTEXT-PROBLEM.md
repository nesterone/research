# The Missing Context Problem

## The Issue

When a user provides: `"test user creation"`

The system generates:
```gherkin
Given I am on the registration page
```

And Playwright code:
```javascript
await page.goto('/registration');
```

**But the user never specified:**
- The URL path (`/registration`)
- Field names (`input[name="username"]`)
- Button text ("Register")
- Success indicators (`.success` class)

## Current Behavior: Assumptions & Problems

### What the System Does Now

The current implementation makes **hardcoded assumptions**:

```javascript
// From gherkin-to-playwright.js
if (text.includes('registration page')) {
  return `await page.goto('/registration');`;  // ❌ Assumed URL
}

if (text.includes('username')) {
  return `await page.fill('input[name="username"]', 'testuser');`;  // ❌ Assumed selector
}
```

### Why This Fails

1. **Different applications have different URLs**
   - App A: `/registration`
   - App B: `/signup`
   - App C: `/auth/register`

2. **Different field selectors**
   - App A: `input[name="username"]`
   - App B: `#username-field`
   - App C: `[data-testid="username-input"]`

3. **Different UI patterns**
   - Some apps use modals, not separate pages
   - Some use multi-step wizards
   - Some use different success indicators

## Solutions: Multiple Approaches

### Approach 1: Application Context File (RECOMMENDED)

Provide application-specific configuration that the system uses for generation.

#### Implementation

**Step 1: Create app-context.json**

```json
{
  "appName": "My Application",
  "baseURL": "http://localhost:3000",
  "pages": {
    "registration": {
      "url": "/auth/signup",
      "selectors": {
        "username": "[data-testid='username-input']",
        "email": "[data-testid='email-input']",
        "password": "[data-testid='password-input']",
        "submitButton": "button[type='submit']"
      },
      "successIndicators": {
        "message": ".toast-success",
        "redirect": "/dashboard"
      }
    },
    "login": {
      "url": "/auth/login",
      "selectors": {
        "username": "#login-username",
        "password": "#login-password",
        "submitButton": ".btn-login"
      },
      "successIndicators": {
        "redirect": "/dashboard",
        "element": "[data-testid='user-menu']"
      }
    }
  },
  "testData": {
    "users": {
      "valid": {
        "username": "testuser",
        "email": "test@example.com",
        "password": "SecurePass123!"
      }
    }
  }
}
```

**Step 2: Enhanced MCP Tool**

```javascript
{
  "name": "nlp_to_gherkin_with_context",
  "arguments": {
    "prompt": "test user creation",
    "appContext": {
      "pages": { /* ... from app-context.json ... */ }
    }
  }
}
```

**Step 3: Context-Aware Conversion**

```javascript
function stepToPlaywrightWithContext(step, appContext) {
  const text = step.text.toLowerCase();

  if (text.includes('registration page')) {
    const registrationPage = appContext.pages.registration;
    return `await page.goto('${registrationPage.url}');`;
  }

  if (text.includes('username')) {
    const selector = appContext.pages.registration.selectors.username;
    const testData = appContext.testData.users.valid.username;
    return `await page.fill('${selector}', '${testData}');`;
  }

  // ... etc
}
```

**Benefits:**
- ✅ Reusable across many tests
- ✅ Version controlled with code
- ✅ Easy to maintain and update
- ✅ No runtime interaction needed

**Drawbacks:**
- ❌ Requires upfront configuration
- ❌ Needs updates when UI changes

---

### Approach 2: Interactive Prompting

Ask users for missing information during generation.

#### Implementation

```javascript
async function generateWithPrompts(naturalLanguage) {
  console.log('🤔 I need some information about your application:\n');

  const registrationURL = await askUser('What is the registration page URL? (e.g., /signup)');
  const usernameSelector = await askUser('What is the selector for the username field? (e.g., #username)');
  const emailSelector = await askUser('What is the selector for the email field?');
  // ... etc

  return generateGherkinWithContext(naturalLanguage, {
    registrationURL,
    usernameSelector,
    emailSelector
  });
}
```

**Benefits:**
- ✅ Works without upfront configuration
- ✅ User provides exact details
- ✅ Good for one-off tests

**Drawbacks:**
- ❌ Tedious for multiple tests
- ❌ Not suitable for automation
- ❌ Context not reused

---

### Approach 3: Application Discovery (AI-Powered)

Analyze the running application to extract context.

#### Implementation

```javascript
async function discoverApplication(baseURL) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Visit the app
  await page.goto(baseURL);

  // Use AI to analyze the page
  const screenshot = await page.screenshot();
  const html = await page.content();

  // Send to LLM for analysis
  const analysis = await analyzePage({
    screenshot,
    html,
    prompt: 'Identify registration/login pages and their selectors'
  });

  return {
    pages: analysis.pages,
    selectors: analysis.selectors
  };
}
```

**Benefits:**
- ✅ Automatic discovery
- ✅ No manual configuration
- ✅ Always up-to-date

**Drawbacks:**
- ❌ Requires running application
- ❌ Complex implementation
- ❌ May miss auth-protected pages

---

### Approach 4: Gherkin with Placeholders + Manual Fill

Generate Gherkin with placeholders that users fill in.

#### Implementation

**Generated Gherkin:**
```gherkin
Feature: User Creation

  Scenario: Successful Registration
    Given I am on the registration page at <REGISTRATION_URL>
    When I fill "<USERNAME_SELECTOR>" with "testuser"
    And I fill "<EMAIL_SELECTOR>" with "test@example.com"
    And I fill "<PASSWORD_SELECTOR>" with "SecurePass123!"
    And I click "<SUBMIT_BUTTON_SELECTOR>"
    Then I should see "<SUCCESS_INDICATOR>"
    And I should be redirected to "<SUCCESS_URL>"
```

**User fills in placeholders:**
```gherkin
Feature: User Creation

  Scenario: Successful Registration
    Given I am on the registration page at "/auth/signup"
    When I fill "[data-testid='username']" with "testuser"
    And I fill "[data-testid='email']" with "test@example.com"
    And I fill "[data-testid='password']" with "SecurePass123!"
    And I click "button[type='submit']"
    Then I should see ".toast-success"
    And I should be redirected to "/dashboard"
```

**Benefits:**
- ✅ Clear what needs to be specified
- ✅ User has full control
- ✅ Documents actual selectors

**Drawbacks:**
- ❌ Requires manual work
- ❌ Error-prone
- ❌ Not fully automated

---

### Approach 5: Hybrid: Templates + LLM + Context

Combine multiple approaches for best results.

#### Implementation

```javascript
async function generateTest(prompt, options = {}) {
  // 1. Try to load existing app context
  let context = await loadAppContext(options.contextFile);

  // 2. If missing info, try discovery
  if (!context && options.appURL) {
    context = await discoverApplication(options.appURL);
  }

  // 3. If still missing, use LLM to generate with placeholders
  if (!context) {
    context = await generateContextWithLLM(prompt);
  }

  // 4. Generate Gherkin with available context
  const gherkin = generateGherkinWithContext(prompt, context);

  // 5. Validate and highlight missing info
  const validation = validateContext(gherkin, context);

  if (!validation.complete) {
    console.log('⚠️  Missing information:');
    validation.missing.forEach(item => {
      console.log(`  - ${item.description}: ${item.placeholder}`);
    });
  }

  return { gherkin, context, validation };
}
```

**Benefits:**
- ✅ Flexible and adaptive
- ✅ Falls back gracefully
- ✅ Best user experience

**Drawbacks:**
- ❌ Complex to implement
- ❌ Multiple failure points

---

## Recommended Workflow

### For Real-World Use

1. **First Time Setup** (One-time)
   ```bash
   # Analyze your application
   node src/cli.js discover http://localhost:3000 --output app-context.json

   # Or create manually
   cp app-context.template.json app-context.json
   # Edit with your app's details
   ```

2. **Generate Tests** (With Context)
   ```bash
   node src/cli.js generate "test user creation" --context app-context.json
   ```

3. **Review Generated Gherkin**
   - Verify URLs are correct
   - Verify selectors match your app
   - Edit if needed

4. **Convert & Execute**
   ```bash
   node src/cli.js convert test.feature --context app-context.json
   npx playwright test
   ```

### What Gets Specified Where

| Information | Source | When Provided |
|------------|--------|---------------|
| Test intent | User prompt | Initial request |
| URLs | app-context.json | Setup time |
| Selectors | app-context.json | Setup time |
| Test data | app-context.json or generated | Setup or runtime |
| Test flow | Generated from prompt | Runtime |
| Expected outcomes | Generated from prompt | Runtime |

## Comparison of Approaches

| Approach | Automation | Accuracy | Setup Effort | Maintenance |
|----------|-----------|----------|--------------|-------------|
| Context File | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Interactive | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Discovery | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Placeholders | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Hybrid | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## Conclusion

The current implementation makes assumptions that don't work in practice. The **recommended solution** is:

1. **Use Application Context Files** as the primary approach
2. **Add placeholder generation** as fallback
3. **Include discovery tool** for initial context creation
4. **Provide clear feedback** when information is missing

This gives users control while maintaining automation benefits.
