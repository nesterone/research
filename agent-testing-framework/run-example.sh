#!/bin/bash
# Quick example to demonstrate the framework

echo "Agent Testing Framework - Example Run"
echo "======================================"
echo ""

# Install dependencies
echo "Installing dependencies..."
pip install -q -r requirements.txt

# Run the comparison
echo ""
echo "Running comparison with example task..."
python3 executor.py \
  tasks/example-task.yaml \
  configs/baseline.yaml \
  configs/verbose-reasoning.yaml \
  configs/minimal-context.yaml

# Find the latest result
latest_result=$(ls -t results/*.json | head -1)

# Generate markdown report
echo ""
echo "Generating markdown report..."
python3 compare.py "$latest_result" --markdown results/example-report.md

echo ""
echo "✓ Done! Check results/example-report.md for the comparison report"
echo ""
echo "Workspace directories are preserved in workspaces/ for inspection"
