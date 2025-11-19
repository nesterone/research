# Notes: ChatGPT and Claude Conversation History Export

## Project Goal
Build a proof of concept to export and read all conversations from ChatGPT and Claude for later analysis.

## Investigation Log

### Initial Setup
- Created project folder: `chatgpt-claude-conversation-history`
- Starting research on export methods for both platforms

### Research Findings

#### ChatGPT Export Methods (Completed)
**Official Export:**
- Navigate to Settings → Data Controls → Export
- Click "Export" then "Confirm export"
- Download link sent to registered email
- Link expires in 24 hours
- Main file: `conversations.json` (contains full conversation history)
- Additional account details included

**API Limitations:**
- OpenAI API does NOT provide endpoints for retrieving conversation history
- The website uses different endpoints with conversation IDs
- Developers must manage their own conversation storage

**Third-Party Options:**
- Browser extensions available (e.g., chatgpt-exporter on GitHub)
- Can export to HTML, Markdown, PDF, PNG formats

#### Claude Export Methods (Completed)
**Official Export:**
- Navigate to Settings → Privacy → Download Data
- Available on web app and Claude Desktop (NOT mobile apps)
- Exports as JSON or text files
- Download link expires in 24 hours
- Available for Free, Pro, Max users and Team Primary Owners

**API Limitations:**
- NO programmatic API for retrieving conversation history
- Messages API is stateless (you send full history with each request)
- Developers must manage conversation storage themselves

### Implementation Plan
1. Build parsers for official export files (conversations.json for ChatGPT, JSON for Claude)
2. Create unified data format for both platforms
3. Add basic analysis tools (count, search, export to different formats)
4. Document the manual export process for users

### Implementation Details (Completed)

#### Created Files:
1. **chatgpt_parser.py** - Parser for ChatGPT export files
   - Loads conversations.json format
   - Handles the complex nested mapping structure
   - Extracts messages in chronological order
   - Supports search, statistics, and markdown export

2. **claude_parser.py** - Parser for Claude export files
   - Handles various JSON export formats from Claude
   - Flexible structure detection (handles different field names)
   - Supports search, statistics, and markdown export

3. **unified_analyzer.py** - Combined analyzer for both platforms
   - Loads and analyzes data from both ChatGPT and Claude
   - Provides combined statistics
   - Cross-platform search functionality
   - Exports all conversations to markdown

4. **Sample Data Files:**
   - sample_chatgpt_export.json - Example ChatGPT export
   - sample_claude_export.json - Example Claude export

### Testing Results (All Passed)

**ChatGPT Parser Test:**
- ✅ Successfully loaded 3 sample conversations
- ✅ Correctly parsed 8 messages (4 user, 4 assistant)
- ✅ Date range extraction working
- ✅ Statistics calculation accurate

**Claude Parser Test:**
- ✅ Successfully loaded 3 sample conversations
- ✅ Correctly parsed 8 messages (4 user, 4 assistant)
- ✅ Date range extraction working
- ✅ Statistics calculation accurate

**Unified Analyzer Tests:**
- ✅ Combined statistics showing 6 total conversations, 16 messages
- ✅ Search functionality works (found "docker" in Claude conversations)
- ✅ Markdown export successful (6 files created in organized folders)

### Key Features Implemented:
- Parse official export files from both platforms
- Get conversation counts and statistics
- Search conversations by keyword (case-sensitive/insensitive)
- Filter conversations by date range
- Export individual conversations to markdown
- Unified analysis across both platforms
- Clean, readable markdown output

### Limitations & Future Enhancements:
- No automated export (user must manually download from platforms)
- Claude export format may vary (parser handles common patterns)
- Could add more export formats (PDF, HTML, CSV)
- Could add sentiment analysis or topic modeling
- Could create a web UI for easier exploration

