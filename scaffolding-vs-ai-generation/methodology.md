# Methodology: Scaffolding vs Manual Generation Research

## Research Question
Is it more cost-effective to teach AI coding agents to use scaffolding tools rather than generating complete project structures from scratch?

## Frameworks Selected
1. **Next.js** - Most popular React framework with built-in scaffolding
2. **Vite + React** - Fast build tool with React template
3. **Angular** - Complete framework with comprehensive CLI

## Standard Project Requirements
Each experiment will create a "ToDo App" with:
- Task list display
- Add/delete/toggle task functionality
- API integration (mock or real backend)
- Basic styling (CSS/SCSS)
- TypeScript support
- Development and production builds configured

## Experimental Design

### Approach A: Manual Generation
1. AI generates all project files from scratch:
   - package.json with all dependencies
   - Configuration files (tsconfig, vite.config, next.config, etc.)
   - Source code structure
   - Build scripts
   - Development environment setup

2. Metrics captured:
   - All tokens used in prompts and completions
   - Time from start to working project
   - Number of iterations/corrections needed
   - Final file count and project structure

### Approach B: Scaffolding Tools
1. AI uses framework scaffolding command:
   - Next.js: `npx create-next-app@latest`
   - Vite: `npm create vite@latest`
   - Angular: `ng new`

2. AI then customizes the scaffolded project:
   - Adds ToDo app functionality
   - Configures as needed

3. Metrics captured:
   - Tokens used only for customization (not scaffolding command)
   - Time from scaffolding to completion
   - Number of iterations/corrections
   - Final additions/modifications to scaffolded structure

## Token Counting Method
- **Manual Generation**: Sum of all tokens used to generate project files
- **Scaffolding**: Sum of tokens used for customization only
  - Scaffolding commands generate standard output that doesn't consume AI tokens
  - Only customization and modifications count

## Simulation Approach
Since we can't run multiple AI agents simultaneously, we'll:
1. Estimate token usage based on typical file sizes and generation patterns
2. Create representative examples of both approaches
3. Measure actual file sizes and complexity
4. Calculate token estimates using standard conversion (1 token ≈ 4 characters)

## Cost Calculation
Using Claude Sonnet 4.5 pricing:
- Input: $3 per million tokens
- Output: $15 per million tokens

Formula: `Cost = (input_tokens * $3 + output_tokens * $15) / 1,000,000`

## Quality Assessment Criteria
1. **Completeness**: Does it meet all requirements?
2. **Best Practices**: Follows framework conventions?
3. **Maintainability**: Clean code structure?
4. **Performance**: Optimized configuration?
5. **Developer Experience**: Easy to understand and extend?

## Limitations
- This is a simulation/estimation study, not real multi-agent testing
- Token counts are estimated based on typical outputs
- Time measurements are approximate
- Real-world scenarios may vary based on specific requirements
