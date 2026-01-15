"""
Basic test to verify the conversation structure works
"""
import json

# Create sample conversation
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
                "content": "Here are some Python project best practices:\n\n1. Use a clear directory structure\n2. Include requirements.txt\n3. Write tests\n4. Use virtual environments\n5. Follow PEP 8",
                "timestamp": "2024-01-15T10:30:15Z"
            }
        ]
    }
]

# Save it
with open("sample_conversations.json", "w") as f:
    json.dump(sample, f, indent=2)

print("✓ Sample conversations created successfully")
print(f"  Created: sample_conversations.json")
print(f"  Conversations: {len(sample)}")
print(f"  Total messages: {sum(len(c['messages']) for c in sample)}")
