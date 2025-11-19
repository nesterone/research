#!/usr/bin/env python3
"""
Unified Conversation History Analyzer

This script provides a unified interface to analyze conversations
from both ChatGPT and Claude exports.
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional

from chatgpt_parser import ChatGPTParser
from claude_parser import ClaudeParser


class UnifiedAnalyzer:
    """Unified analyzer for both ChatGPT and Claude conversation exports."""

    def __init__(self):
        self.chatgpt_parser: Optional[ChatGPTParser] = None
        self.claude_parser: Optional[ClaudeParser] = None

    def load_chatgpt(self, file_path: str) -> bool:
        """Load ChatGPT export file."""
        print(f"Loading ChatGPT data from {file_path}...")
        self.chatgpt_parser = ChatGPTParser(file_path)
        return self.chatgpt_parser.load()

    def load_claude(self, file_path: str) -> bool:
        """Load Claude export file."""
        print(f"Loading Claude data from {file_path}...")
        self.claude_parser = ClaudeParser(file_path)
        return self.claude_parser.load()

    def display_combined_statistics(self):
        """Display statistics for all loaded conversation histories."""
        print("\n" + "=" * 60)
        print("COMBINED CONVERSATION STATISTICS")
        print("=" * 60 + "\n")

        total_conversations = 0
        total_messages = 0
        total_user_messages = 0
        total_assistant_messages = 0

        if self.chatgpt_parser:
            print("ChatGPT:")
            print("-" * 40)
            stats = self.chatgpt_parser.get_statistics()
            print(f"  Conversations: {stats['total_conversations']}")
            print(f"  Messages: {stats['total_messages']}")
            print(f"    - User: {stats['user_messages']}")
            print(f"    - Assistant: {stats['assistant_messages']}")
            if stats['earliest_conversation']:
                print(f"  Date Range: {stats['earliest_conversation']} to {stats['latest_conversation']}")
            print()

            total_conversations += stats['total_conversations']
            total_messages += stats['total_messages']
            total_user_messages += stats['user_messages']
            total_assistant_messages += stats['assistant_messages']

        if self.claude_parser:
            print("Claude:")
            print("-" * 40)
            stats = self.claude_parser.get_statistics()
            print(f"  Conversations: {stats['total_conversations']}")
            print(f"  Messages: {stats['total_messages']}")
            print(f"    - User: {stats['user_messages']}")
            print(f"    - Assistant: {stats['assistant_messages']}")
            if stats['earliest_conversation']:
                print(f"  Date Range: {stats['earliest_conversation']} to {stats['latest_conversation']}")
            print()

            total_conversations += stats['total_conversations']
            total_messages += stats['total_messages']
            total_user_messages += stats['user_messages']
            total_assistant_messages += stats['assistant_messages']

        print("=" * 60)
        print("TOTALS ACROSS ALL PLATFORMS:")
        print("=" * 60)
        print(f"Total Conversations: {total_conversations}")
        print(f"Total Messages: {total_messages}")
        print(f"  - User Messages: {total_user_messages}")
        print(f"  - Assistant Messages: {total_assistant_messages}")
        print()

    def search_all(self, query: str, case_sensitive: bool = False):
        """Search across all loaded conversation histories."""
        print(f"\nSearching for: '{query}'")
        print("=" * 60 + "\n")

        total_results = 0

        if self.chatgpt_parser:
            results = self.chatgpt_parser.search_conversations(query, case_sensitive)
            print(f"ChatGPT Results: {len(results)} conversations found")
            for i, conv in enumerate(results[:5], 1):
                title = conv.get('title', 'Untitled')
                conv_id = conv.get('id', 'unknown')[:8]
                print(f"  {i}. {title} (ID: {conv_id}...)")
            if len(results) > 5:
                print(f"  ... and {len(results) - 5} more")
            print()
            total_results += len(results)

        if self.claude_parser:
            results = self.claude_parser.search_conversations(query, case_sensitive)
            print(f"Claude Results: {len(results)} conversations found")
            for i, conv in enumerate(results[:5], 1):
                title = conv.get('name') or conv.get('title') or 'Untitled'
                conv_id = str(conv.get('uuid') or conv.get('id', 'unknown'))[:8]
                print(f"  {i}. {title} (ID: {conv_id}...)")
            if len(results) > 5:
                print(f"  ... and {len(results) - 5} more")
            print()
            total_results += len(results)

        print(f"Total Results: {total_results} conversations")

    def export_all_to_markdown(self, output_dir: str):
        """Export all conversations to markdown files."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        print(f"\nExporting all conversations to {output_dir}/")
        print("=" * 60 + "\n")

        total_exported = 0

        if self.chatgpt_parser:
            print("Exporting ChatGPT conversations...")
            chatgpt_dir = output_path / "chatgpt"
            chatgpt_dir.mkdir(exist_ok=True)

            conversations = self.chatgpt_parser.get_all_conversations()
            for i, conv in enumerate(conversations, 1):
                conv_id = conv.get('id', f'unknown_{i}')
                safe_id = conv_id.replace('/', '_').replace('\\', '_')
                output_file = chatgpt_dir / f"{safe_id}.md"

                if self.chatgpt_parser.export_conversation_to_markdown(conv_id, str(output_file)):
                    total_exported += 1

                if i % 10 == 0:
                    print(f"  Exported {i}/{len(conversations)} conversations...")

            print(f"  Done! Exported {len(conversations)} ChatGPT conversations\n")

        if self.claude_parser:
            print("Exporting Claude conversations...")
            claude_dir = output_path / "claude"
            claude_dir.mkdir(exist_ok=True)

            conversations = self.claude_parser.get_all_conversations()
            for i, conv in enumerate(conversations, 1):
                conv_id = conv.get('uuid') or conv.get('id') or f'unknown_{i}'
                safe_id = str(conv_id).replace('/', '_').replace('\\', '_')
                output_file = claude_dir / f"{safe_id}.md"

                if self.claude_parser.export_conversation_to_markdown(conv_id, str(output_file)):
                    total_exported += 1

                if i % 10 == 0:
                    print(f"  Exported {i}/{len(conversations)} conversations...")

            print(f"  Done! Exported {len(conversations)} Claude conversations\n")

        print(f"Total: Exported {total_exported} conversations to {output_dir}/")


