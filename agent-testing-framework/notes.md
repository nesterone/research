# Agent Testing Framework - Development Notes

## Goal
Build a framework to run the same task with multiple Claude Code agents using different configurations (prompts, skills, context) and compare their performance.

## Initial Setup
- Created project folder: agent-testing-framework
- Starting design phase

## Design Considerations
1. Need a way to specify tasks in a standard format
2. Need agent configuration profiles (prompts, skills, context variations)
3. Need execution environment (GitHub Actions sandbox)
4. Need result capture and comparison metrics
5. Should be extensible for adding new tasks and configurations

## Architecture Decisions

### Task Format (YAML)
- `setup`: Initial code state and files
- `prompt`: Task description for the agent
- `validation`: Success criteria (code checks, tests, quality metrics)
- `expected`: Expected outcomes

### Config Format (YAML)
- `system_prompt_additions`: Extra instructions
- `context`: Context limits and preferences
- `tools`: Tool usage preferences
- `behavior`: Verbosity and reasoning flags
- `limits`: Resource constraints

### Directory Structure
```
agent-testing-framework/
├── tasks/              # Task definitions
├── configs/            # Agent configurations
├── results/            # Execution results
├── examples/           # Example workspaces
├── executor.py         # Main orchestrator
└── compare.py          # Results analyzer
```

## Progress Log
- [2025-11-19] Initial project setup
- [2025-11-19] Created task and config formats
- [2025-11-19] Created 3 example configs: baseline, verbose-reasoning, minimal-context
- [2025-11-19] Built executor.py - main orchestration script
- [2025-11-19] Built compare.py - results analysis tool
- [2025-11-19] Tested framework with example task - works!
- [2025-11-19] Created GitHub Actions workflow for CI/CD integration
- [2025-11-19] Added second example task (refactoring)

## Key Learnings

### Simulation vs Real Mode
- Built simulator that makes realistic code changes
- Simulator useful for testing framework without API costs
- Real mode would integrate with Claude API (placeholder for now)

### Validation Challenges
- Test validation needs to be precise about expected behavior
- Example: "handle gracefully" is ambiguous - raise exception vs return special value?
- Good validation = specific, measurable criteria

### Metrics to Track
- Execution time
- Validation score (pass/fail checks)
- Actions taken by agent
- Files modified
- Commits made
- Efficiency (score per second)

### GitHub Actions Integration
- Can run comparisons automatically
- Upload artifacts (workspaces, results)
- Post reports to PRs
- Requires ANTHROPIC_API_KEY secret for real mode
