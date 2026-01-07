# Quick Start Guide

Get up and running in 5 minutes!

## Installation

### Option 1: Automated Setup (Recommended)

```bash
cd claude-conversation-vectordb
chmod +x setup.sh
./setup.sh
```

This will:
- Create a virtual environment
- Install all dependencies
- Create sample conversations
- Set up configuration

### Option 2: Manual Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create configuration
cp .env.example .env

# Create sample data
python test_basic.py
```

## First Steps

### 1. Import Sample Conversations

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Import the sample data
python cli.py import --file sample_conversations.json
```

You should see output like:
```
Processing 2 conversations...
Created 4 chunks from conversations
Generating embeddings and adding to database...
✓ Successfully added 4 chunks to vector store
```

### 2. Try a Search

```bash
python cli.py search "python best practices"
```

Output example:
```
Found 2 results for: 'python best practices'
================================================================================

1. Python Best Practices Discussion
   Created: 2024-01-15T10:30:00Z
   Relevance: 0.892
   ----------------------------------------------------------------------------
   User: What are some best practices for structuring a Python project?

   Assistant: Here are some Python project best practices:
   1. Use a clear directory structure...
```

### 3. Check Database Stats

```bash
python cli.py stats
```

## Using with Claude Code

### 1. Find Absolute Paths

```bash
# Get current directory (this is your project path)
pwd

# Example output: /home/user/projects/claude-conversation-vectordb
```

### 2. Update MCP Config

Edit your Claude Code configuration (usually `~/.config/claude/config.json`):

```json
{
  "mcpServers": {
    "claude-conversation-search": {
      "command": "python",
      "args": [
        "/home/user/projects/claude-conversation-vectordb/mcp_server.py"
      ],
      "env": {
        "CHROMA_DB_PATH": "/home/user/projects/claude-conversation-vectordb/chroma_db"
      }
    }
  }
}
```

**Important**: Replace `/home/user/projects/claude-conversation-vectordb` with YOUR actual path from `pwd`!

### 3. Restart Claude Code

Restart Claude Code to load the MCP server.

### 4. Test in Claude Code

Ask Claude:
```
Can you search my past conversations for Python best practices?
```

Claude will use the `search_past_conversations` tool and show you results!

## Importing Your Own Conversations

### Prepare Your Data

Create a JSON file with this format:

```json
[
  {
    "id": "unique_id",
    "created_at": "2024-01-15T10:30:00Z",
    "title": "Conversation Title",
    "messages": [
      {
        "role": "user",
        "content": "Your question...",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "role": "assistant",
        "content": "My response...",
        "timestamp": "2024-01-15T10:30:15Z"
      }
    ]
  }
]
```

### Import

```bash
python cli.py import --file your_conversations.json
```

### Or Import Multiple Files

Put all your JSON files in a folder and:

```bash
python cli.py import --directory ./my_conversations/
```

## Common Commands

```bash
# Activate environment (always do this first!)
source venv/bin/activate

# Import conversations
python cli.py import --file data.json
python cli.py import --directory ./exports/

# Search
python cli.py search "your query"
python cli.py search "query" --limit 10

# View stats
python cli.py stats

# Reset database (careful!)
python cli.py reset

# Create more sample data
python cli.py create-sample --output test_data.json
```

## Troubleshooting

### "No module named 'dotenv'"

Make sure you activated the virtual environment:
```bash
source venv/bin/activate
```

### "No such file or directory"

Use absolute paths in MCP config. Run `pwd` to get your full path.

### MCP Server Not Working in Claude Code

1. Check paths are absolute (not relative)
2. Restart Claude Code after config changes
3. Check Claude Code logs for errors
4. Test the server manually first:
   ```bash
   python mcp_server.py
   ```

### No Search Results

1. Make sure you imported data:
   ```bash
   python cli.py stats
   ```
2. Try broader search terms
3. Check database has content

## Next Steps

- Read the full [README.md](README.md) for advanced usage
- Import your own conversation history
- Try different search queries
- Explore MCP integration in Claude Code

## Getting Help

- Check [README.md](README.md) for detailed documentation
- Review error messages carefully
- Make sure all paths are absolute in MCP config
- Ensure virtual environment is activated

---

**Happy searching! 🔍**
