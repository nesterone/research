# Agent Testing Framework

A framework for systematically testing and comparing Claude Code agents with different configurations on the same tasks.

## Overview

This framework allows you to:
- Define coding tasks in a standardized format
- Configure multiple agent variations (different prompts, skills, context settings)
- Execute the same task with different agent configurations
- Compare results across metrics like execution time, validation score, and efficiency
- Run comparisons locally or in GitHub Actions CI/CD

## Architecture

```
agent-testing-framework/
├── tasks/                  # Task definitions (YAML)
│   ├── example-task.yaml
│   └── refactor-function.yaml
├── configs/                # Agent configurations (YAML)
│   ├── baseline.yaml
│   ├── verbose-reasoning.yaml
│   └── minimal-context.yaml
├── results/                # Execution results (JSON + reports)
├── workspaces/             # Isolated execution workspaces
├── executor.py             # Main orchestration script
├── compare.py              # Results analysis tool
└── .github/workflows/      # GitHub Actions integration
    └── agent-comparison.yml
```

## Quick Start

### 1. Install Dependencies

```bash
pip install pyyaml
```

### 2. Run a Comparison

```bash
python executor.py tasks/example-task.yaml \
  configs/baseline.yaml \
  configs/verbose-reasoning.yaml \
  configs/minimal-context.yaml
```

### 3. Analyze Results

```bash
# Find the latest result file
latest_result=$(ls -t results/*.json | head -1)

# Generate comparison report
python compare.py "$latest_result" --markdown results/report.md
```

## Task Definition Format

Tasks are defined in YAML files with the following structure:

```yaml
name: "task-identifier"
description: "Human-readable task description"
category: "bug-fix|refactoring|feature|optimization"

# Initial code state
setup:
  files:
    - path: "example.py"
      content: |
        # Initial code here

# Task prompt for the agent
prompt: |
  Your task description here.
  Be specific about what needs to be done.

# Success criteria
validation:
  code_checks:
    - type: "contains"
      file: "example.py"
      pattern: "expected_pattern"
      description: "What this check validates"

  tests:
    - command: "python -c 'test command'"
      should_fail: false
      description: "Test description"

  quality:
    - metric: "lines_changed"
      max: 10
      description: "Keep changes minimal"

# Expected outcomes
expected:
  files_modified: ["example.py"]
  commits: 1
  execution_time_max: 120
```

## Agent Configuration Format

Agent configurations are defined in YAML:

```yaml
name: "config-identifier"
description: "Configuration description"

# Additional system prompts
system_prompt_additions: |
  Extra instructions for the agent.
  Prepended to the task prompt.

# Context configuration
context:
  max_file_size: 100000
  include_git_history: true
  include_dependencies: true

# Tool preferences
tools:
  prefer_task_agent: false
  max_parallel_tools: 3

# Behavior flags
behavior:
  verbose: false
  explain_reasoning: false
  ask_before_commit: false

# Resource limits
limits:
  max_tokens: 100000
  timeout_seconds: 300
```

## Execution Modes

### Simulate Mode (Default)

For testing the framework without API costs:

```bash
python executor.py task.yaml config1.yaml config2.yaml --mode simulate
```

The simulator makes realistic code changes based on the task and config.

### Real Mode

For actual agent execution (requires API integration):

```bash
export ANTHROPIC_API_KEY="your-api-key"
python executor.py task.yaml config1.yaml config2.yaml --mode real
```

## Comparison Metrics

The framework tracks and compares:

| Metric | Description |
|--------|-------------|
| **Validation Score** | Percentage of validation checks passed |
| **Execution Time** | Time taken to complete the task |
| **Efficiency** | Score per second (score_pct / time) |
| **Actions** | Number of tool calls/actions taken |
| **Files Modified** | Number of files changed |
| **Commits** | Number of commits made |
| **Success Rate** | Percentage of runs that passed all validations |

## Example Output

```
======================================================================
AGENT COMPARISON REPORT: fix-bug-in-calculator
======================================================================

SUMMARY
----------------------------------------------------------------------
Total runs:            3
Success rate:          66.7%
Avg execution time:    1.23s
Avg score:             83.3%

======================================================================
RANKINGS
----------------------------------------------------------------------
🏆 Best Score:        verbose-reasoning
                      2/2 (100.0%)

⚡ Fastest:           minimal-context
                      0.89s

💎 Most Efficient:    baseline
                      112.36 points/sec

======================================================================
DETAILED RESULTS
----------------------------------------------------------------------
Config               Time       Score        Pass     Actions
----------------------------------------------------------------------
verbose-reasoning      1.45s   2/2 (100.0%)  ✓        5
baseline               1.12s   2/2 (100.0%)  ✓        3
minimal-context        0.89s   1/2 ( 50.0%)  ✗        2
======================================================================
```

## GitHub Actions Integration

### Setup

1. Add your `ANTHROPIC_API_KEY` to repository secrets
2. Use the provided workflow: `.github/workflows/agent-comparison.yml`

