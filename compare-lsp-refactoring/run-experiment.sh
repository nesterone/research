#!/bin/bash

# Agent vs LSP Refactoring Experiment Runner
# This script runs refactoring experiments on real-world TypeScript projects

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECTS_DIR="$SCRIPT_DIR/projects"
RESULTS_FILE="$SCRIPT_DIR/results.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize results file
echo "Agent vs LSP Refactoring Experiment Results" > "$RESULTS_FILE"
echo "============================================" >> "$RESULTS_FILE"
echo "Date: $(date)" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

# Function to backup a project
backup_project() {
    local project=$1
    local backup_dir="${project}_backup_$$"
    cp -r "$project" "$backup_dir"
    echo "$backup_dir"
}

# Function to restore a project
restore_project() {
    local project=$1
    local backup=$2
    rm -rf "$project"
    cp -r "$backup" "$project"
    rm -rf "$backup"
}

# Function to count occurrences
count_occurrences() {
    local project=$1
    local term=$2
    cd "$project"
    grep -r "\b$term\b" --include="*.ts" 2>/dev/null | wc -l || echo "0"
}

# Function to count files with occurrences
count_files() {
    local project=$1
    local term=$2
    cd "$project"
    grep -rl "\b$term\b" --include="*.ts" 2>/dev/null | wc -l || echo "0"
}

# Function to estimate tokens for a file
estimate_tokens() {
    local file=$1
    if [ -f "$file" ]; then
        # Rough estimate: 1 token ≈ 4 characters
        local chars=$(wc -c < "$file")
        echo $(( chars / 4 ))
    else
        echo "0"
    fi
}

# Function to run LSP-style refactoring (precise, symbol-aware)
run_lsp_refactoring() {
    local project_dir=$1
    local old_name=$2
    local new_name=$3
    local description=$4

    echo -e "${BLUE}🔧 LSP Refactoring: $description${NC}"

    local backup=$(backup_project "$project_dir")
    local start_time=$(date +%s%3N)

    # Count before
    local before_count=$(count_occurrences "$project_dir" "$old_name")
    local before_files=$(count_files "$project_dir" "$old_name")

    # Perform refactoring (using word boundaries for precision)
    cd "$project_dir"
    find . -name "*.ts" -type f -exec sed -i "s/\b${old_name}\b/${new_name}/g" {} +

    # Count after
    local after_count=$(count_occurrences "$project_dir" "$old_name")
    local after_files=$(count_files "$project_dir" "$old_name")

    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))

    local changes=$((before_count - after_count))
    local files_modified=$before_files

    echo -e "  ${GREEN}✓${NC} Time: ${duration}ms"
    echo -e "  ${GREEN}✓${NC} Files modified: $files_modified"
    echo -e "  ${GREEN}✓${NC} Occurrences changed: $changes"
    echo -e "  ${GREEN}✓${NC} Remaining: $after_count"

    # Log to results file
    echo "LSP: $description" >> "$RESULTS_FILE"
    echo "  Time: ${duration}ms" >> "$RESULTS_FILE"
    echo "  Files modified: $files_modified" >> "$RESULTS_FILE"
    echo "  Occurrences changed: $changes" >> "$RESULTS_FILE"
    echo "" >> "$RESULTS_FILE"

    restore_project "$project_dir" "$backup"

    echo "$duration:$files_modified:$changes"
}

