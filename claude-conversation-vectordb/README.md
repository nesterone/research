# Claude Conversation Vector Database + MCP Server

A complete solution for indexing your Claude conversations and making them searchable through Claude Code using semantic search.

## Overview

This project provides:

1. **Conversation Importer** - Import conversations from JSON exports
2. **Vector Database** - Store conversations with semantic embeddings using ChromaDB
3. **MCP Server** - Expose conversation search to Claude Code via Model Context Protocol
4. **CLI Tool** - Manage and query your conversation database from the command line

## Features

- 🔍 **Semantic Search**: Find relevant conversations based on meaning, not just keywords
- 🧠 **Local Vector Database**: All data stored locally using ChromaDB
- 🚀 **Fast Embeddings**: Uses sentence-transformers for efficient local embeddings
- 🔌 **Claude Code Integration**: Seamlessly search from within Claude Code via MCP
- 📦 **Easy Import**: Support for JSON conversation exports
- 💻 **CLI Interface**: Manage your database from the command line

## Installation

### 1. Clone or Download

```bash
cd claude-conversation-vectordb
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- `anthropic` - Claude API client
- `chromadb` - Vector database
- `sentence-transformers` - Local embedding model
- `mcp` - Model Context Protocol SDK
- Other utilities

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work fine):

```env
CHROMA_DB_PATH=./chroma_db
COLLECTION_NAME=claude_conversations
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

## Quick Start

### 1. Create Sample Data (for testing)

```bash
python cli.py create-sample
```

This creates `sample_conversations.json` with example conversations.

### 2. Import Conversations

```bash
# Import from a single file
python cli.py import --file sample_conversations.json

# Or import from a directory of JSON files
python cli.py import --directory ./my_conversations/
```

### 3. Test Search

```bash
python cli.py search "How do I manage dependencies in Python?"
```

### 4. View Statistics

```bash
python cli.py stats
```

## Importing Your Conversations

### Supported Format

The importer expects JSON files with this structure:

```json
[
  {
    "id": "conversation_id",
    "created_at": "2024-01-15T10:30:00Z",
    "title": "Conversation Title",
    "messages": [
      {
        "role": "user",
        "content": "Message text...",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "role": "assistant",
        "content": "Response text...",
        "timestamp": "2024-01-15T10:30:15Z"
      }
    ]
  }
]
```

### Exporting from Claude.ai

Currently, you'll need to manually export your conversations:

1. Export conversations from Claude.ai (feature availability varies)
2. Or manually create JSON files from conversation history
3. Save as JSON files in the format above

### Alternative: Copy-Paste Method

If direct export isn't available, you can:

1. Copy conversation text from Claude.ai
2. Use a helper script to convert to JSON format
3. Import using the CLI tool

## Claude Code Integration (MCP Server)

### 1. Configure MCP Server

Add to your Claude Code configuration file (usually `~/.config/claude/config.json` or similar):

```json
{
  "mcpServers": {
    "claude-conversation-search": {
      "command": "python",
      "args": [
        "/absolute/path/to/claude-conversation-vectordb/mcp_server.py"
      ],
      "env": {
        "CHROMA_DB_PATH": "/absolute/path/to/chroma_db",
        "COLLECTION_NAME": "claude_conversations",
        "EMBEDDING_MODEL": "all-MiniLM-L6-v2"
      }
    }
  }
}
```

**Important**: Replace `/absolute/path/to/` with actual absolute paths on your system!

### 2. Restart Claude Code

After adding the configuration, restart Claude Code to load the MCP server.

### 3. Use in Claude Code

The MCP server provides these tools:

#### `search_past_conversations`

Search your conversation history semantically:

```
Can you search my past conversations for information about Python project structure?
```

Claude Code will automatically use the MCP tool to search your indexed conversations.

#### `get_conversation_stats`

Get database statistics:

```
What's in my conversation database?
```

### Example Usage in Claude Code

```
User: I'm working on a Python project. Search my past conversations
      for any discussions about project organization and best practices.

Claude: [Uses search_past_conversations tool]

        Found 3 relevant conversations:

        1. "Python Best Practices Discussion" (2024-01-15)
           Relevance: 0.892

           User: What are some best practices for structuring a Python project?

           Assistant: Here are some Python project best practices:
           1. Use a clear directory structure...
           [etc]
```

## CLI Reference

### Import Commands

```bash
# Import from file
python cli.py import --file conversations.json

# Import from directory
python cli.py import --directory ./exports/

# Custom database location
python cli.py --db-path ./my_db import --file data.json
```

### Search Commands

```bash
# Basic search
python cli.py search "your query here"

# Limit results
python cli.py search "python best practices" --limit 10

# Custom database
python cli.py --db-path ./my_db search "query"
```

### Management Commands

```bash
# View statistics
python cli.py stats

# Reset database (careful!)
python cli.py reset --yes

# Create sample data
python cli.py create-sample
```