### Trigger Manually

```bash
gh workflow run agent-comparison.yml \
  -f task=tasks/example-task.yaml \
  -f configs="configs/baseline.yaml configs/verbose-reasoning.yaml"
```

### Workflow Features

- Runs comparisons in isolated sandboxes
- Uploads results as artifacts
- Posts comparison reports to PRs (when applicable)
- Configurable via workflow inputs

## Use Cases

### 1. Prompt Engineering

Test different system prompt variations:

```yaml
# configs/concise.yaml
system_prompt_additions: "Be extremely concise. No explanations."

# configs/detailed.yaml
system_prompt_additions: "Explain every step in detail."
```

### 2. Context Optimization

Find the optimal context window size:

```yaml
# configs/full-context.yaml
context:
  max_file_size: 1000000
  include_git_history: true

# configs/minimal-context.yaml
context:
  max_file_size: 10000
  include_git_history: false
```

### 3. Tool Usage Strategies

Compare different tool usage patterns:

```yaml
# configs/parallel-tools.yaml
tools:
  max_parallel_tools: 5

# configs/sequential-tools.yaml
tools:
  max_parallel_tools: 1
```

### 4. Regression Testing

Ensure agent updates don't degrade performance:

```bash
# Before changes
python executor.py tasks/*.yaml configs/baseline.yaml

# After changes
python executor.py tasks/*.yaml configs/new-baseline.yaml

# Compare results
python compare.py results/before.json results/after.json
```

## Extending the Framework

### Adding New Tasks

1. Create a YAML file in `tasks/`
2. Define setup, prompt, validation, and expected outcomes
3. Run with your configs

### Adding New Validations

Edit `executor.py` to add custom validation types:

```python
def _validate_custom_check(self, workspace: Path, check: Dict[str, Any]) -> Dict[str, Any]:
    # Your validation logic
    return {'type': 'custom', 'passed': True, 'description': '...'}
```

### Custom Metrics

Edit `compare.py` to add custom analysis metrics:

```python
# In compare_runs()
for run in runs:
    custom_metric = calculate_custom_metric(run)
    analysis['custom'] = custom_metric
```

## Best Practices

### Task Design

- **Be Specific**: Clear, unambiguous task descriptions
- **Measurable Criteria**: Validation checks should be objective
- **Realistic Scenarios**: Use real-world coding problems
- **Incremental Complexity**: Start simple, add complexity gradually

### Configuration Design

- **Controlled Variables**: Change one thing at a time
- **Meaningful Names**: Descriptive config identifiers
- **Document Intent**: Explain what each config tests
- **Reproducible**: Avoid non-deterministic settings

### Analysis

- **Multiple Runs**: Run each config multiple times for statistical significance
- **Diverse Tasks**: Test across different task categories
- **Context Matters**: Consider task complexity when interpreting results
- **Qualitative Review**: Check workspace outputs, not just metrics

## Limitations

### Current Implementation

- **Simulation Mode**: Makes simple predetermined changes, not full agent execution
- **Real Mode**: Requires API integration (placeholder currently)
- **Validation**: Limited to pattern matching and command execution
- **Metrics**: Basic metrics only (no AST analysis, complexity metrics, etc.)

### Future Enhancements

- Full Claude API integration for real mode
- Advanced code quality metrics (cyclomatic complexity, test coverage)
- Multi-step task support (chains of dependent tasks)
- Interactive comparison dashboard
- A/B testing with statistical analysis
- Cost tracking (tokens, API calls)

## Contributing

To extend this framework:

1. Add your tasks to `tasks/`
2. Create custom configs in `configs/`
3. Enhance validation logic in `executor.py`
4. Add analysis features in `compare.py`
5. Document your additions

## License

This is a research/experimental framework. Use as you see fit.

## Example Tasks Included

### 1. `example-task.yaml` - Bug Fix
Fix a division by zero bug in a calculator.
- **Category**: Bug fix
- **Complexity**: Low
- **Purpose**: Test basic code modification and error handling

### 2. `refactor-function.yaml` - Code Refactoring
Eliminate code duplication across multiple functions.
- **Category**: Refactoring
- **Complexity**: Medium
- **Purpose**: Test code quality and abstraction skills

## Example Configs Included

### 1. `baseline.yaml`
Standard Claude Code agent with default settings.
- **Purpose**: Control group for comparisons

### 2. `verbose-reasoning.yaml`
Agent that explains reasoning at each step.
- **Purpose**: Test if explicit reasoning improves outcomes
- **Trade-off**: Slower but potentially more thorough

### 3. `minimal-context.yaml`
Agent with limited context and resource constraints.
- **Purpose**: Test efficiency under constraints
- **Trade-off**: Faster but may miss important context

## Getting Help

For issues or questions:
1. Check the `notes.md` file for development insights
2. Review example tasks and configs
3. Examine the simulation code in `executor.py` for expected behavior
4. Run with `--help` for command-line options

---

**Happy testing!** 🧪
