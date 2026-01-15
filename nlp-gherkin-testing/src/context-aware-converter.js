/**
 * Context-Aware Gherkin to Playwright Converter
 * Uses application context file to generate accurate, app-specific test code
 */

import fs from 'fs/promises';
import { GherkinToPlaywright } from './gherkin-to-playwright.js';

export class ContextAwareConverter extends GherkinToPlaywright {
  constructor(config = {}) {
    super(config);
    this.appContext = config.appContext || null;
  }

  /**
   * Load application context from file
   */
  static async loadContext(contextFile) {
    try {
      const content = await fs.readFile(contextFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load context file: ${error.message}`);
    }
  }

  /**
   * Set application context
   */
  setContext(context) {
    this.appContext = context;
  }

  /**
   * Find page context based on keywords in step text
   */
  findPageContext(stepText) {
    if (!this.appContext) return null;

    const text = stepText.toLowerCase();
    const { pages } = this.appContext;

    // Match page by keywords
    if (text.includes('registration') || text.includes('signup') || text.includes('register')) {
      return { name: 'registration', ...pages.registration };
    }
    if (text.includes('login') || text.includes('sign in')) {
      return { name: 'login', ...pages.login };
    }
    if (text.includes('dashboard')) {
      return { name: 'dashboard', ...pages.dashboard };
    }
    if (text.includes('search')) {
      return { name: 'search', ...pages.search };
    }

    return null;
  }

  /**
   * Get selector for a field
   */
  getSelector(fieldName, pageContext) {
    if (!pageContext || !pageContext.selectors) return null;

    const fieldLower = fieldName.toLowerCase();

    // Direct match
    if (pageContext.selectors[fieldName]) {
      return pageContext.selectors[fieldName];
    }

    // Fuzzy match
    for (const [key, selector] of Object.entries(pageContext.selectors)) {
      if (key.toLowerCase().includes(fieldLower) || fieldLower.includes(key.toLowerCase())) {
        return selector;
      }
    }

    return null;
  }

  /**
   * Get test data for a field
   */
  getTestData(dataType, fieldName = 'valid') {
    if (!this.appContext || !this.appContext.testData) return null;

    const data = this.appContext.testData[dataType];
    if (!data) return null;

    if (typeof data === 'object' && data[fieldName]) {
      return data[fieldName];
    }

    return data;
  }

  /**
   * Convert a Gherkin step to Playwright code with context awareness
   */
  stepToPlaywrightWithContext(step, currentPage = null) {
    const text = step.text.toLowerCase();
    const indent = '    ';

    // Try to find page context
    const pageContext = currentPage || this.findPageContext(text);

    // ============ NAVIGATION STEPS ============
    if (text.includes('on the') && text.includes('page')) {
      if (pageContext && pageContext.url) {
        return `${indent}// Navigate to ${pageContext.name || 'page'}\n${indent}await page.goto('${pageContext.url}');`;
      }
      // Fallback to placeholder
      const pageMatch = text.match(/on the (.+?) page/);
      const pageName = pageMatch ? pageMatch[1].replace(' ', '-') : 'UNKNOWN';
      return `${indent}// TODO: Specify URL for ${pageName} page\n${indent}await page.goto('/<${pageName.toUpperCase()}_URL>');`;
    }

    // ============ INPUT/FILL STEPS ============
    if (text.includes('enter') || text.includes('fill')) {
      // Determine field type
      let fieldType = null;
      let selector = null;
      let testData = null;

      if (text.includes('username')) {
        fieldType = 'username';
      } else if (text.includes('email')) {
        fieldType = 'email';
      } else if (text.includes('password') && !text.includes('confirm')) {
        fieldType = 'password';
      } else if (text.includes('confirm') && text.includes('password')) {
        fieldType = 'confirmPassword';
      } else if (text.includes('search term') || text.includes('search query')) {
        fieldType = 'searchInput';
      }

      if (fieldType && pageContext) {
        selector = this.getSelector(fieldType, pageContext);

        // Get test data
        if (fieldType === 'searchInput') {
          const searchData = this.getTestData('searchTerms');
          testData = searchData?.valid || 'test query';
        } else {
          const userData = this.getTestData('users', 'valid');
          testData = userData?.[fieldType] || `test${fieldType}`;
        }
      }

      if (selector && testData) {
        return `${indent}await page.fill('${selector}', '${testData}');`;
      }

      // Fallback
      return `${indent}// TODO: Specify selector and test data\n${indent}await page.fill('<SELECTOR>', '<TEST_DATA>');`;
    }

    // Handle "enter valid credentials" or "enter valid user details"
    if ((text.includes('valid') || text.includes('correct')) &&
        (text.includes('credentials') || text.includes('details') || text.includes('user'))) {

      if (pageContext && pageContext.selectors) {
        const userData = this.getTestData('users', 'valid');
        const lines = [];

        if (pageContext.selectors.username && userData?.username) {
          lines.push(`${indent}await page.fill('${pageContext.selectors.username}', '${userData.username}');`);
        }
        if (pageContext.selectors.email && userData?.email) {
          lines.push(`${indent}await page.fill('${pageContext.selectors.email}', '${userData.email}');`);
        }
        if (pageContext.selectors.password && userData?.password) {
          lines.push(`${indent}await page.fill('${pageContext.selectors.password}', '${userData.password}');`);
        }

        if (lines.length > 0) {
          return lines.join('\n');
        }
      }

      return `${indent}// TODO: Fill form with valid user data\n${indent}await page.fill('<USERNAME_SELECTOR>', '<USERNAME>');`;
    }

    // Handle invalid credentials
    if (text.includes('invalid') && text.includes('credentials')) {
      if (pageContext && pageContext.selectors) {
        const userData = this.getTestData('users', 'invalid');
        const lines = [];

        if (pageContext.selectors.username && userData?.username) {
          lines.push(`${indent}await page.fill('${pageContext.selectors.username}', '${userData.username}');`);
        }
        if (pageContext.selectors.password && userData?.password) {
          lines.push(`${indent}await page.fill('${pageContext.selectors.password}', '${userData.password}');`);
        }

        if (lines.length > 0) {
          return lines.join('\n');
        }
      }
    }

    // ============ CLICK/ACTION STEPS ============
    if (text.includes('click') || text.includes('submit')) {
      let selector = null;

      if ((text.includes('login') || text.includes('sign in')) && pageContext?.name === 'login') {
        selector = pageContext.selectors.submitButton;
      } else if ((text.includes('register') || text.includes('signup')) && pageContext?.name === 'registration') {
        selector = pageContext.selectors.submitButton;
      } else if (text.includes('search') && pageContext?.name === 'search') {
        selector = pageContext.selectors.searchButton;
      } else if (text.includes('submit') && pageContext?.selectors?.submitButton) {
        selector = pageContext.selectors.submitButton;
      }

      if (selector) {
        return `${indent}await page.click('${selector}');`;
      }

      // Fallback to common selectors
      if (this.appContext?.commonSelectors?.forms?.submitButton) {
        selector = this.appContext.commonSelectors.forms.submitButton;
        return `${indent}await page.click('${selector}');`;
      }

      return `${indent}// TODO: Specify button selector\n${indent}await page.click('<BUTTON_SELECTOR>');`;
    }

    // ============ ASSERTION STEPS ============
    if (text.includes('should see')) {
      if (text.includes('success message') || text.includes('success')) {
        let selector = null;

        if (pageContext?.successIndicators?.message) {
          selector = pageContext.successIndicators.message;
        } else if (this.appContext?.commonSelectors?.notifications?.success) {
          selector = this.appContext.commonSelectors.notifications.success;
        }

        if (selector) {
          let code = `${indent}await expect(page.locator('${selector}')).toBeVisible();`;

          // Add text assertion if available
          if (pageContext?.successIndicators?.messageText) {
            code += `\n${indent}await expect(page.locator('${selector}')).toContainText('${pageContext.successIndicators.messageText}');`;
          }

          return code;
        }
      }

      if (text.includes('error') || text.includes('validation')) {
        let selector = null;

        if (pageContext?.errorIndicators?.message) {
          selector = pageContext.errorIndicators.message;
        } else if (pageContext?.errorIndicators?.validationErrors) {
          selector = pageContext.errorIndicators.validationErrors;
        } else if (this.appContext?.commonSelectors?.notifications?.error) {
          selector = this.appContext.commonSelectors.notifications.error;
        }

        if (selector) {
          return `${indent}await expect(page.locator('${selector}')).toBeVisible();`;
        }
      }

      if (text.includes('username') && pageContext?.name === 'dashboard') {
        const selector = pageContext.selectors?.username || pageContext.selectors?.userMenu;
        if (selector) {
          return `${indent}await expect(page.locator('${selector}')).toBeVisible();`;
        }
      }

      if (text.includes('search results')) {
        if (pageContext?.name === 'search' && pageContext.selectors?.resultsContainer) {
          return `${indent}await expect(page.locator('${pageContext.selectors.resultsContainer}')).toBeVisible();`;
        }
      }
    }

    // Handle redirect assertions
    if (text.includes('redirected to') || text.includes('redirect')) {
      let targetURL = null;

      if (text.includes('dashboard')) {
        const dashboardPage = this.appContext?.pages?.dashboard;
        targetURL = dashboardPage?.url || '/dashboard';
      }

      if (targetURL) {
        return `${indent}await expect(page).toHaveURL('${targetURL}');`;
      }

      // Check if current page context has success redirect
      if (pageContext?.successIndicators?.redirect) {
        return `${indent}await expect(page).toHaveURL('${pageContext.successIndicators.redirect}');`;
      }
    }

    // ============ DATABASE/API STEPS ============
    if (text.includes('database') || text.includes('should be created')) {
      return `${indent}// TODO: Add API/Database verification\n${indent}// const response = await apiClient.getUser(username);\n${indent}// expect(response.status).toBe(200);`;
    }

    // ============ FALLBACK ============
    return `${indent}// TODO: Implement step: ${step.text}\n${indent}// Selector needed: <SPECIFY_SELECTOR>`;
  }

