# ChatGPT & Claude Conversation History Export Tool

A proof-of-concept toolkit to export, parse, and analyze your conversation history from ChatGPT and Claude AI. This tool allows you to download your conversations and perform various analyses on them.

## Overview

Both ChatGPT and Claude provide ways to export your conversation history, but they don't offer programmatic APIs to retrieve this data. This toolkit provides:

- **Parsers** for official export files from both platforms
- **Unified analysis** across both ChatGPT and Claude conversations
- **Search functionality** to find specific conversations
- **Export capabilities** to convert conversations to markdown format
- **Statistics** about your conversation history

## Features

✅ Parse ChatGPT `conversations.json` export files
✅ Parse Claude JSON export files
✅ Get comprehensive statistics (conversation count, message count, date ranges)
✅ Search conversations by keyword
✅ Filter conversations by date range
✅ Export conversations to clean, readable Markdown
✅ Unified analysis across both platforms

## Prerequisites

- Python 3.7 or higher
- Your exported conversation data from ChatGPT and/or Claude

## How to Export Your Data

### ChatGPT

1. Log in to [chat.openai.com](https://chat.openai.com)
2. Click on your profile (bottom left)
3. Go to **Settings** → **Data Controls** → **Export**
4. Click **Export** then **Confirm export**
5. You'll receive an email with a download link (expires in 24 hours)
6. Download the archive and extract `conversations.json`

### Claude

1. Log in to [claude.ai](https://claude.ai) or open Claude Desktop
2. Go to **Settings** → **Privacy**
3. Find **Download Data** section
4. Request your data export
5. You'll receive an email with a download link (expires in 24 hours)
6. Download the JSON export file

**Note:** Claude data export is available on web and desktop apps, but NOT on mobile apps.

## Installation

Clone or download this repository:

```bash
git clone <repository-url>
cd chatgpt-claude-conversation-history
```

No additional dependencies required - uses only Python standard library!

## Usage

### Individual Parsers

#### ChatGPT Parser

```bash
python chatgpt_parser.py conversations.json
```

Output:
```
=== ChatGPT Conversation Statistics ===

Total Conversations: 150
Total Messages: 1,234
  - User Messages: 617
  - Assistant Messages: 617

Earliest Conversation: 2023-03-15T10:30:00
Latest Conversation: 2024-01-10T15:45:00

=== Recent Conversations ===
1. [2024-01-10] Python Tutorial - Lists and Dictionaries
   ID: conv-123abc
...
```

#### Claude Parser

```bash
python claude_parser.py claude_export.json
```

Output similar to ChatGPT parser.

### Unified Analyzer

The unified analyzer combines data from both platforms for comprehensive analysis.

#### View Combined Statistics

```bash
python unified_analyzer.py --chatgpt conversations.json --claude claude_export.json
```

#### Search Across All Conversations

```bash
python unified_analyzer.py \
  --chatgpt conversations.json \
  --claude claude_export.json \
  --search "python tutorial"
```

For case-sensitive search:

```bash
python unified_analyzer.py \
  --chatgpt conversations.json \
  --search "Python" \
  --case-sensitive
```

#### Export All Conversations to Markdown

```bash
python unified_analyzer.py \
  --chatgpt conversations.json \
  --claude claude_export.json \
  --export-all ./my_conversations
```

This creates organized folders:
```
my_conversations/
├── chatgpt/
│   ├── conv-123abc.md
│   ├── conv-456def.md
│   └── ...
└── claude/
    ├── 550e8400-e29b-41d4-a716-446655440000.md
    ├── 650e8400-e29b-41d4-a716-446655440001.md
    └── ...
```

## API Usage

You can also use these tools as Python libraries:

### ChatGPT Parser Example

```python
from chatgpt_parser import ChatGPTParser

# Load conversations
parser = ChatGPTParser('conversations.json')
parser.load()

# Get statistics
stats = parser.get_statistics()
print(f"Total conversations: {stats['total_conversations']}")

# Search conversations
results = parser.search_conversations('python', case_sensitive=False)
print(f"Found {len(results)} conversations about Python")

# Export a conversation to markdown
parser.export_conversation_to_markdown('conv-123abc', 'output.md')

# Get conversations by date
from datetime import datetime
start = datetime(2024, 1, 1)
end = datetime(2024, 1, 31)
jan_convs = parser.get_conversations_by_date_range(start, end)
```

### Claude Parser Example

```python
from claude_parser import ClaudeParser

# Load conversations
parser = ClaudeParser('claude_export.json')
parser.load()

# Get all conversations
conversations = parser.get_all_conversations()

# Search
results = parser.search_conversations('docker')

# Export
parser.export_conversation_to_markdown(
    '550e8400-e29b-41d4-a716-446655440000',
    'conversation.md'
)
```

### Unified Analyzer Example

```python
from unified_analyzer import UnifiedAnalyzer

analyzer = UnifiedAnalyzer()
analyzer.load_chatgpt('conversations.json')
analyzer.load_claude('claude_export.json')

# Display combined statistics
analyzer.display_combined_statistics()

# Search across both platforms
analyzer.search_all('machine learning')

# Export everything
analyzer.export_all_to_markdown('./exports')
```

## File Structure

```
chatgpt-claude-conversation-history/
├── README.md                      # This file
├── notes.md                       # Development notes
├── chatgpt_parser.py             # ChatGPT conversation parser
├── claude_parser.py              # Claude conversation parser
├── unified_analyzer.py           # Unified analysis tool
├── sample_chatgpt_export.json    # Sample ChatGPT data
└── sample_claude_export.json     # Sample Claude data
```

## Exported Markdown Format

Each conversation is exported to a clean markdown file:

```markdown
# Conversation Title

**Created:** 2024-01-10 15:30:00
**ID:** conv-123abc

---

### User

Can you explain Python lists?

### Assistant

Sure! Python lists are ordered, mutable collections...
```

## Limitations

- **Manual Export Required:** Both platforms require manual data export (no automated API)
- **Export Format Variations:** Claude's export format may vary; the parser handles common patterns
- **Download Link Expiration:** Export download links expire in 24 hours
- **No Real-time Sync:** You need to re-export to get new conversations

## Privacy & Security

- All processing is done **locally** on your machine
- No data is sent to any third-party servers
- Your conversation history remains private
- Remember to keep your export files secure (they contain all your conversations)

## Future Enhancements

Potential improvements for this proof of concept:

- 📊 Add sentiment analysis and topic modeling
- 📈 Create visualizations (conversation trends over time)
- 🌐 Build a web UI for easier exploration
- 📄 Support additional export formats (PDF, HTML, CSV)
- 🔍 Advanced search with regex support
- 📱 Create a desktop app for non-technical users
- 🔄 Automated export retrieval (if APIs become available)

## API Limitations

### ChatGPT
- OpenAI API does **not** provide endpoints for conversation history
- The chat.openai.com website uses internal endpoints with conversation IDs
- Developers must implement their own conversation storage

### Claude
- Anthropic API does **not** provide programmatic access to conversation history
- The Messages API is stateless (you send full history with each request)
- No way to retrieve previous conversations via API

## Use Cases

- 📚 **Personal Knowledge Base:** Export and search your learning conversations
- 🔍 **Research:** Analyze topics you've discussed over time
- 📖 **Documentation:** Convert helpful conversations to reference documents
- 💾 **Backup:** Keep local copies of important conversations
- 📊 **Analysis:** Study your interaction patterns with AI assistants

## Testing

Sample data files are included for testing:

```bash
# Test ChatGPT parser
python chatgpt_parser.py sample_chatgpt_export.json

# Test Claude parser
python claude_parser.py sample_claude_export.json

# Test unified analyzer
python unified_analyzer.py \
  --chatgpt sample_chatgpt_export.json \
  --claude sample_claude_export.json
```

## Troubleshooting

### "File not found" error
- Verify the path to your export file is correct
- Use absolute paths if relative paths don't work

### "Invalid JSON format" error
- Ensure the export file is valid JSON
- Check if the download completed successfully
- Try re-exporting from the platform

### Empty conversations list
- The export file structure may differ from expected format
- Check the raw JSON structure
- File an issue with the format details for parser updates

### Unicode errors
- The parsers use UTF-8 encoding
- If you see encoding errors, check your system's locale settings

## Contributing

This is a proof-of-concept project. Contributions welcome:

1. Test with different export formats
2. Report issues or edge cases
3. Suggest features or improvements
4. Submit pull requests

## License

This is a proof-of-concept educational project. Use at your own discretion.

## Disclaimer

- This tool is not affiliated with OpenAI or Anthropic
- Export file formats may change over time
- Always keep backups of your data
- Respect the terms of service of both platforms

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the sample data and code
3. Open an issue with details about your problem

---

**Last Updated:** 2024-01-10
**Version:** 1.0.0 (Proof of Concept)