def main():
    parser = argparse.ArgumentParser(
        description="Unified Conversation History Analyzer for ChatGPT and Claude",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Analyze both ChatGPT and Claude conversations
  python unified_analyzer.py --chatgpt conversations.json --claude claude_export.json

  # Search across all conversations
  python unified_analyzer.py --chatgpt conversations.json --search "python tutorial"

  # Export all conversations to markdown
  python unified_analyzer.py --chatgpt conversations.json --claude claude_export.json --export-all ./exports
        """
    )

    parser.add_argument('--chatgpt', type=str, help='Path to ChatGPT conversations.json file')
    parser.add_argument('--claude', type=str, help='Path to Claude export JSON file')
    parser.add_argument('--search', type=str, help='Search query to find conversations')
    parser.add_argument('--case-sensitive', action='store_true', help='Make search case-sensitive')
    parser.add_argument('--export-all', type=str, metavar='DIR', help='Export all conversations to markdown in specified directory')

    args = parser.parse_args()

    if not args.chatgpt and not args.claude:
        parser.print_help()
        print("\nError: You must specify at least one export file (--chatgpt or --claude)")
        sys.exit(1)

    analyzer = UnifiedAnalyzer()

    # Load data
    if args.chatgpt:
        if not analyzer.load_chatgpt(args.chatgpt):
            print(f"Failed to load ChatGPT data from {args.chatgpt}")
            sys.exit(1)

    if args.claude:
        if not analyzer.load_claude(args.claude):
            print(f"Failed to load Claude data from {args.claude}")
            sys.exit(1)

    # Execute commands
    if args.search:
        analyzer.search_all(args.search, args.case_sensitive)
    elif args.export_all:
        analyzer.export_all_to_markdown(args.export_all)
    else:
        # Default: show statistics
        analyzer.display_combined_statistics()


if __name__ == "__main__":
    main()