  /**
   * Convert full Gherkin to Playwright with context
   */
  convertWithContext(gherkinText) {
    const parsed = this.parseGherkin(gherkinText);

    let code = `import { test, expect } from '@playwright/test';\n\n`;
    code += `/**\n`;
    code += ` * ${parsed.feature}\n`;
    if (this.appContext) {
      code += ` * Application: ${this.appContext.appName}\n`;
      code += ` * Base URL: ${this.appContext.baseURL}\n`;
    }
    if (parsed.description.length > 0) {
      code += ` * ${parsed.description.join('\n * ')}\n`;
    }
    code += ` */\n\n`;

    code += `test.describe('${parsed.feature}', () => {\n`;
    code += `  test.beforeEach(async ({ page }) => {\n`;
    code += `    // Setup: Navigate to base URL\n`;
    code += `    await page.goto('${this.config.baseURL}');\n`;
    code += `  });\n\n`;

    parsed.scenarios.forEach((scenario, idx) => {
      code += `  test('${scenario.name}', async ({ page }) => {\n`;

      // Try to determine the page context for this scenario
      let currentPage = null;
      const scenarioText = scenario.name.toLowerCase();

      if (scenarioText.includes('registration') || scenarioText.includes('register')) {
        currentPage = this.appContext?.pages?.registration ?
          { name: 'registration', ...this.appContext.pages.registration } : null;
      } else if (scenarioText.includes('login')) {
        currentPage = this.appContext?.pages?.login ?
          { name: 'login', ...this.appContext.pages.login } : null;
      }

      scenario.steps.forEach(step => {
        const playwrightCode = this.stepToPlaywrightWithContext(step, currentPage);
        code += playwrightCode + '\n';

        // Update current page context based on navigation
        if (step.text.toLowerCase().includes('on the')) {
          currentPage = this.findPageContext(step.text);
        }
      });

      code += `  });\n`;
      if (idx < parsed.scenarios.length - 1) {
        code += '\n';
      }
    });

    code += `});\n`;

    return code;
  }