## How It Works

### 1. Conversation Chunking

Conversations are split into overlapping chunks (default: 3 messages with 1 message overlap). This:
- Preserves conversation context
- Allows finding specific exchanges
- Improves search relevance

### 2. Embedding Generation

Each chunk is converted to a vector embedding using `sentence-transformers/all-MiniLM-L6-v2`:
- Fast inference (runs locally)
- Good quality semantic representations
- No external API calls needed

### 3. Vector Storage

Embeddings stored in ChromaDB:
- Persistent local storage
- Fast similarity search
- No cloud dependencies

### 4. Semantic Search

When you search:
1. Query is converted to embedding
2. ChromaDB finds most similar chunks (cosine similarity)
3. Results ranked by relevance
4. Full conversation context returned

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Claude Code                         │
│                                                          │
│  Uses MCP tools to search conversation history          │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ MCP Protocol
                     │
┌────────────────────▼────────────────────────────────────┐
│                  MCP Server                             │
│              (mcp_server.py)                            │
│                                                          │
│  Exposes:                                               │
│  - search_past_conversations                            │
│  - get_conversation_stats                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────┐
│              Vector Store                               │
│            (vector_store.py)                            │
│                                                          │
│  - Chunks conversations                                 │
│  - Generates embeddings (sentence-transformers)         │
│  - Stores in ChromaDB                                   │
│  - Performs semantic search                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │
┌────────────────────▼────────────────────────────────────┐
│                  ChromaDB                               │
│              (Persistent Storage)                       │
│                                                          │
│  Stores vector embeddings + metadata                    │
└─────────────────────────────────────────────────────────┘
```

## Configuration Options

### Environment Variables

- `CHROMA_DB_PATH`: Database storage location (default: `./chroma_db`)
- `COLLECTION_NAME`: Collection name (default: `claude_conversations`)
- `EMBEDDING_MODEL`: Model to use (default: `all-MiniLM-L6-v2`)

### Chunking Parameters

Edit in `vector_store.py`:
- `chunk_size`: Messages per chunk (default: 3)
- `overlap`: Overlapping messages (default: 1)

### Search Parameters

- `n_results`: Number of results to return
- `filter_dict`: Metadata filters (conversation_id, date range, etc.)

## Troubleshooting

### MCP Server Not Appearing in Claude Code

1. Check that paths in MCP config are absolute paths
2. Ensure Python dependencies are installed
3. Check Claude Code logs for errors
4. Verify the Python command is in your PATH

### Import Errors

1. Check JSON format matches expected structure
2. Ensure file paths are correct
3. Look for encoding issues (use UTF-8)

### Search Returns No Results

1. Verify database has data: `python cli.py stats`
2. Try broader search queries
3. Check if embeddings were generated properly

### Performance Issues

1. Reduce chunk_size if processing is slow
2. Use smaller embedding model (though quality may suffer)
3. Increase batch_size for faster imports

## Advanced Usage

### Custom Embedding Models

You can use any sentence-transformers model:

```python
# In .env
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
```

Popular options:
- `all-MiniLM-L6-v2` (default, fast, good quality)
- `all-mpnet-base-v2` (slower, better quality)
- `paraphrase-multilingual-MiniLM-L12-v2` (multilingual)

### Metadata Filtering

Search with filters:

```python
from vector_store import ConversationVectorStore

store = ConversationVectorStore()

# Search only specific conversation
results = store.search(
    "python best practices",
    filter_dict={"conversation_id": "conv_123"}
)

# Filter by date (requires custom metadata)
results = store.search(
    "query",
    filter_dict={"created_at": {"$gte": "2024-01-01"}}
)
```

### Programmatic Usage

```python
from conversation_downloader import ConversationImporter
from vector_store import ConversationVectorStore

# Import conversations
importer = ConversationImporter()
conversations = importer.import_from_json_export("data.json")

# Create vector store
store = ConversationVectorStore()

# Add conversations
store.add_conversations(conversations)

# Search
results = store.search("how to use vector databases", n_results=5)

for result in results:
    print(f"{result['conversation_title']}: {result['text']}")
```

## Roadmap

Potential future enhancements:

- [ ] Direct Claude.ai API integration (when available)
- [ ] Web UI for browsing conversations
- [ ] Export/backup functionality
- [ ] Conversation analytics and insights
- [ ] Multi-language support
- [ ] Conversation tagging and categorization
- [ ] Time-based filtering in MCP tools
- [ ] Hybrid search (semantic + keyword)

## Contributing

This is a research project. Feel free to:
- Report issues
- Suggest improvements
- Submit pull requests
- Share your use cases

## License

MIT License - feel free to use and modify as needed.

## Acknowledgments

- Built with [ChromaDB](https://www.trychroma.com/)
- Embeddings by [sentence-transformers](https://www.sbert.net/)
- MCP integration using [Claude MCP SDK](https://github.com/anthropics/anthropic-mcp)
