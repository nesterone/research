# Troubleshooting Guide

Common issues and solutions for Claude Conversation Vector Database.

## Installation Issues

### Problem: "ModuleNotFoundError: No module named 'X'"

**Solution:**
Make sure you've activated the virtual environment:

```bash
cd claude-conversation-vectordb
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

If still having issues:
```bash
pip install -r requirements.txt
```

### Problem: Installation takes forever or fails

**Cause:** sentence-transformers and chromadb have many dependencies

**Solutions:**

1. **Patience**: First installation can take 5-10 minutes
2. **Upgrade pip**: `pip install --upgrade pip`
3. **Install separately**:
   ```bash
   pip install anthropic python-dotenv pydantic tqdm
   pip install chromadb
   pip install sentence-transformers
   pip install mcp
   ```

### Problem: "ERROR: No matching distribution found for mcp"

**Solution:**
The MCP package might be in preview. Try:
```bash
pip install anthropic-mcp
```

Or install from source:
```bash
pip install git+https://github.com/anthropics/python-mcp-sdk.git
```

## Import Issues

### Problem: "Error importing: No such file or directory"

**Solutions:**
1. Check file path is correct
2. Use absolute paths or ensure you're in the right directory
3. Verify JSON file exists: `ls -la your_file.json`

### Problem: "JSONDecodeError: Expecting value"

**Solutions:**
1. Verify JSON is valid: `python -m json.tool your_file.json`
2. Check file encoding is UTF-8
3. Look for trailing commas in JSON
4. Ensure file isn't empty

### Problem: Imported conversations but no chunks created

**Solutions:**
1. Check conversation format matches expected structure
2. Verify messages array isn't empty
3. Look at error messages during import
4. Try with sample data first: `python cli.py create-sample`

## Search Issues

### Problem: "No results found" for everything

**Solutions:**
1. Verify database has data: `python cli.py stats`
2. If stats show 0 chunks, re-import conversations
3. Try very broad queries first: `python cli.py search "python"`
4. Check if database path is correct

### Problem: Search results seem irrelevant

**Causes:**
1. Very small dataset (need more conversations for good results)
2. Query too specific
3. Conversations don't contain related content

**Solutions:**
1. Try broader queries
2. Import more conversations
3. Check what's actually in database using broad searches
4. Verify imported conversations contain relevant content

## MCP Server Issues

### Problem: MCP server not showing up in Claude Code

**Checklist:**
1. ✅ Are paths in config **absolute** (not relative)?
2. ✅ Did you restart Claude Code after config changes?
3. ✅ Is Python accessible from terminal?
4. ✅ Can you run `python mcp_server.py` manually?
5. ✅ Is the config file in the right location?

**Debug Steps:**

1. **Find config location:**
   - Linux: `~/.config/claude/config.json`
   - macOS: `~/Library/Application Support/Claude/config.json`
   - Windows: `%APPDATA%\Claude\config.json`

2. **Verify paths are absolute:**
   ```bash
   # Get your project path
   cd claude-conversation-vectordb
   pwd
   # Use THIS full path in config
   ```

3. **Test server manually:**
   ```bash
   source venv/bin/activate
   python mcp_server.py
   # Should start without errors
   ```

4. **Check Claude Code logs**
   - Look for MCP-related errors
   - Server should initialize on startup

### Problem: MCP server starts but tools don't work

**Solutions:**

1. **Check database exists:**
   ```bash
   python cli.py stats
   ```

2. **Verify paths in MCP config match actual database location**

3. **Test search directly:**
   ```bash
   python cli.py search "test query"
   ```

4. **Check for errors in Claude Code console/logs**

### Problem: "FileNotFoundError" when using MCP server

**Solution:**
MCP config must use absolute paths:

❌ Wrong:
```json
"args": ["./mcp_server.py"]
```

✅ Correct:
```json
"args": ["/home/user/projects/claude-conversation-vectordb/mcp_server.py"]
```

## Performance Issues

### Problem: Import is very slow

**Expected:** First import takes time for embedding generation

**To improve:**
1. Import in smaller batches
2. Check CPU usage (embeddings are CPU-intensive)
3. Reduce batch_size in vector_store.py (line with batch_size parameter)

### Problem: Search is slow

**Causes:**
1. Very large database
2. Slow disk I/O
3. Large number of results requested

**Solutions:**
1. Reduce n_results: `python cli.py search "query" --limit 3`
2. Use SSD instead of HDD
3. Consider smaller embedding model (though quality may decrease)

## Database Issues

### Problem: Database seems corrupted

**Solutions:**

1. **Check database:**
   ```bash
   python cli.py stats
   ```

2. **Reset and re-import:**
   ```bash
   python cli.py reset --yes
   python cli.py import --file your_data.json
   ```

3. **Delete and recreate:**
   ```bash
   rm -rf chroma_db/
   python cli.py import --file your_data.json
   ```

### Problem: "Collection already exists" error

**Solution:**
This is usually fine - it just reuses existing collection. To start fresh:
```bash
python cli.py reset --yes
```

## Environment Issues

### Problem: Different results in different terminals

**Cause:** Not using virtual environment consistently

**Solution:**
**ALWAYS** activate venv first:
```bash
cd claude-conversation-vectordb
source venv/bin/activate
python cli.py ...
```

### Problem: "python: command not found"

**Solutions:**
1. Try `python3` instead of `python`
2. Ensure Python is installed: `python --version`
3. Add Python to PATH

## Data Format Issues

### Problem: My conversation export doesn't match the expected format

**Solution:**
Create a converter script:

```python
import json