  /**
   * Validate that all necessary context is available
   */
  validateContext(gherkinText) {
    const parsed = this.parseGherkin(gherkinText);
    const missing = [];
    const warnings = [];

    parsed.scenarios.forEach(scenario => {
      scenario.steps.forEach(step => {
        const text = step.text.toLowerCase();

        // Check for navigation without URL
        if (text.includes('on the') && text.includes('page')) {
          const pageContext = this.findPageContext(text);
          if (!pageContext || !pageContext.url) {
            const pageMatch = text.match(/on the (.+?) page/);
            const pageName = pageMatch ? pageMatch[1] : 'unknown';
            missing.push({
              step: step.text,
              issue: `URL not specified for ${pageName} page`,
              suggestion: `Add "${pageName}" page configuration with URL in app-context.json`
            });
          }
        }

        // Check for field interactions without selectors
        if (text.includes('enter') || text.includes('fill')) {
          const pageContext = this.findPageContext(text);
          if (!pageContext) {
            warnings.push({
              step: step.text,
              issue: 'Page context not found',
              suggestion: 'Using generic selectors as fallback'
            });
          }
        }
      });
    });

    return {
      isValid: missing.length === 0,
      missing,
      warnings,
      coverage: missing.length === 0 && warnings.length === 0 ? 100 :
                Math.round((1 - (missing.length + warnings.length * 0.5) / (parsed.scenarios.length * 5)) * 100)
    };
  }
}

export default ContextAwareConverter;
