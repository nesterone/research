#!/usr/bin/env python3
"""
ChatGPT Conversation History Parser

This script parses the conversations.json file from ChatGPT data export
and provides tools to read, search, and analyze conversation history.
"""

import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path


class ChatGPTParser:
    """Parser for ChatGPT exported conversation data."""

    def __init__(self, conversations_file: str):
        """
        Initialize the parser with a conversations.json file.

        Args:
            conversations_file: Path to the conversations.json export file
        """
        self.conversations_file = Path(conversations_file)
        self.conversations = []

    def load(self) -> bool:
        """
        Load and parse the conversations file.

        Returns:
            True if successful, False otherwise
        """
        try:
            with open(self.conversations_file, 'r', encoding='utf-8') as f:
                self.conversations = json.load(f)
            return True
        except FileNotFoundError:
            print(f"Error: File not found: {self.conversations_file}")
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
            conversation_id: The conversation ID to search for

        Returns:
            Conversation dict if found, None otherwise
        """
        for conv in self.conversations:
            if conv.get('id') == conversation_id:
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
            # Search in title
            title = conv.get('title', '')
            if not case_sensitive:
                title = title.lower()

            if search_query in title:
                results.append(conv)
                continue

            # Search in message content
            mapping = conv.get('mapping', {})
            for node_id, node in mapping.items():
                message = node.get('message')
                if message and message.get('content'):
                    content = message['content']
                    if isinstance(content, dict):
                        parts = content.get('parts', [])
                        for part in parts:
                            if isinstance(part, str):
                                part_text = part if case_sensitive else part.lower()
                                if search_query in part_text:
                                    results.append(conv)
                                    break
                if conv in results:
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
            create_time = conv.get('create_time')
            if create_time:
                conv_date = datetime.fromtimestamp(create_time)
                if start_date <= conv_date <= end_date:
                    results.append(conv)
        return results

    def export_conversation_to_markdown(self, conversation_id: str, output_file: str) -> bool:
        """
        Export a single conversation to Markdown format.

        Args:
            conversation_id: The conversation ID to export
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
                title = conv.get('title', 'Untitled Conversation')
                f.write(f"# {title}\n\n")

                # Write metadata
                create_time = conv.get('create_time')
                if create_time:
                    date_str = datetime.fromtimestamp(create_time).strftime('%Y-%m-%d %H:%M:%S')
                    f.write(f"**Created:** {date_str}\n\n")

                f.write(f"**ID:** {conversation_id}\n\n")
                f.write("---\n\n")

                # Write messages
                mapping = conv.get('mapping', {})
                messages = self._extract_messages_in_order(mapping)

                for msg in messages:
                    role = msg.get('role', 'unknown')
                    content = msg.get('content', '')

                    if role == 'user':
                        f.write(f"### User\n\n{content}\n\n")
                    elif role == 'assistant':
                        f.write(f"### Assistant\n\n{content}\n\n")
                    elif role == 'system':
                        f.write(f"### System\n\n{content}\n\n")

            return True
        except Exception as e:
            print(f"Error exporting conversation: {e}")
            return False

    def _extract_messages_in_order(self, mapping: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract messages from the mapping structure in chronological order.

        Args:
            mapping: The conversation mapping structure

        Returns:
            List of messages in order
        """
        messages = []

        # Find the root node
        root_id = None
        for node_id, node in mapping.items():
            if node.get('parent') is None:
                root_id = node_id
                break

        if root_id:
            # Traverse the tree
            self._traverse_messages(mapping, root_id, messages)

        return messages

    def _traverse_messages(self, mapping: Dict[str, Any], node_id: str, messages: List[Dict[str, Any]]):
        """
        Recursively traverse the message tree.

        Args:
            mapping: The conversation mapping structure
            node_id: Current node ID
            messages: List to append messages to
        """
        node = mapping.get(node_id)
        if not node:
            return

        # Extract message if present
        message = node.get('message')
        if message and message.get('content'):
            content = message['content']
            role = message.get('author', {}).get('role', 'unknown')

            # Extract text content
            text_content = ""
            if isinstance(content, dict):
                parts = content.get('parts', [])
                text_content = ' '.join(str(part) for part in parts if part)
            elif isinstance(content, str):
                text_content = content

            if text_content.strip():
                messages.append({
                    'role': role,
                    'content': text_content,
                    'create_time': message.get('create_time')
                })

        # Traverse children
        children = node.get('children', [])
        for child_id in children:
            self._traverse_messages(mapping, child_id, messages)

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
            mapping = conv.get('mapping', {})
            messages = self._extract_messages_in_order(mapping)
            total_messages += len(messages)

            for msg in messages:
                if msg.get('role') == 'user':
                    user_messages += 1
                elif msg.get('role') == 'assistant':
                    assistant_messages += 1

            create_time = conv.get('create_time')
            if create_time:
                conv_date = datetime.fromtimestamp(create_time)
                if earliest_date is None or conv_date < earliest_date:
                    earliest_date = conv_date
                if latest_date is None or conv_date > latest_date:
                    latest_date = conv_date

        return {
            'total_conversations': total_convs,
            'total_messages': total_messages,
            'user_messages': user_messages,
            'assistant_messages': assistant_messages,
            'earliest_conversation': earliest_date.isoformat() if earliest_date else None,
            'latest_conversation': latest_date.isoformat() if latest_date else None
        }


def main():
    """Example usage of the ChatGPT parser."""
    import sys

    if len(sys.argv) < 2:
        print("Usage: python chatgpt_parser.py <conversations.json>")
        print("\nThis will display statistics about your ChatGPT conversation history.")
        sys.exit(1)

    parser = ChatGPTParser(sys.argv[1])

    print("Loading ChatGPT conversations...")
    if not parser.load():
        sys.exit(1)

    print("\n=== ChatGPT Conversation Statistics ===\n")
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
        title = conv.get('title', 'Untitled')
        conv_id = conv.get('id', 'unknown')
        create_time = conv.get('create_time')
        date_str = datetime.fromtimestamp(create_time).strftime('%Y-%m-%d') if create_time else 'Unknown'
        print(f"{i+1}. [{date_str}] {title}")
        print(f"   ID: {conv_id}")


if __name__ == "__main__":
    main()
