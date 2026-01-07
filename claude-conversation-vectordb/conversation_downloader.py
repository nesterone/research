"""
Conversation Downloader/Importer
Supports multiple input methods for conversation data
"""
import json
import os
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
import anthropic
from dotenv import load_dotenv

load_dotenv()


class ConversationImporter:
    """Import conversations from various sources"""

    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if self.api_key:
            self.client = anthropic.Anthropic(api_key=self.api_key)

    def import_from_json_export(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Import conversations from a JSON export file.
        Expected format: List of conversation objects with messages
        """
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        conversations = []

        # Handle different JSON structures
        if isinstance(data, list):
            conversations = data
        elif isinstance(data, dict) and 'conversations' in data:
            conversations = data['conversations']
        else:
            conversations = [data]

        return self._normalize_conversations(conversations)

    def import_from_directory(self, dir_path: str) -> List[Dict[str, Any]]:
        """
        Import all JSON conversation files from a directory
        """
        all_conversations = []
        dir_path = Path(dir_path)

        for json_file in dir_path.glob("*.json"):
            try:
                convos = self.import_from_json_export(str(json_file))
                all_conversations.extend(convos)
            except Exception as e:
                print(f"Error importing {json_file}: {e}")

        return all_conversations

    def import_from_claude_ai_export(self, export_path: str) -> List[Dict[str, Any]]:
        """
        Import from Claude.ai export format
        (This would need to be adapted based on actual export format)
        """
        # Placeholder for claude.ai specific export format
        return self.import_from_json_export(export_path)

    def _normalize_conversations(self, raw_conversations: List[Dict]) -> List[Dict[str, Any]]:
        """
        Normalize conversations to a standard format:
        {
            'id': str,
            'created_at': str (ISO format),
            'title': str (optional),
            'messages': [
                {'role': 'user'|'assistant', 'content': str, 'timestamp': str},
                ...
            ]
        }
        """
        normalized = []

        for idx, convo in enumerate(raw_conversations):
            # Try to extract standard fields
            conversation = {
                'id': convo.get('id', f'conv_{idx}_{datetime.now().timestamp()}'),
                'created_at': convo.get('created_at', convo.get('timestamp', datetime.now().isoformat())),
                'title': convo.get('title', convo.get('name', f'Conversation {idx + 1}')),
                'messages': []
            }

            # Normalize messages
            messages = convo.get('messages', convo.get('chat_messages', []))
            for msg in messages:
                normalized_msg = {
                    'role': msg.get('role', msg.get('sender', 'unknown')),
                    'content': msg.get('content', msg.get('text', '')),
                    'timestamp': msg.get('timestamp', msg.get('created_at', ''))
                }

                # Handle content that might be a list (Claude API format)
                if isinstance(normalized_msg['content'], list):
                    # Extract text from content blocks
                    text_parts = []
                    for block in normalized_msg['content']:
                        if isinstance(block, dict) and block.get('type') == 'text':
                            text_parts.append(block.get('text', ''))
                        elif isinstance(block, str):
                            text_parts.append(block)
                    normalized_msg['content'] = '\n'.join(text_parts)

                conversation['messages'].append(normalized_msg)

            normalized.append(conversation)

        return normalized

    def create_sample_conversation(self, output_path: str = "sample_conversations.json"):
        """
        Create a sample conversation file for testing
        """
        sample = [
            {
                "id": "sample_001",
                "created_at": "2024-01-15T10:30:00Z",
                "title": "Python Best Practices Discussion",
                "messages": [
                    {
                        "role": "user",
                        "content": "What are some best practices for structuring a Python project?",
                        "timestamp": "2024-01-15T10:30:00Z"
                    },
                    {
                        "role": "assistant",
                        "content": "Here are some Python project best practices:\n\n1. Use a clear directory structure with separate folders for source code, tests, and documentation\n2. Include a requirements.txt or pyproject.toml for dependencies\n3. Write comprehensive tests using pytest or unittest\n4. Use virtual environments to isolate dependencies\n5. Follow PEP 8 style guidelines\n6. Include proper documentation and docstrings",
                        "timestamp": "2024-01-15T10:30:15Z"
                    },
                    {
                        "role": "user",
                        "content": "How should I handle configuration in Python applications?",
                        "timestamp": "2024-01-15T10:31:00Z"
                    },
                    {
                        "role": "assistant",
                        "content": "For configuration management:\n\n1. Use environment variables for sensitive data\n2. Use python-dotenv to load .env files\n3. Consider pydantic for type-safe configuration\n4. Separate config for different environments (dev, staging, prod)\n5. Never commit secrets to version control",
                        "timestamp": "2024-01-15T10:31:20Z"
                    }
                ]
            },
            {
                "id": "sample_002",
                "created_at": "2024-01-16T14:20:00Z",
                "title": "Vector Databases Explained",
                "messages": [
                    {
                        "role": "user",
                        "content": "Can you explain what vector databases are and when to use them?",
                        "timestamp": "2024-01-16T14:20:00Z"
                    },
                    {
                        "role": "assistant",
                        "content": "Vector databases are specialized databases designed to store and query high-dimensional vectors (embeddings). They're particularly useful for:\n\n1. Semantic search - finding similar content based on meaning\n2. RAG (Retrieval Augmented Generation) systems\n3. Recommendation systems\n4. Image/audio similarity search\n\nPopular options include ChromaDB, Pinecone, Weaviate, and Qdrant.",
                        "timestamp": "2024-01-16T14:20:25Z"
                    }
                ]
            }
        ]

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(sample, f, indent=2, ensure_ascii=False)

        print(f"Sample conversations created at: {output_path}")
        return sample


if __name__ == "__main__":
    # Example usage
    importer = ConversationImporter()

    # Create a sample file for testing
    importer.create_sample_conversation("sample_conversations.json")

    # Import the sample
    conversations = importer.import_from_json_export("sample_conversations.json")
    print(f"\nImported {len(conversations)} conversations")
    for conv in conversations:
        print(f"  - {conv['title']} ({len(conv['messages'])} messages)")
