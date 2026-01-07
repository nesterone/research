"""
MCP Server for Claude Conversation Search
Provides semantic search over past Claude conversations
"""
import os
import json
import asyncio
from typing import Any, Optional
from dotenv import load_dotenv
from mcp.server import Server
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource
from vector_store import ConversationVectorStore

load_dotenv()


# Initialize vector store
DB_PATH = os.getenv("CHROMA_DB_PATH", "./chroma_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "claude_conversations")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

print("Initializing Conversation Vector Store...")
vector_store = ConversationVectorStore(
    db_path=DB_PATH,
    collection_name=COLLECTION_NAME,
    embedding_model=EMBEDDING_MODEL
)
print("Vector store ready!")

# Create MCP server
app = Server("claude-conversation-search")


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools"""
    return [
        Tool(
            name="search_past_conversations",
            description=(
                "Search through your past Claude conversations using semantic search. "
                "This tool finds relevant conversation snippets that might contain "
                "knowledge, solutions, or context useful for the current task. "
                "Use this when you need to recall past discussions, solutions, or insights."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query describing what you're looking for"
                    },
                    "max_results": {
                        "type": "number",
                        "description": "Maximum number of results to return (default: 5)",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        ),
        Tool(
            name="get_conversation_stats",
            description="Get statistics about the indexed conversation database",
            inputSchema={
                "type": "object",
                "properties": {},
                "required": []
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent | ImageContent | EmbeddedResource]:
    """Handle tool calls"""

    if name == "search_past_conversations":
        query = arguments.get("query")
        max_results = arguments.get("max_results", 5)

        if not query:
            return [TextContent(
                type="text",
                text="Error: query parameter is required"
            )]

        # Perform search
        results = vector_store.search(query, n_results=max_results)

        if not results:
            return [TextContent(
                type="text",
                text=f"No relevant conversations found for query: '{query}'"
            )]

        # Format results for Claude
        response_parts = [
            f"Found {len(results)} relevant conversation snippets for: '{query}'\n"
        ]

        for idx, result in enumerate(results, 1):
            response_parts.append(f"\n{'='*70}")
            response_parts.append(f"Result {idx}: {result['conversation_title']}")
            response_parts.append(f"Created: {result['created_at']}")
            if result['distance'] is not None:
                response_parts.append(f"Relevance Score: {1 - result['distance']:.3f}")
            response_parts.append(f"{'-'*70}")
            response_parts.append(f"\n{result['text']}\n")

        return [TextContent(
            type="text",
            text="\n".join(response_parts)
        )]

    elif name == "get_conversation_stats":
        stats = vector_store.get_stats()

        response = f"""Conversation Database Statistics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total indexed chunks: {stats['total_chunks']}
📁 Collection name: {stats['collection_name']}
💾 Database path: {stats['db_path']}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The database contains searchable conversation history that can be
queried using the 'search_past_conversations' tool.
"""
        return [TextContent(
            type="text",
            text=response
        )]

    else:
        return [TextContent(
            type="text",
            text=f"Unknown tool: {name}"
        )]


async def main():
    """Run the MCP server"""
    from mcp.server.stdio import stdio_server

    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
