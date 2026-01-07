/**
 * Gherkin to Playwright Converter
 * Converts Gherkin specifications into executable Playwright test code
 */

export class GherkinToPlaywright {
  constructor(config = {}) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:3000',
      timeout: config.timeout || 30000,
      ...config
    };
  }

  /**
   * Parse Gherkin text into structured format
   */
  parseGherkin(gherkinText) {
    const lines = gherkinText.split('\n');
    const result = {
      feature: null,
      description: [],
      scenarios: []
    };

    let currentScenario = null;
    let inDescription = false;

    lines.forEach(line => {
      const trimmed = line.trim();

      if (trimmed.startsWith('Feature:')) {
        result.feature = trimmed.substring(8).trim();
        inDescription = true;
      } else if (trimmed.startsWith('Scenario:')) {
        if (currentScenario) {
          result.scenarios.push(currentScenario);
        }
        currentScenario = {
          name: trimmed.substring(9).trim(),
          steps: []
        };
        inDescription = false;
      } else if (trimmed.startsWith('Given ') || trimmed.startsWith('When ') ||
                 trimmed.startsWith('Then ') || trimmed.startsWith('And ') ||
                 trimmed.startsWith('But ')) {
        if (currentScenario) {
          const match = trimmed.match(/^(Given|When|Then|And|But)\s+(.+)$/);
          if (match) {
            currentScenario.steps.push({
              keyword: match[1],
              text: match[2]
            });
          }
        }
      } else if (inDescription && trimmed && !trimmed.startsWith('As a') &&
                 !trimmed.startsWith('I want') && !trimmed.startsWith('So that')) {
        result.description.push(trimmed);
      }
    });

    if (currentScenario) {
      result.scenarios.push(currentScenario);
    }

    return result;
  }

  /**
   * Convert a Gherkin step to Playwright code
   */
  stepToPlaywright(step) {
    const text = step.text.toLowerCase();
    const indent = '    ';

    // Navigation steps
    if (text.includes('on the') && text.includes('page')) {
      const pageMatch = text.match(/on the (.+?) page/);
      if (pageMatch) {
        const page = pageMatch[1].replace(' ', '-');
        return `${indent}await page.goto('/${page}');`;
      }
    }

    // Input/form steps
    if (text.includes('enter') || text.includes('fill')) {
      if (text.includes('username')) {
        return `${indent}await page.fill('input[name="username"], input[id="username"]', 'testuser');`;
      }
      if (text.includes('email')) {
        return `${indent}await page.fill('input[type="email"], input[name="email"]', 'test@example.com');`;
      }
      if (text.includes('password')) {
        return `${indent}await page.fill('input[type="password"]', 'SecurePass123!');`;
      }
      if (text.includes('credentials')) {
        return `${indent}await page.fill('input[name="username"]', 'testuser');\n${indent}await page.fill('input[type="password"]', 'SecurePass123!');`;
      }
      if (text.includes('user details') || text.includes('valid')) {
        return `${indent}await page.fill('input[name="username"]', 'testuser');\n${indent}await page.fill('input[name="email"]', 'test@example.com');\n${indent}await page.fill('input[name="password"]', 'SecurePass123!');`;
      }
      if (text.includes('search term')) {
        return `${indent}await page.fill('input[type="search"], input[name="search"]', 'test query');`;
      }
    }

    // Click/submit steps
    if (text.includes('click') || text.includes('submit')) {
      if (text.includes('login') || text.includes('sign in')) {
        return `${indent}await page.click('button[type="submit"], button:has-text("Login")');`;
      }
      if (text.includes('registration') || text.includes('signup')) {
        return `${indent}await page.click('button[type="submit"], button:has-text("Register")');`;
      }
      if (text.includes('search')) {
        return `${indent}await page.click('button[type="submit"], button:has-text("Search")');`;
      }
      if (text.includes('button') || text.includes('submit')) {
        return `${indent}await page.click('button[type="submit"]');`;
      }
    }

    // Assertion steps
    if (text.includes('should see')) {
      if (text.includes('success message')) {
        return `${indent}await expect(page.locator('.success, .alert-success')).toBeVisible();\n${indent}await expect(page.locator('.success, .alert-success')).toContainText('success');`;
      }
      if (text.includes('error') || text.includes('validation')) {
        return `${indent}await expect(page.locator('.error, .alert-error, .invalid-feedback')).toBeVisible();`;
      }
      if (text.includes('username')) {
        return `${indent}await expect(page.locator('.username, .user-name, [data-testid="username"]')).toBeVisible();`;
      }
      if (text.includes('search results')) {
        return `${indent}await expect(page.locator('.search-results, .results')).toBeVisible();`;
      }
    }

    if (text.includes('redirected to')) {
      if (text.includes('dashboard')) {
        return `${indent}await expect(page).toHaveURL(/.*dashboard/);`;
      }
    }

    if (text.includes('should be created') || text.includes('database')) {
      return `${indent}// Verify in database (requires API/DB verification)`;
    }

    if (text.includes('should not be submitted')) {
      return `${indent}await expect(page).not.toHaveURL(/.*success/);`;
    }

    if (text.includes('displayed in a list')) {
      return `${indent}await expect(page.locator('ul, ol, .list')).toBeVisible();`;
    }

    // Default fallback
    return `${indent}// TODO: Implement step: ${step.text}`;
  }

  /**
   * Convert full Gherkin to Playwright test file
   */
  convert(gherkinText) {
    const parsed = this.parseGherkin(gherkinText);

    let code = `import { test, expect } from '@playwright/test';\n\n`;
    code += `/**\n`;
    code += ` * ${parsed.feature}\n`;
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

      scenario.steps.forEach(step => {
        const playwrightCode = this.stepToPlaywright(step);
        code += playwrightCode + '\n';
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
   * Generate step definitions for custom implementations
   */
  generateStepDefinitions(gherkinText) {
    const parsed = this.parseGherkin(gherkinText);
    const uniqueSteps = new Set();

    parsed.scenarios.forEach(scenario => {
      scenario.steps.forEach(step => {
        uniqueSteps.add(step.text);
      });
    });

    let defs = `/**\n * Step Definitions\n * Implement these functions to customize test behavior\n */\n\n`;

    Array.from(uniqueSteps).forEach(stepText => {
      const funcName = stepText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

      defs += `export async function ${funcName}(page) {\n`;
      defs += `  // TODO: Implement step: "${stepText}"\n`;
      defs += `  throw new Error('Not implemented');\n`;
      defs += `}\n\n`;
    });

    return defs;
  }
}

export default GherkinToPlaywright;
