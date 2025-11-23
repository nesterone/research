#!/usr/bin/env python3
"""
Generate static charts for the Agent vs LSP Refactoring comparison study.
These charts can be embedded in documentation and presentations.
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from pathlib import Path

# Set style
plt.style.use('seaborn-v0_8-darkgrid')
plt.rcParams['figure.facecolor'] = 'white'
plt.rcParams['axes.facecolor'] = '#f8f9fa'
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Arial', 'DejaVu Sans']

# Data
projects = ['Consola\n(2.4K LOC)', 'ts-node\n(11K LOC)', 'tRPC\n(44K LOC)']
project_sizes = [2383, 10974, 43989]
lsp_times = [137, 297, 688]
agent_times = [203, 374, 1342]
token_usage = [3990, 32835, 112645]
files_modified = [4, 5, 43]
occurrences_changed = [7, 14, 241]

# Colors
lsp_color = '#667eea'
agent_color = '#764ba2'

# Create output directory
output_dir = Path('charts')
output_dir.mkdir(exist_ok=True)

def save_chart(fig, name):
    """Save chart with high DPI for quality."""
    fig.tight_layout()
    fig.savefig(output_dir / f'{name}.png', dpi=300, bbox_inches='tight')
    print(f'✓ Saved {name}.png')
    plt.close(fig)

# Chart 1: Execution Time Comparison
fig, ax = plt.subplots(figsize=(10, 6))
x = np.arange(len(projects))
width = 0.35

bars1 = ax.bar(x - width/2, lsp_times, width, label='LSP', color=lsp_color, alpha=0.8)
bars2 = ax.bar(x + width/2, agent_times, width, label='Agent', color=agent_color, alpha=0.8)

ax.set_xlabel('Project Size', fontsize=12, fontweight='bold')
ax.set_ylabel('Execution Time (ms)', fontsize=12, fontweight='bold')
ax.set_title('Execution Time Comparison: LSP vs Agent Refactoring', fontsize=14, fontweight='bold', pad=20)
ax.set_xticks(x)
ax.set_xticklabels(projects)
ax.legend(fontsize=11)
ax.grid(axis='y', alpha=0.3)

# Add value labels on bars
for bars in [bars1, bars2]:
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height)}ms',
                ha='center', va='bottom', fontsize=9, fontweight='bold')

save_chart(fig, '1_execution_time')

# Chart 2: Token Usage
fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.bar(projects, token_usage, color=agent_color, alpha=0.8, edgecolor='black', linewidth=1.5)

ax.set_xlabel('Project Size', fontsize=12, fontweight='bold')
ax.set_ylabel('Tokens Used', fontsize=12, fontweight='bold')
ax.set_title('Token Usage by Project Size (Agent Approach)\nLSP: 0 tokens',
             fontsize=14, fontweight='bold', pad=20)
ax.grid(axis='y', alpha=0.3)

# Add value labels
for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height,
            f'{int(height):,}',
            ha='center', va='bottom', fontsize=10, fontweight='bold')

# Format y-axis
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{int(x/1000)}K'))

save_chart(fig, '2_token_usage')

# Chart 3: Performance Advantage
fig, ax = plt.subplots(figsize=(10, 6))
advantages = [(agent - lsp) / lsp * 100 for lsp, agent in zip(lsp_times, agent_times)]
bars = ax.bar(projects, advantages, color='#2ecc71', alpha=0.8, edgecolor='black', linewidth=1.5)

ax.set_xlabel('Project Size', fontsize=12, fontweight='bold')
ax.set_ylabel('Performance Advantage (%)', fontsize=12, fontweight='bold')
ax.set_title('LSP Speed Advantage Over Agent Approach', fontsize=14, fontweight='bold', pad=20)
ax.grid(axis='y', alpha=0.3)

# Add value labels
for bar in bars:
    height = bar.get_height()
    ax.text(bar.get_x() + bar.get_width()/2., height,
            f'{height:.1f}%',
            ha='center', va='bottom', fontsize=11, fontweight='bold')

save_chart(fig, '3_performance_advantage')

# Chart 4: Scalability (Line Chart)
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot(project_sizes, lsp_times, 'o-', color=lsp_color, linewidth=3,
        markersize=10, label='LSP', markeredgecolor='black', markeredgewidth=1.5)
ax.plot(project_sizes, agent_times, 's-', color=agent_color, linewidth=3,
        markersize=10, label='Agent', markeredgecolor='black', markeredgewidth=1.5)

ax.set_xlabel('Project Size (Lines of Code)', fontsize=12, fontweight='bold')
ax.set_ylabel('Execution Time (ms)', fontsize=12, fontweight='bold')
ax.set_title('Scalability Analysis: Performance vs Project Size', fontsize=14, fontweight='bold', pad=20)
ax.legend(fontsize=11)
ax.grid(True, alpha=0.3)

# Format x-axis
ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{int(x/1000)}K'))

# Add annotations
for i, (size, lsp, agent) in enumerate(zip(project_sizes, lsp_times, agent_times)):
    ax.annotate(f'{lsp}ms', (size, lsp), textcoords="offset points",
                xytext=(0,10), ha='center', fontsize=9, fontweight='bold')
    ax.annotate(f'{agent}ms', (size, agent), textcoords="offset points",
                xytext=(0,-15), ha='center', fontsize=9, fontweight='bold')

save_chart(fig, '4_scalability')

# Chart 5: Files and Occurrences
fig, ax = plt.subplots(figsize=(10, 6))
x = np.arange(len(projects))
width = 0.35

bars1 = ax.bar(x - width/2, files_modified, width, label='Files Modified',
               color='#3498db', alpha=0.8, edgecolor='black', linewidth=1)
bars2 = ax.bar(x + width/2, occurrences_changed, width, label='Occurrences Changed',
               color='#9b59b6', alpha=0.8, edgecolor='black', linewidth=1)

ax.set_xlabel('Project', fontsize=12, fontweight='bold')
ax.set_ylabel('Count', fontsize=12, fontweight='bold')
ax.set_title('Refactoring Impact: Files Modified and Occurrences Changed',
             fontsize=14, fontweight='bold', pad=20)
ax.set_xticks(x)
ax.set_xticklabels(projects)
ax.legend(fontsize=11)
ax.grid(axis='y', alpha=0.3)

# Add value labels
for bars in [bars1, bars2]:
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height)}',
                ha='center', va='bottom', fontsize=10, fontweight='bold')

save_chart(fig, '5_impact')

# Chart 6: Cost Comparison
fig, ax = plt.subplots(figsize=(10, 6))
cost_per_million = 3  # $3 per 1M tokens
costs = [tokens / 1000000 * cost_per_million for tokens in token_usage]

x = np.arange(len(projects))
width = 0.35

bars1 = ax.bar(x - width/2, [0, 0, 0], width, label='LSP Cost',
               color=lsp_color, alpha=0.8, edgecolor='black', linewidth=1)
bars2 = ax.bar(x + width/2, costs, width, label='Agent Cost',
               color=agent_color, alpha=0.8, edgecolor='black', linewidth=1)

ax.set_xlabel('Project Size', fontsize=12, fontweight='bold')
ax.set_ylabel('Cost per Refactoring ($)', fontsize=12, fontweight='bold')
ax.set_title('Cost Comparison at $3/1M Tokens', fontsize=14, fontweight='bold', pad=20)
ax.set_xticks(x)
ax.set_xticklabels(projects)
ax.legend(fontsize=11)
ax.grid(axis='y', alpha=0.3)

# Add value labels
for i, (bar, cost) in enumerate(zip(bars2, costs)):
    height = bar.get_height()
    if height > 0:
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'${cost:.4f}',
                ha='center', va='bottom', fontsize=10, fontweight='bold')

save_chart(fig, '6_cost_comparison')

# Chart 7: Combined Summary Dashboard
fig = plt.figure(figsize=(16, 10))
gs = fig.add_gridspec(2, 3, hspace=0.3, wspace=0.3)

# Time comparison (top left)
ax1 = fig.add_subplot(gs[0, 0])
x = np.arange(len(projects))
width = 0.35
ax1.bar(x - width/2, lsp_times, width, label='LSP', color=lsp_color, alpha=0.8)
ax1.bar(x + width/2, agent_times, width, label='Agent', color=agent_color, alpha=0.8)
ax1.set_title('Execution Time', fontweight='bold')
ax1.set_xticks(x)
ax1.set_xticklabels(['Small', 'Medium', 'Large'], fontsize=9)
ax1.set_ylabel('Time (ms)')
ax1.legend(fontsize=9)
ax1.grid(axis='y', alpha=0.3)

# Token usage (top middle)
ax2 = fig.add_subplot(gs[0, 1])
ax2.bar(['Small', 'Medium', 'Large'], token_usage, color=agent_color, alpha=0.8)
ax2.set_title('Agent Token Usage', fontweight='bold')
ax2.set_ylabel('Tokens')
ax2.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{int(x/1000)}K'))
ax2.grid(axis='y', alpha=0.3)

# Performance advantage (top right)
ax3 = fig.add_subplot(gs[0, 2])
ax3.bar(['Small', 'Medium', 'Large'], advantages, color='#2ecc71', alpha=0.8)
ax3.set_title('LSP Speed Advantage', fontweight='bold')
ax3.set_ylabel('Advantage (%)')
ax3.grid(axis='y', alpha=0.3)
for i, adv in enumerate(advantages):
    ax3.text(i, adv, f'{adv:.0f}%', ha='center', va='bottom', fontweight='bold')

# Scalability (bottom, spans 2 columns)
ax4 = fig.add_subplot(gs[1, :2])
ax4.plot(project_sizes, lsp_times, 'o-', color=lsp_color, linewidth=2.5,
        markersize=8, label='LSP')
ax4.plot(project_sizes, agent_times, 's-', color=agent_color, linewidth=2.5,
        markersize=8, label='Agent')
ax4.set_title('Scalability', fontweight='bold')
ax4.set_xlabel('Project Size (LOC)')
ax4.set_ylabel('Time (ms)')
ax4.legend()
ax4.grid(True, alpha=0.3)
ax4.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{int(x/1000)}K'))

# Key metrics (bottom right)
ax5 = fig.add_subplot(gs[1, 2])
ax5.axis('off')
metrics_text = f"""
KEY FINDINGS

✓ Speed Advantage
  21-95% faster

✓ Token Savings
  149,470 total

✓ Accuracy
  100% (both)

✓ Cost Savings
  $0.45 total

✓ Best For LSP
  Mechanical refactorings

✓ Best For Agent
  Semantic changes
"""
ax5.text(0.1, 0.5, metrics_text, fontsize=11, verticalalignment='center',
         fontfamily='monospace', bbox=dict(boxstyle='round', facecolor='#f8f9fa', alpha=0.8))

fig.suptitle('Agent vs LSP Refactoring: Complete Analysis',
             fontsize=16, fontweight='bold', y=0.98)

save_chart(fig, '7_summary_dashboard')

print('\n✅ All charts generated successfully!')
print(f'📁 Charts saved to: {output_dir.absolute()}')
print('\nGenerated charts:')
print('  1. Execution Time Comparison')
print('  2. Token Usage')
print('  3. Performance Advantage')
print('  4. Scalability Analysis')
print('  5. Refactoring Impact')
print('  6. Cost Comparison')
print('  7. Summary Dashboard')