# Load your format
with open('my_export.json', 'r') as f:
    my_data = json.load(f)

# Convert to expected format
converted = []
for item in my_data:
    # Adapt this to your format
    conversation = {
        'id': item['conversation_id'],
        'title': item.get('name', 'Untitled'),
        'created_at': item['timestamp'],
        'messages': [
            {
                'role': msg['sender'],
                'content': msg['text'],
                'timestamp': msg['time']
            }
            for msg in item['chat']
        ]
    }
    converted.append(conversation)

# Save in expected format
with open('converted.json', 'w') as f:
    json.dump(converted, f, indent=2)
```

Then import the converted file.

## Getting More Help

### Enable Debug Mode

Add to your imports in Python scripts:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Check Versions

```bash
pip list | grep -E "chroma|sentence|anthropic|mcp"
```

### Test Components Separately

1. **Test imports only:**
   ```python
   from conversation_downloader import ConversationImporter
   importer = ConversationImporter()
   convos = importer.import_from_json_export("sample_conversations.json")
   print(f"Loaded {len(convos)} conversations")
   ```

2. **Test embeddings only:**
   ```python
   from sentence_transformers import SentenceTransformer
   model = SentenceTransformer('all-MiniLM-L6-v2')
   embedding = model.encode("test")
   print(f"Embedding shape: {embedding.shape}")
   ```

3. **Test ChromaDB only:**
   ```python
   import chromadb
   client = chromadb.PersistentClient(path="./test_db")
   collection = client.get_or_create_collection("test")
   print(f"Collection created: {collection.name}")
   ```

### Common Error Messages

**"RuntimeError: Cannot re-initialize CUDA in forked subprocess"**
- Not critical for our use case
- If problematic, set `TOKENIZERS_PARALLELISM=false`

**"UserWarning: TypedStorage is deprecated"**
- Just a warning, can be ignored
- Related to PyTorch version compatibility

**"Could not find a version that satisfies the requirement mcp"**
- Try `anthropic-mcp` instead
- Or install from git source

## Still Having Issues?

1. Check README.md for detailed setup instructions
2. Review QUICKSTART.md for step-by-step guide
3. Try with fresh virtual environment
4. Test with sample data before your own data
5. Check file permissions
6. Verify disk space available

## Reporting Issues

If you find a bug, please provide:
1. Full error message
2. Python version: `python --version`
3. OS: `uname -a` (Linux/Mac) or Windows version
4. Steps to reproduce
5. Output of `pip list`
