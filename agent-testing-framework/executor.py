#!/usr/bin/env python3
"""
Agent Testing Framework - Executor
Runs the same task with multiple agent configurations and captures results.
"""

import os
import sys
import yaml
import json
import shutil
import subprocess
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional


class TaskExecutor:
    """Executes tasks with different agent configurations."""

    def __init__(self, workspace_root: str = "./workspaces"):
        self.workspace_root = Path(workspace_root)
        self.workspace_root.mkdir(exist_ok=True)

    def load_task(self, task_file: str) -> Dict[str, Any]:
        """Load task definition from YAML file."""
        with open(task_file, 'r') as f:
            return yaml.safe_load(f)

    def load_config(self, config_file: str) -> Dict[str, Any]:
        """Load agent configuration from YAML file."""
        with open(config_file, 'r') as f:
            return yaml.safe_load(f)

    def setup_workspace(self, task: Dict[str, Any], run_id: str) -> Path:
        """Create isolated workspace with initial files."""
        workspace = self.workspace_root / run_id
        workspace.mkdir(parents=True, exist_ok=True)

        # Create initial files from task setup
        if 'setup' in task and 'files' in task['setup']:
            for file_def in task['setup']['files']:
                file_path = workspace / file_def['path']
                file_path.parent.mkdir(parents=True, exist_ok=True)
                file_path.write_text(file_def['content'])

        # Initialize git repo
        subprocess.run(['git', 'init'], cwd=workspace, capture_output=True)
        subprocess.run(['git', 'config', 'user.name', 'Test Agent'], cwd=workspace, capture_output=True)
        subprocess.run(['git', 'config', 'user.email', 'test@example.com'], cwd=workspace, capture_output=True)
        subprocess.run(['git', 'add', '.'], cwd=workspace, capture_output=True)
        subprocess.run(['git', 'commit', '-m', 'Initial setup'], cwd=workspace, capture_output=True)

        return workspace

    def build_agent_prompt(self, task: Dict[str, Any], config: Dict[str, Any]) -> str:
        """Construct the full prompt for the agent."""
        prompt_parts = []

        # Add config-specific system prompt additions
        if config.get('system_prompt_additions'):
            prompt_parts.append(config['system_prompt_additions'])
            prompt_parts.append('')

        # Add main task prompt
        prompt_parts.append(task['prompt'])

        return '\n'.join(prompt_parts)

    def execute_agent(
        self,
        workspace: Path,
        prompt: str,
        config: Dict[str, Any],
        mode: str = 'simulate'
    ) -> Dict[str, Any]:
        """
        Execute the agent with given configuration.

        Args:
            workspace: Working directory
            prompt: Task prompt
            config: Agent configuration
            mode: 'simulate' or 'real' (API calls)

        Returns:
            Execution results dictionary
        """
        start_time = time.time()

        if mode == 'simulate':
            # Simulation mode - make a simple fix for demo
            result = self._simulate_agent_execution(workspace, prompt, config)
        elif mode == 'real':
            # Real mode - would call Claude API
            result = self._real_agent_execution(workspace, prompt, config)
        else:
            raise ValueError(f"Unknown mode: {mode}")

        execution_time = time.time() - start_time
        result['execution_time'] = execution_time

        return result

    def _simulate_agent_execution(
        self,
        workspace: Path,
        prompt: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Simulate agent execution for testing."""
        # This is a mock - in real usage, this would call Claude API
        # For now, let's make a simple change to demonstrate

        result = {
            'mode': 'simulated',
            'output': f"Simulated execution with config: {config['name']}\n",
            'actions': [],
            'files_modified': [],
            'commits': []
        }

        # Simulate reading the file
        calc_file = workspace / 'calculator.py'
        if calc_file.exists():
            content = calc_file.read_text()
            result['actions'].append('Read calculator.py')

            # Simulate making a fix based on config behavior
            if config.get('behavior', {}).get('verbose'):
                result['output'] += "Analyzing the code... Found division function without zero check.\n"

            # Apply a fix
            new_content = content.replace(
                'def divide(a, b):\n    return a / b  # BUG: No zero check',
                '''def divide(a, b):
    if b == 0:
        raise ZeroDivisionError("Cannot divide by zero")
    return a / b'''
            )
            calc_file.write_text(new_content)
            result['actions'].append('Modified calculator.py')
            result['files_modified'].append('calculator.py')

            # Commit the change
            subprocess.run(['git', 'add', 'calculator.py'], cwd=workspace, capture_output=True)
            commit_result = subprocess.run(
                ['git', 'commit', '-m', 'Fix division by zero bug'],
                cwd=workspace,
                capture_output=True,
                text=True
            )
            if commit_result.returncode == 0:
                result['actions'].append('Committed changes')
                result['commits'].append('Fix division by zero bug')

        return result

    def _real_agent_execution(
        self,
        workspace: Path,
        prompt: str,
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute real agent via API (placeholder)."""
        # This would integrate with actual Claude API
        # For GitHub Actions, this would use the Claude Code agent directly
        raise NotImplementedError("Real agent execution requires API integration")

    def validate_result(
        self,
        workspace: Path,
        task: Dict[str, Any],
        result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate execution result against task criteria."""
        validation = {
            'passed': True,
            'checks': [],
            'score': 0,
            'max_score': 0
        }

        if 'validation' not in task:
            return validation

        # Code checks
        if 'code_checks' in task['validation']:
            for check in task['validation']['code_checks']:
                check_result = self._validate_code_check(workspace, check)
                validation['checks'].append(check_result)
                validation['max_score'] += 1
                if check_result['passed']:
                    validation['score'] += 1
                else:
                    validation['passed'] = False

        # Test execution
        if 'tests' in task['validation']:
            for test in task['validation']['tests']:
                test_result = self._validate_test(workspace, test)
                validation['checks'].append(test_result)
                validation['max_score'] += 1
                if test_result['passed']:
                    validation['score'] += 1
                else:
                    validation['passed'] = False

        return validation

    def _validate_code_check(self, workspace: Path, check: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a code-level check."""
        result = {
            'type': 'code_check',
            'description': check.get('description', 'Code check'),
            'passed': False
        }

        file_path = workspace / check['file']
        if not file_path.exists():
            result['error'] = f"File not found: {check['file']}"
            return result

        content = file_path.read_text()

        if check['type'] == 'contains':
            import re
            pattern = check['pattern']
            if re.search(pattern, content):
                result['passed'] = True
            else:
                result['error'] = f"Pattern not found: {pattern}"

        return result

    def _validate_test(self, workspace: Path, test: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a test execution."""
        result = {
            'type': 'test',
            'description': test.get('description', 'Test execution'),
            'passed': False
        }

        try:
            test_result = subprocess.run(
                test['command'],
                shell=True,
                cwd=workspace,
                capture_output=True,
                text=True,
                timeout=30
            )

            should_fail = test.get('should_fail', False)
            if should_fail:
                result['passed'] = test_result.returncode != 0
            else:
                result['passed'] = test_result.returncode == 0

            result['stdout'] = test_result.stdout
            result['stderr'] = test_result.stderr

        except subprocess.TimeoutExpired:
            result['error'] = 'Test timed out'
        except Exception as e:
            result['error'] = str(e)

        return result

    def run_comparison(
        self,
        task_file: str,
        config_files: List[str],
        mode: str = 'simulate'
    ) -> Dict[str, Any]:
        """
        Run the same task with multiple configurations and compare.

        Args:
            task_file: Path to task YAML
            config_files: List of paths to config YAMLs
            mode: Execution mode ('simulate' or 'real')

        Returns:
            Comparison results
        """
        task = self.load_task(task_file)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        comparison = {
            'task': task['name'],
            'timestamp': timestamp,
            'mode': mode,
            'runs': []
        }

        print(f"\n{'='*60}")
        print(f"Running task: {task['name']}")
        print(f"Description: {task['description']}")
        print(f"{'='*60}\n")

        for config_file in config_files:
            config = self.load_config(config_file)
            run_id = f"{task['name']}_{config['name']}_{timestamp}"

            print(f"\n--- Running with config: {config['name']} ---")

            # Setup workspace
            workspace = self.setup_workspace(task, run_id)

            # Build prompt
            prompt = self.build_agent_prompt(task, config)

            # Execute agent
            exec_result = self.execute_agent(workspace, prompt, config, mode)

            # Validate result
            validation = self.validate_result(workspace, task, exec_result)

            # Collect metrics
            run_result = {
                'config': config['name'],
                'workspace': str(workspace),
                'execution_time': exec_result['execution_time'],
                'validation': validation,
                'actions': exec_result.get('actions', []),
                'files_modified': exec_result.get('files_modified', []),
                'commits': exec_result.get('commits', []),
                'output': exec_result.get('output', '')
            }

            comparison['runs'].append(run_result)

            # Print summary
            print(f"  Execution time: {exec_result['execution_time']:.2f}s")
            print(f"  Validation: {'✓ PASSED' if validation['passed'] else '✗ FAILED'}")
            print(f"  Score: {validation['score']}/{validation['max_score']}")
            print(f"  Actions: {len(exec_result.get('actions', []))}")

        # Save results
        results_file = Path('results') / f"{task['name']}_{timestamp}.json"
        results_file.parent.mkdir(exist_ok=True)
        with open(results_file, 'w') as f:
            json.dump(comparison, f, indent=2)

        print(f"\n{'='*60}")
        print(f"Results saved to: {results_file}")
        print(f"{'='*60}\n")

        return comparison


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='Agent Testing Framework Executor')
    parser.add_argument('task', help='Path to task YAML file')
    parser.add_argument('configs', nargs='+', help='Paths to config YAML files')
    parser.add_argument('--mode', choices=['simulate', 'real'], default='simulate',
                       help='Execution mode (default: simulate)')
    parser.add_argument('--workspace', default='./workspaces',
                       help='Workspace root directory')

    args = parser.parse_args()

    executor = TaskExecutor(workspace_root=args.workspace)
    executor.run_comparison(args.task, args.configs, mode=args.mode)


if __name__ == '__main__':
    main()
