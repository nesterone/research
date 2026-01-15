"""
Vector Store for Claude Conversations
Uses ChromaDB for storing and retrieving conversation embeddings
"""
import os
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
from tqdm import tqdm


class ConversationVectorStore:
    """Manages vector storage and retrieval of conversations"""

    def __init__(
        self,
        db_path: str = "./chroma_db",
        collection_name: str = "claude_conversations",
        embedding_model: str = "all-MiniLM-L6-v2"
    ):
        """
        Initialize the vector store

        Args:
            db_path: Path to store ChromaDB data
            collection_name: Name of the collection
            embedding_model: Sentence transformer model to use
        """
        self.db_path = db_path
        self.collection_name = collection_name

        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=db_path,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

        # Load embedding model
        print(f"Loading embedding model: {embedding_model}...")
        self.embedding_model = SentenceTransformer(embedding_model)
        print("Model loaded successfully!")

        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"description": "Claude conversation history with semantic search"}
        )

    def chunk_conversation(
        self,
        conversation: Dict[str, Any],
        chunk_size: int = 3,
        overlap: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Split conversation into overlapping chunks of messages

        Args:
            conversation: Normalized conversation dict
            chunk_size: Number of messages per chunk
            overlap: Number of overlapping messages between chunks

        Returns:
            List of chunks with metadata
        """
        messages = conversation['messages']
        chunks = []

        for i in range(0, len(messages), chunk_size - overlap):
            chunk_messages = messages[i:i + chunk_size]

            if not chunk_messages:
                continue

            # Create chunk text (format for readability and search)
            chunk_text_parts = []
            for msg in chunk_messages:
                role = msg['role'].capitalize()
                content = msg['content']
                chunk_text_parts.append(f"{role}: {content}")

            chunk_text = "\n\n".join(chunk_text_parts)

            # Create chunk metadata
            chunk = {
                'text': chunk_text,
                'conversation_id': conversation['id'],
                'conversation_title': conversation['title'],
                'created_at': conversation['created_at'],
                'chunk_index': len(chunks),
                'message_start_idx': i,
                'message_end_idx': i + len(chunk_messages),
                'messages': chunk_messages
            }

            chunks.append(chunk)

            # Don't overlap if we're at the end
            if i + chunk_size >= len(messages):
                break

        return chunks

    def add_conversations(
        self,
        conversations: List[Dict[str, Any]],
        batch_size: int = 100
    ) -> int:
        """
        Add conversations to the vector store

        Args:
            conversations: List of normalized conversations
            batch_size: Number of chunks to process at once

        Returns:
            Number of chunks added
        """
        print(f"\nProcessing {len(conversations)} conversations...")

        all_chunks = []
        for conversation in tqdm(conversations, desc="Chunking conversations"):
            chunks = self.chunk_conversation(conversation)
            all_chunks.extend(chunks)

        print(f"Created {len(all_chunks)} chunks from conversations")
        print("Generating embeddings and adding to database...")

        # Prepare data for ChromaDB
        texts = [chunk['text'] for chunk in all_chunks]
        ids = [
            f"{chunk['conversation_id']}_chunk_{chunk['chunk_index']}"
            for chunk in all_chunks
        ]
        metadatas = [
            {
                'conversation_id': chunk['conversation_id'],
                'conversation_title': chunk['conversation_title'],
                'created_at': chunk['created_at'],
                'chunk_index': chunk['chunk_index'],
                'message_start_idx': chunk['message_start_idx'],
                'message_end_idx': chunk['message_end_idx'],
                'full_chunk_data': json.dumps(chunk['messages'])
            }
            for chunk in all_chunks
        ]

        # Add to ChromaDB in batches
        for i in tqdm(range(0, len(texts), batch_size), desc="Adding to database"):
            batch_end = min(i + batch_size, len(texts))

            # Generate embeddings
            batch_embeddings = self.embedding_model.encode(
                texts[i:batch_end],
                show_progress_bar=False
            ).tolist()

            # Add to collection
            self.collection.add(
                embeddings=batch_embeddings,
                documents=texts[i:batch_end],
                ids=ids[i:batch_end],
                metadatas=metadatas[i:batch_end]
            )

        print(f"✓ Successfully added {len(all_chunks)} chunks to vector store")
        return len(all_chunks)

    def search(
        self,
        query: str,
        n_results: int = 5,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant conversation chunks

        Args:
            query: Search query
            n_results: Number of results to return
            filter_dict: Optional metadata filters

        Returns:
            List of relevant chunks with metadata and scores
        """
        # Generate query embedding
        query_embedding = self.embedding_model.encode(query).tolist()

        # Search in ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=filter_dict
        )

        # Format results
        formatted_results = []
        if results['documents'] and results['documents'][0]:
            for i in range(len(results['documents'][0])):
                result = {
                    'text': results['documents'][0][i],
                    'conversation_id': results['metadatas'][0][i]['conversation_id'],
                    'conversation_title': results['metadatas'][0][i]['conversation_title'],
                    'created_at': results['metadatas'][0][i]['created_at'],
                    'distance': results['distances'][0][i] if 'distances' in results else None,
                    'messages': json.loads(results['metadatas'][0][i]['full_chunk_data'])
                }
                formatted_results.append(result)

        return formatted_results

    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector store"""
        count = self.collection.count()
        return {
            'total_chunks': count,
            'collection_name': self.collection_name,
            'db_path': self.db_path
        }

    def reset(self):
        """Clear all data from the collection"""
        self.client.delete_collection(self.collection_name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "Claude conversation history with semantic search"}
        )
        print("Collection reset successfully")


if __name__ == "__main__":
    # Example usage
    from conversation_downloader import ConversationImporter

    # Initialize
    store = ConversationVectorStore()

    # Import sample conversations
    importer = ConversationImporter()
    conversations = importer.import_from_json_export("sample_conversations.json")

    # Add to vector store
    num_chunks = store.add_conversations(conversations)

    # Test search
    print("\n" + "="*60)
    print("Testing semantic search...")
    print("="*60)

    test_queries = [
        "How do I manage dependencies in Python?",
        "What are vector databases used for?",
        "Python project organization"
    ]

    for query in test_queries:
        print(f"\nQuery: '{query}'")
        print("-" * 60)
        results = store.search(query, n_results=2)

        for idx, result in enumerate(results, 1):
            print(f"\n{idx}. {result['conversation_title']}")
            print(f"   Distance: {result['distance']:.4f}")
            print(f"   Preview: {result['text'][:200]}...")

    # Show stats
    print("\n" + "="*60)
    stats = store.get_stats()
    print(f"Vector Store Stats:")
    print(f"  Total chunks: {stats['total_chunks']}")
    print(f"  Collection: {stats['collection_name']}")
    print(f"  Database path: {stats['db_path']}")
