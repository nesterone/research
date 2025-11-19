# Development Notes

## Goal
Build a tool to analyze Claude Code conversations and extract bash commands for review or adding to zsh history.

## Investigation Log

### Understanding Claude Code Storage
- Found: Conversations are stored in `~/.claude/projects/`
- Format: JSONL (JSON Lines) - one JSON object per line
- Project-specific subdirectories (e.g., `-home-user-research`)
- Each conversation is a separate `.jsonl` file

### JSONL File Structure
- Each line is a JSON object representing a conversation event
- Bash commands are in assistant messages:
  - `message.content[].type` = "tool_use"
  - `message.content[].name` = "Bash"
  - `message.content[].input.command` = the actual bash command
  - `message.content[].input.description` = command description
- Also includes timestamps and other metadata

### Implementation
Created `analyze_conversations.py` with the following features:
- Parses JSONL conversation files
- Extracts bash commands with metadata
- Supports multiple output formats:
  - `plain`: Human-readable format with comments
  - `json`: Structured JSON with all metadata
  - `zsh`: Format compatible with zsh history (can be imported)
- Can filter by project or analyze all projects
- Includes timestamps and session IDs

### Testing
Tested successfully:
- List projects: Works correctly
- Extract commands in plain format: Works correctly
- Extract commands in JSON format: Works correctly
- Extract commands in zsh history format: Works correctly
- All timestamps are properly converted to Unix format for zsh

