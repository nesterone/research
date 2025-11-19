# Quick Start Guide

Get started with the Agent Testing Framework in 3 minutes.

## TL;DR

```bash
# Install dependencies
pip install -r requirements.txt

# Run example comparison
./run-example.sh

# View results
cat results/example-report.md
```

## What Just Happened?

The framework:
1. ✓ Loaded a task: "Fix division by zero bug"
2. ✓ Ran 3 agents with different configs (baseline, verbose, minimal)
3. ✓ Each agent worked in an isolated workspace
4. ✓ Validated results against success criteria
5. ✓ Generated a comparison report

## Next Steps

### Create Your Own Task

```bash
cp tasks/example-task.yaml tasks/my-task.yaml
# Edit tasks/my-task.yaml with your task definition
```

### Create Custom Config

```bash
cp configs/baseline.yaml configs/my-config.yaml
# Edit configs/my-config.yaml with your agent settings
```

### Run Your Comparison

```bash
python3 executor.py tasks/my-task.yaml configs/my-config.yaml configs/baseline.yaml
```

### Analyze Results

```bash
# Terminal output
python3 compare.py results/your-result.json

# Markdown report
python3 compare.py results/your-result.json --markdown report.md

# JSON analysis
python3 compare.py results/your-result.json --json analysis.json
```

## Understanding the Results

### Key Metrics

- **Validation Score**: Did the agent complete the task correctly?
- **Execution Time**: How long did it take?
- **Efficiency**: Score per second (best = high score + low time)
- **Actions**: How many steps did the agent take?

### Rankings

- **🏆 Best Score**: Highest validation score
- **⚡ Fastest**: Shortest execution time
- **💎 Most Efficient**: Best score-to-time ratio

### What to Look For

✓ **All passing**: Great! All configs work for this task
✗ **Some failing**: Investigate which configs struggle and why
⏱️ **Time variations**: Some configs may be slower but more thorough
🎯 **Score vs Speed**: Find the right balance for your needs

## Common Use Cases

### Test a New Prompt

```yaml
# configs/test-new-prompt.yaml
name: "test-new-prompt"
system_prompt_additions: |
  Your experimental prompt here
```

Run: `python3 executor.py tasks/example-task.yaml configs/baseline.yaml configs/test-new-prompt.yaml`

### Find Optimal Context Size

```bash
# Create configs with different context limits
python3 executor.py tasks/complex-task.yaml \
  configs/full-context.yaml \
  configs/medium-context.yaml \
  configs/minimal-context.yaml
```

### Regression Testing

```bash
# Test before code changes
python3 executor.py tasks/*.yaml configs/baseline.yaml
mv results results-before

# Make your changes, then test again
python3 executor.py tasks/*.yaml configs/baseline.yaml
mv results results-after

# Compare
diff <(cat results-before/*.json) <(cat results-after/*.json)
```

## Tips

💡 **Start Simple**: Use example-task.yaml to learn the framework
💡 **One Variable**: Change one config setting at a time
💡 **Multiple Runs**: Run several times for consistent results
💡 **Inspect Workspaces**: Check `workspaces/` to see actual code changes
💡 **Read Output**: The agent's actions are logged - review them!

## Troubleshooting

**Q: All tests fail**
A: Check task validation criteria - they might be too strict or ambiguous

**Q: Identical results for all configs**
A: In simulate mode, basic changes are identical. Use more complex tasks or real mode.

**Q: Can't find results file**
A: Results are in `results/` directory with timestamp in filename

**Q: Workspaces keep growing**
A: Clean up with `rm -rf workspaces/` - they're temporary

## Ready for More?

📖 Read the full [README.md](README.md) for detailed documentation
🔧 Check [notes.md](notes.md) for development insights
🚀 Try [tasks/refactor-function.yaml](tasks/refactor-function.yaml) for a more complex example

---

**Now go build your own comparisons!** 🎯
