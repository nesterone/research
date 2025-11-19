# Claude Code Conversation Analyzer

A proof-of-concept tool for analyzing Claude Code conversation history and extracting bash commands that were run during conversations.

## Overview

This tool parses Claude Code's local conversation history files (stored as JSONL) and extracts all bash commands that were executed. You can then review these commands, search through them, or even add them to your shell history.

## Features

- Extract bash commands from Claude Code conversations
- Multiple output formats:
  - **Plain text**: Human-readable format with command descriptions
  - **JSON**: Structured format with full metadata
  - **Zsh history**: Format compatible with zsh history file
- Filter by specific project or analyze all conversations
- Includes timestamps and session IDs
- Preserves command descriptions for context

## Requirements

- Python 3.6+
- Claude Code installed with conversation history in `~/.claude/projects/`

## Installation

1. Copy the script to a convenient location:
```bash
cp analyze_conversations.py ~/bin/  # or any directory in your PATH
chmod +x ~/bin/analyze_conversations.py
```

Alternatively, run it directly from this directory:
```bash
python3 analyze_conversations.py [options]
```

## Usage

### Basic Usage

List available projects:
```bash
python3 analyze_conversations.py --list-projects
```

Extract all commands in plain format:
```bash
python3 analyze_conversations.py
```

Extract commands from a specific project:
```bash
python3 analyze_conversations.py --project your-project-name
```

### Output Formats

**Plain text format** (default - human-readable with descriptions):
```bash
python3 analyze_conversations.py --format plain
```

Example output:
```
# Create project folder
mkdir -p my-project

# List directory contents
ls -la

# Run tests
npm test
```

**JSON format** (structured data with all metadata):
```bash
python3 analyze_conversations.py --format json
```

Example output:
```json
[
  {
    "command": "mkdir -p my-project",
    "description": "Create project folder",
    "timestamp": "2025-11-19T13:44:37.360Z",
    "session_id": "925879b0-e76d-44d1-bfa8-15d8def0148f"
  }
]
```

**Zsh history format** (importable into zsh history):
```bash
python3 analyze_conversations.py --format zsh
```

Example output:
```
: 1763559877:0;mkdir -p my-project
: 1763559893:0;ls -la
: 1763560014:0;npm test
```

### Save to File

Save output to a file:
```bash
python3 analyze_conversations.py --output commands.txt
python3 analyze_conversations.py --format json --output commands.json
python3 analyze_conversations.py --format zsh --output commands_history.txt
```

### Advanced Options

Specify a custom Claude directory:
```bash
python3 analyze_conversations.py --claude-dir /path/to/.claude
```

## Using with Shell History

### Adding to Zsh History

1. Extract commands in zsh format:
```bash
python3 analyze_conversations.py --format zsh --output /tmp/claude_commands.txt
```

2. Review the commands:
```bash
cat /tmp/claude_commands.txt
```

3. Append to your zsh history (BACKUP YOUR HISTORY FIRST):
```bash
cp ~/.zsh_history ~/.zsh_history.backup
cat /tmp/claude_commands.txt >> ~/.zsh_history
```

4. Reload history in your current shell:
```bash
fc -R
```

### Searching Commands

Use standard command-line tools to search through extracted commands:

```bash
# Search for git commands
python3 analyze_conversations.py | grep git

# Search for npm commands
python3 analyze_conversations.py | grep npm

# Use jq to filter JSON output
python3 analyze_conversations.py --format json | jq '.[] | select(.command | contains("docker"))'

# Find commands from a specific date
python3 analyze_conversations.py --format json | jq '.[] | select(.timestamp | startswith("2025-11-19"))'
```

### Using with fzf (fuzzy finder)

Search through commands interactively:

```bash
# Interactive search
python3 analyze_conversations.py | fzf

# Execute a selected command
python3 analyze_conversations.py --format plain | \
  grep -v '^#' | \
  grep -v '^$' | \
  fzf | bash
```

## Command-Line Options

```
usage: analyze_conversations.py [-h] [--project PROJECT] [--output OUTPUT]
                                [--format {plain,json,zsh}]
                                [--claude-dir CLAUDE_DIR]
                                [--list-projects]

options:
  -h, --help            Show help message and exit
  --project PROJECT, -p PROJECT
                        Specific project directory to analyze
  --output OUTPUT, -o OUTPUT
                        Output file path (default: print to stdout)
  --format {plain,json,zsh}, -f {plain,json,zsh}
                        Output format (default: plain)
  --claude-dir CLAUDE_DIR
                        Path to .claude directory (default: ~/.claude)
  --list-projects       List available project directories and exit
```

## How It Works

Claude Code stores conversation history in `~/.claude/projects/` as JSONL (JSON Lines) files. Each line in these files represents a conversation event.

The analyzer:
1. Scans the projects directory for `.jsonl` files
2. Parses each line as JSON
3. Looks for assistant messages containing Bash tool uses
4. Extracts the command, description, timestamp, and session ID
5. Formats the output according to your chosen format

## Troubleshooting

**No commands found:**
- Make sure you have conversation history in `~/.claude/projects/`
- Verify that Claude Code has been used to run bash commands
- Try running `--list-projects` to see available projects

**Permission errors:**
- Ensure you have read access to `~/.claude/projects/`
- The files may be owned by root; you might need to adjust permissions

**Project name with dashes:**
- If a project name starts with a dash (e.g., `-home-user-research`), use quotes or omit the `--project` flag to analyze all projects

## Examples

### Review Today's Commands
```bash
# Extract commands in JSON format and filter by today's date
python3 analyze_conversations.py --format json | \
  jq '.[] | select(.timestamp | startswith("2025-11-19"))'
```

### Create a Command Reference
```bash
# Save all commands with descriptions for reference
python3 analyze_conversations.py --format plain --output ~/claude_commands_reference.txt
```

### Extract Only the Commands
```bash
# Get just the commands without descriptions
python3 analyze_conversations.py --format plain | grep -v '^#' | grep -v '^$'
```

## Limitations

- Only extracts Bash commands (not other tool uses)
- Requires Claude Code conversation files to be in the standard location
- Does not capture command output, only the commands themselves
- Timestamps use the tool invocation time, not command execution time

## License

This is a proof-of-concept tool provided as-is for personal use.

## Contributing

This is a proof-of-concept project. Feel free to extend it with additional features like:
- Support for other shells (bash, fish, etc.)
- Filtering by date range
- Excluding certain types of commands
- Extracting other tool uses beyond Bash
- Statistical analysis of command usage
