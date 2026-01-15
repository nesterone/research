#!/usr/bin/env python3
"""
CLI tool for managing the Claude Conversation Vector Database
"""
import argparse
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from conversation_downloader import ConversationImporter
from vector_store import ConversationVectorStore

load_dotenv()


def cmd_import(args):
    """Import conversations into the vector database"""
    importer = ConversationImporter()
    store = ConversationVectorStore(
        db_path=args.db_path,
        collection_name=args.collection
    )

    # Import conversations
    if args.file:
        print(f"Importing from file: {args.file}")
        conversations = importer.import_from_json_export(args.file)
    elif args.directory:
        print(f"Importing from directory: {args.directory}")
        conversations = importer.import_from_directory(args.directory)
    else:
        print("Error: Either --file or --directory must be specified")
        sys.exit(1)

    if not conversations:
        print("No conversations found to import")
        sys.exit(1)

    print(f"\nFound {len(conversations)} conversations")

    # Add to vector store
    num_chunks = store.add_conversations(conversations)
    print(f"\n✓ Successfully imported {len(conversations)} conversations ({num_chunks} chunks)")

    # Show stats
    stats = store.get_stats()
    print(f"\nDatabase now contains {stats['total_chunks']} total chunks")


def cmd_search(args):
    """Search the vector database"""
    store = ConversationVectorStore(
        db_path=args.db_path,
        collection_name=args.collection
    )

    results = store.search(args.query, n_results=args.limit)

    if not results:
        print(f"No results found for: '{args.query}'")
        return

    print(f"\nFound {len(results)} results for: '{args.query}'")
    print("=" * 80)

    for idx, result in enumerate(results, 1):
        print(f"\n{idx}. {result['conversation_title']}")
        print(f"   Created: {result['created_at']}")
        if result['distance'] is not None:
            print(f"   Relevance: {(1 - result['distance']):.3f}")
        print(f"   {'-' * 76}")
        print(f"   {result['text'][:300]}...")
        print()


def cmd_stats(args):
    """Show database statistics"""
    store = ConversationVectorStore(
        db_path=args.db_path,
        collection_name=args.collection
    )

    stats = store.get_stats()

    print("\nConversation Database Statistics")
    print("=" * 80)
    print(f"Total chunks: {stats['total_chunks']}")
    print(f"Collection name: {stats['collection_name']}")
    print(f"Database path: {stats['db_path']}")
    print()


def cmd_reset(args):
    """Reset the database"""
    if not args.yes:
        response = input(f"Are you sure you want to reset the database at {args.db_path}? (yes/no): ")
        if response.lower() != 'yes':
            print("Cancelled")
            return

    store = ConversationVectorStore(
        db_path=args.db_path,
        collection_name=args.collection
    )
    store.reset()
    print("✓ Database reset successfully")


def cmd_create_sample(args):
    """Create sample conversations for testing"""
    importer = ConversationImporter()
    output = args.output or "sample_conversations.json"
    importer.create_sample_conversation(output)
    print(f"✓ Sample conversations created at: {output}")


def main():
    parser = argparse.ArgumentParser(
        description="Manage Claude Conversation Vector Database",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create sample conversations
  python cli.py create-sample

  # Import conversations from a file
  python cli.py import --file conversations.json

  # Import from a directory of JSON files
  python cli.py import --directory ./my_conversations/

  # Search the database
  python cli.py search "How do I use vector databases?"

  # Show statistics
  python cli.py stats

  # Reset the database
  python cli.py reset
        """
    )

    # Global arguments
    parser.add_argument(
        "--db-path",
        default=os.getenv("CHROMA_DB_PATH", "./chroma_db"),
        help="Path to ChromaDB database (default: ./chroma_db)"
    )
    parser.add_argument(
        "--collection",
        default=os.getenv("COLLECTION_NAME", "claude_conversations"),
        help="Collection name (default: claude_conversations)"
    )

    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # Import command
    import_parser = subparsers.add_parser('import', help='Import conversations')
    import_group = import_parser.add_mutually_exclusive_group(required=True)
    import_group.add_argument('--file', help='Import from a single JSON file')
    import_group.add_argument('--directory', help='Import from a directory of JSON files')

    # Search command
    search_parser = subparsers.add_parser('search', help='Search conversations')
    search_parser.add_argument('query', help='Search query')
    search_parser.add_argument('--limit', type=int, default=5, help='Max results (default: 5)')

    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show database statistics')

    # Reset command
    reset_parser = subparsers.add_parser('reset', help='Reset the database')
    reset_parser.add_argument('--yes', action='store_true', help='Skip confirmation')

    # Create sample command
    sample_parser = subparsers.add_parser('create-sample', help='Create sample conversations')
    sample_parser.add_argument('--output', help='Output file path (default: sample_conversations.json)')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Route to appropriate command
    commands = {
        'import': cmd_import,
        'search': cmd_search,
        'stats': cmd_stats,
        'reset': cmd_reset,
        'create-sample': cmd_create_sample
    }

    commands[args.command](args)


if __name__ == "__main__":
    main()
