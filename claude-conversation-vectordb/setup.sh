#!/bin/bash
# Setup script for Claude Conversation Vector Database

set -e

echo "======================================================"
echo "Claude Conversation Vector Database - Setup"
echo "======================================================"
echo ""

# Check Python version
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Create virtual environment
echo ""
echo "Creating virtual environment..."
python -m venv venv
echo "✓ Virtual environment created"

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"

# Install dependencies
echo ""
echo "Installing dependencies (this may take a few minutes)..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "✓ Dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
else
    echo ""
    echo "✓ .env file already exists"
fi

# Create sample conversations
echo ""
echo "Creating sample conversations..."
python test_basic.py
echo "✓ Sample data created"

echo ""
echo "======================================================"
echo "Setup complete!"
echo "======================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Activate the virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. Import conversations:"
echo "   python cli.py import --file sample_conversations.json"
echo ""
echo "3. Test search:"
echo "   python cli.py search 'python best practices'"
echo ""
echo "4. Configure MCP server in Claude Code (see README.md)"
echo ""
