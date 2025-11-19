#!/usr/bin/env python3
"""
Claude Conversation History Parser

This script parses the JSON export file from Claude data export
and provides tools to read, search, and analyze conversation history.
"""

import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path


class ClaudeParser:
    """Parser for Claude exported conversation data."""

    def __init__(self, export_file: str):
        """
        Initialize the parser with a Claude export JSON file.

        Args:
            export_file: Path to the Claude export JSON file
        """
        self.export_file = Path(export_file)
        self.data = {}
        self.conversations = []

    def load(self) -> bool:
        """
        Load and parse the export file.

        Returns:
            True if successful, False otherwise
        """
        try:
            with open(self.export_file, 'r', encoding='utf-8') as f:
                self.data = json.load(f)

            # The structure may vary, try to extract conversations
            # Common patterns: top-level array, or nested under a key
            if isinstance(self.data, list):
                self.conversations = self.data
            elif isinstance(self.data, dict):
                # Try common keys
                for key in ['conversations', 'chats', 'messages', 'data']:
                    if key in self.data:
                        self.conversations = self.data[key]
                        if isinstance(self.conversations, list):
                            break
                # If still no conversations found, treat the whole dict as structure
                if not self.conversations and 'uuid' in self.data:
                    # Might be a single conversation
                    self.conversations = [self.data]

            return True
        except FileNotFoundError:
            print(f"Error: File not found: {self.export_file}")
            return False
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON format: {e}")
            return False

    def get_conversation_count(self) -> int:
        """Get total number of conversations."""
        return len(self.conversations)

    def get_conversation_by_id(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific conversation by ID.

        Args:
            conversation_id: The conversation ID/UUID to search for

        Returns:
            Conversation dict if found, None otherwise
        """
        for conv in self.conversations:
            # Try common ID fields
            for id_field in ['uuid', 'id', 'conversation_id']:
                if conv.get(id_field) == conversation_id:
                    return conv
        return None

    def get_all_conversations(self) -> List[Dict[str, Any]]:
        """Get all conversations."""
        return self.conversations

    def search_conversations(self, query: str, case_sensitive: bool = False) -> List[Dict[str, Any]]:
        """
        Search conversations for a specific query string.

        Args:
            query: The search query
            case_sensitive: Whether to perform case-sensitive search

        Returns:
            List of conversations containing the query
        """
        results = []
        search_query = query if case_sensitive else query.lower()

        for conv in self.conversations:
            # Search in name/title
            for name_field in ['name', 'title', 'summary']:
                if name_field in conv:
                    text = str(conv[name_field])
                    if not case_sensitive:
                        text = text.lower()
                    if search_query in text:
                        results.append(conv)
                        break

            if conv in results:
                continue

            # Search in message content
            messages = self._extract_messages(conv)
            for msg in messages:
                content = msg.get('content', '')
                if not case_sensitive:
                    content = content.lower()
                if search_query in content:
                    results.append(conv)
                    break

        return results

    def get_conversations_by_date_range(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """
        Get conversations within a date range.

        Args:
            start_date: Start datetime
            end_date: End datetime

        Returns:
            List of conversations within the date range
        """
        results = []
        for conv in self.conversations:
            # Try common timestamp fields
            conv_date = None
            for date_field in ['created_at', 'updated_at', 'timestamp', 'create_time']:
                if date_field in conv:
                    timestamp = conv[date_field]
                    try:
                        # Try parsing as ISO format
                        conv_date = datetime.fromisoformat(str(timestamp).replace('Z', '+00:00'))
                    except (ValueError, AttributeError):
                        # Try parsing as Unix timestamp
                        try:
                            conv_date = datetime.fromtimestamp(float(timestamp))
                        except (ValueError, TypeError):
                            pass
                    if conv_date:
                        break

            if conv_date and start_date <= conv_date <= end_date:
                results.append(conv)

        return results

    def export_conversation_to_markdown(self, conversation_id: str, output_file: str) -> bool:
        """
        Export a single conversation to Markdown format.

        Args:
            conversation_id: The conversation ID/UUID to export
            output_file: Path to output markdown file

        Returns:
            True if successful, False otherwise
        """
        conv = self.get_conversation_by_id(conversation_id)
        if not conv:
            print(f"Conversation {conversation_id} not found")
            return False

        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                # Write title
                title = conv.get('name') or conv.get('title') or conv.get('summary') or 'Untitled Conversation'
                f.write(f"# {title}\n\n")

                # Write metadata
                for date_field in ['created_at', 'updated_at', 'timestamp']:
                    if date_field in conv:
                        f.write(f"**{date_field.replace('_', ' ').title()}:** {conv[date_field]}\n")

                conv_id = conv.get('uuid') or conv.get('id') or conv.get('conversation_id') or 'unknown'
                f.write(f"**ID:** {conv_id}\n\n")
                f.write("---\n\n")

                # Write messages
                messages = self._extract_messages(conv)

                for msg in messages:
                    role = msg.get('role', 'unknown')
                    content = msg.get('content', '')

                    if role == 'user' or role == 'human':
                        f.write(f"### User\n\n{content}\n\n")
                    elif role == 'assistant' or role == 'claude':
                        f.write(f"### Claude\n\n{content}\n\n")
                    elif role == 'system':
                        f.write(f"### System\n\n{content}\n\n")
                    else:
                        f.write(f"### {role.title()}\n\n{content}\n\n")

            return True
        except Exception as e:
            print(f"Error exporting conversation: {e}")
            return False

    def _extract_messages(self, conversation: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract messages from a conversation structure.

        Args:
            conversation: The conversation dictionary

        Returns:
            List of messages
        """
        messages = []

        # Try common message field names
        message_data = None
        for msg_field in ['messages', 'chat_messages', 'content']:
            if msg_field in conversation and isinstance(conversation[msg_field], list):
                message_data = conversation[msg_field]
                break

        if not message_data:
            # Maybe messages are directly in the conversation
            if 'text' in conversation or 'content' in conversation:
                # Single message conversation
                messages.append({
                    'role': conversation.get('sender') or 'unknown',
                    'content': conversation.get('text') or conversation.get('content', ''),
                    'timestamp': conversation.get('created_at') or conversation.get('timestamp')
                })
                return messages

        if message_data:
            for msg in message_data:
                if isinstance(msg, dict):
                    # Extract role
                    role = msg.get('sender') or msg.get('role') or msg.get('author') or 'unknown'

                    # Extract content
                    content = ''
                    if 'text' in msg:
                        content = msg['text']
                    elif 'content' in msg:
                        if isinstance(msg['content'], str):
                            content = msg['content']
                        elif isinstance(msg['content'], list):
                            # Content might be array of content blocks
                            content_parts = []
                            for block in msg['content']:
                                if isinstance(block, dict) and 'text' in block:
                                    content_parts.append(block['text'])
                                elif isinstance(block, str):
                                    content_parts.append(block)
                            content = '\n'.join(content_parts)

                    messages.append({
                        'role': role,
                        'content': content,
                        'timestamp': msg.get('created_at') or msg.get('timestamp')
                    })
                elif isinstance(msg, str):
                    # Simple string message
                    messages.append({
                        'role': 'unknown',
                        'content': msg,
                        'timestamp': None
                    })

        return messages

    def get_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the conversation history.

        Returns:
            Dictionary with statistics
        """
        total_convs = len(self.conversations)
        total_messages = 0
        user_messages = 0
        assistant_messages = 0

        earliest_date = None
        latest_date = None

        for conv in self.conversations:
            messages = self._extract_messages(conv)
            total_messages += len(messages)

            for msg in messages:
                role = msg.get('role', '').lower()
                if role in ['user', 'human']:
                    user_messages += 1
                elif role in ['assistant', 'claude']:
                    assistant_messages += 1

            # Try to get conversation date
            for date_field in ['created_at', 'updated_at', 'timestamp']:
                if date_field in conv:
                    try:
                        conv_date = datetime.fromisoformat(str(conv[date_field]).replace('Z', '+00:00'))
                    except (ValueError, AttributeError):
                        try:
                            conv_date = datetime.fromtimestamp(float(conv[date_field]))
                        except (ValueError, TypeError):
                            continue

                    if earliest_date is None or conv_date < earliest_date:
                        earliest_date = conv_date
                    if latest_date is None or conv_date > latest_date:
                        latest_date = conv_date
                    break

        return {
            'total_conversations': total_convs,
            'total_messages': total_messages,
            'user_messages': user_messages,
            'assistant_messages': assistant_messages,
            'earliest_conversation': earliest_date.isoformat() if earliest_date else None,
            'latest_conversation': latest_date.isoformat() if latest_date else None
        }


def main():
    """Example usage of the Claude parser."""
    import sys

    if len(sys.argv) < 2:
        print("Usage: python claude_parser.py <export.json>")
        print("\nThis will display statistics about your Claude conversation history.")
        sys.exit(1)

    parser = ClaudeParser(sys.argv[1])

    print("Loading Claude conversations...")
    if not parser.load():
        sys.exit(1)

    print("\n=== Claude Conversation Statistics ===\n")
    stats = parser.get_statistics()

    print(f"Total Conversations: {stats['total_conversations']}")
    print(f"Total Messages: {stats['total_messages']}")
    print(f"  - User Messages: {stats['user_messages']}")
    print(f"  - Assistant Messages: {stats['assistant_messages']}")

    if stats['earliest_conversation']:
        print(f"\nEarliest Conversation: {stats['earliest_conversation']}")
    if stats['latest_conversation']:
        print(f"Latest Conversation: {stats['latest_conversation']}")

    # List first 5 conversations
    print("\n=== Recent Conversations ===\n")
    conversations = parser.get_all_conversations()
    for i, conv in enumerate(conversations[:5]):
        title = conv.get('name') or conv.get('title') or 'Untitled'
        conv_id = conv.get('uuid') or conv.get('id') or 'unknown'

        # Try to get date
        date_str = 'Unknown'
        for date_field in ['created_at', 'updated_at', 'timestamp']:
            if date_field in conv:
                date_str = str(conv[date_field])[:10]  # Get just the date part
                break

        print(f"{i+1}. [{date_str}] {title}")
        print(f"   ID: {conv_id}")


if __name__ == "__main__":
    main()
