#!/usr/bin/env python3
"""
Claude Code Conversation Analyzer
Extracts bash commands from Claude Code conversation history files.
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import argparse


class BashCommand:
    """Represents a bash command extracted from a conversation."""

    def __init__(self, command: str, description: str, timestamp: str, session_id: str):
        self.command = command
        self.description = description
        self.timestamp = timestamp
        self.session_id = session_id

    def to_dict(self) -> Dict:
        return {
            'command': self.command,
            'description': self.description,
            'timestamp': self.timestamp,
            'session_id': self.session_id
        }

    def __str__(self) -> str:
        return f"[{self.timestamp}] {self.command}"


class ConversationAnalyzer:
    """Analyzes Claude Code conversation files and extracts bash commands."""

    def __init__(self, claude_dir: Optional[Path] = None):
        """
        Initialize the analyzer.

        Args:
            claude_dir: Path to .claude directory. Defaults to ~/.claude
        """
        if claude_dir is None:
            claude_dir = Path.home() / '.claude'

        self.claude_dir = Path(claude_dir)
        self.projects_dir = self.claude_dir / 'projects'

        if not self.projects_dir.exists():
            raise FileNotFoundError(f"Projects directory not found: {self.projects_dir}")

    def find_conversation_files(self, project: Optional[str] = None) -> List[Path]:
        """
        Find all conversation JSONL files.

        Args:
            project: Specific project directory name. If None, searches all projects.

        Returns:
            List of paths to conversation files
        """
        files = []

        if project:
            project_dir = self.projects_dir / project
            if not project_dir.exists():
                raise FileNotFoundError(f"Project directory not found: {project_dir}")
            files.extend(project_dir.glob('*.jsonl'))
        else:
            # Find all JSONL files in all project directories
            for project_dir in self.projects_dir.iterdir():
                if project_dir.is_dir():
                    files.extend(project_dir.glob('*.jsonl'))

        return sorted(files, key=lambda p: p.stat().st_mtime, reverse=True)

    def extract_bash_commands(self, jsonl_file: Path) -> List[BashCommand]:
        """
        Extract bash commands from a conversation JSONL file.

        Args:
            jsonl_file: Path to the JSONL conversation file

        Returns:
            List of BashCommand objects
        """
        commands = []

        with open(jsonl_file, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line)

                    # Skip non-assistant messages
                    if data.get('type') != 'assistant':
                        continue

                    # Check if this message contains tool uses
                    message = data.get('message', {})
                    content = message.get('content', [])

                    if not isinstance(content, list):
                        continue

                    # Extract Bash tool uses
                    for item in content:
                        if isinstance(item, dict) and item.get('type') == 'tool_use':
                            if item.get('name') == 'Bash':
                                input_data = item.get('input', {})
                                command = input_data.get('command')
                                description = input_data.get('description', '')

                                if command:
                                    timestamp = data.get('timestamp', '')
                                    session_id = data.get('sessionId', '')

                                    commands.append(BashCommand(
                                        command=command,
                                        description=description,
                                        timestamp=timestamp,
                                        session_id=session_id
                                    ))

                except json.JSONDecodeError:
                    # Skip malformed lines
                    continue
                except Exception as e:
                    # Log but don't fail on individual line errors
                    print(f"Warning: Error processing line: {e}", file=sys.stderr)
                    continue

        return commands

    def analyze_all(self, project: Optional[str] = None) -> List[BashCommand]:
        """
        Analyze all conversation files and extract bash commands.

        Args:
            project: Specific project to analyze. If None, analyzes all projects.

        Returns:
            List of all BashCommand objects found
        """
        all_commands = []

        files = self.find_conversation_files(project)

        for file in files:
            commands = self.extract_bash_commands(file)
            all_commands.extend(commands)

        return all_commands


def format_for_zsh_history(commands: List[BashCommand]) -> str:
    """
    Format commands for zsh history.

    Zsh history format (extended):
    : <timestamp>:<duration>;<command>

    For simplicity, we'll use duration=0
    """
    lines = []

    for cmd in commands:
        # Parse ISO timestamp to Unix timestamp
        try:
            dt = datetime.fromisoformat(cmd.timestamp.replace('Z', '+00:00'))
            unix_ts = int(dt.timestamp())
        except:
            unix_ts = 0

        # Format: : timestamp:0;command
        lines.append(f": {unix_ts}:0;{cmd.command}")

    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(
        description='Analyze Claude Code conversations and extract bash commands'
    )
    parser.add_argument(
        '--project', '-p',
        help='Specific project directory to analyze (e.g., -home-user-research)'
    )
    parser.add_argument(
        '--output', '-o',
        help='Output file path (default: print to stdout)'
    )
    parser.add_argument(
        '--format', '-f',
        choices=['plain', 'json', 'zsh'],
        default='plain',
        help='Output format: plain (default), json, or zsh (for zsh history)'
    )
    parser.add_argument(
        '--claude-dir',
        help='Path to .claude directory (default: ~/.claude)'
    )
    parser.add_argument(
        '--list-projects',
        action='store_true',
        help='List available project directories and exit'
    )

    args = parser.parse_args()

    # Initialize analyzer
    try:
        claude_dir = Path(args.claude_dir) if args.claude_dir else None
        analyzer = ConversationAnalyzer(claude_dir)
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    # List projects if requested
    if args.list_projects:
        print("Available projects:")
        for project_dir in sorted(analyzer.projects_dir.iterdir()):
            if project_dir.is_dir():
                file_count = len(list(project_dir.glob('*.jsonl')))
                print(f"  {project_dir.name} ({file_count} conversation files)")
        sys.exit(0)

    # Extract commands
    try:
        commands = analyzer.analyze_all(args.project)
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    if not commands:
        print("No bash commands found in conversations.", file=sys.stderr)
        sys.exit(0)

    # Format output
    if args.format == 'json':
        output = json.dumps([cmd.to_dict() for cmd in commands], indent=2)
    elif args.format == 'zsh':
        output = format_for_zsh_history(commands)
    else:  # plain
        lines = []
        for cmd in commands:
            if cmd.description:
                lines.append(f"# {cmd.description}")
            lines.append(cmd.command)
            lines.append("")  # Empty line for readability
        output = '\n'.join(lines)

    # Write output
    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(f"Wrote {len(commands)} commands to {args.output}")
    else:
        print(output)


if __name__ == '__main__':
    main()