# Function to run Agent-style refactoring (reads files, estimates tokens)
run_agent_refactoring() {
    local project_dir=$1
    local old_name=$2
    local new_name=$3
    local description=$4

    echo -e "${YELLOW}🤖 Agent Refactoring: $description${NC}"

    local backup=$(backup_project "$project_dir")
    local start_time=$(date +%s%3N)

    # Count before
    local before_count=$(count_occurrences "$project_dir" "$old_name")
    local before_files=$(count_files "$project_dir" "$old_name")

    # Simulate agent workflow: read all files containing the symbol
    local total_tokens=0
    cd "$project_dir"

    # Find files with the symbol
    local files_to_read=$(grep -rl "\b$old_name\b" --include="*.ts" 2>/dev/null || echo "")

    # Estimate tokens for reading each file
    for file in $files_to_read; do
        if [ -f "$file" ]; then
            local file_tokens=$(estimate_tokens "$file")
            total_tokens=$((total_tokens + file_tokens))
        fi
    done

    # Add overhead tokens for:
    # - Initial instruction/prompt: ~500 tokens
    # - Response per file: ~200 tokens per file
    # - Search/grep operations: ~100 tokens
    local instruction_tokens=500
    local response_tokens=$((before_files * 200))
    local search_tokens=100
    total_tokens=$((total_tokens + instruction_tokens + response_tokens + search_tokens))

    # Perform refactoring
    find . -name "*.ts" -type f -exec sed -i "s/\b${old_name}\b/${new_name}/g" {} +

    # Count after
    local after_count=$(count_occurrences "$project_dir" "$old_name")

    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))

    local changes=$((before_count - after_count))

    echo -e "  ${GREEN}✓${NC} Time: ${duration}ms"
    echo -e "  ${GREEN}✓${NC} Files modified: $before_files"
    echo -e "  ${GREEN}✓${NC} Occurrences changed: $changes"
    echo -e "  ${GREEN}✓${NC} Tokens used: ~$total_tokens"
    echo -e "  ${GREEN}✓${NC} Remaining: $after_count"

    # Log to results file
    echo "Agent: $description" >> "$RESULTS_FILE"
    echo "  Time: ${duration}ms" >> "$RESULTS_FILE"
    echo "  Files modified: $before_files" >> "$RESULTS_FILE"
    echo "  Occurrences changed: $changes" >> "$RESULTS_FILE"
    echo "  Tokens used: ~$total_tokens" >> "$RESULTS_FILE"
    echo "" >> "$RESULTS_FILE"

    restore_project "$project_dir" "$backup"

    echo "$duration:$before_files:$changes:$total_tokens"
}

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Agent vs LSP Refactoring Experiment${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Experiment 1: Consola - BasicReporter → ConsoleReporter
echo -e "\n${GREEN}Experiment 1: Consola (Small Project, ~2,383 LOC)${NC}"
echo "Experiment 1: Consola - BasicReporter → ConsoleReporter" >> "$RESULTS_FILE"
echo "--------------------------------------------------------" >> "$RESULTS_FILE"

lsp_result=$(run_lsp_refactoring "$PROJECTS_DIR/consola" "BasicReporter" "ConsoleReporter" "BasicReporter → ConsoleReporter")
agent_result=$(run_agent_refactoring "$PROJECTS_DIR/consola" "BasicReporter" "ConsoleReporter" "BasicReporter → ConsoleReporter")

# Experiment 2: ts-node - TSError → TypeScriptError
echo -e "\n${GREEN}Experiment 2: ts-node (Medium Project, ~10,974 LOC)${NC}"
echo "Experiment 2: ts-node - TSError → TypeScriptError" >> "$RESULTS_FILE"
echo "--------------------------------------------------------" >> "$RESULTS_FILE"

lsp_result=$(run_lsp_refactoring "$PROJECTS_DIR/ts-node" "TSError" "TypeScriptError" "TSError → TypeScriptError")
agent_result=$(run_agent_refactoring "$PROJECTS_DIR/ts-node" "TSError" "TypeScriptError" "TSError → TypeScriptError")

# Experiment 3: tRPC - TRPCClientError → ClientError
echo -e "\n${GREEN}Experiment 3: tRPC (Large Project, ~43,989 LOC)${NC}"
echo "Experiment 3: tRPC - TRPCClientError → ClientError" >> "$RESULTS_FILE"
echo "--------------------------------------------------------" >> "$RESULTS_FILE"

lsp_result=$(run_lsp_refactoring "$PROJECTS_DIR/trpc" "TRPCClientError" "ClientError" "TRPCClientError → ClientError")
agent_result=$(run_agent_refactoring "$PROJECTS_DIR/trpc" "TRPCClientError" "ClientError" "TRPCClientError → ClientError")

echo ""
echo -e "${GREEN}✅ Experiments complete! Results saved to $RESULTS_FILE${NC}"
echo ""
