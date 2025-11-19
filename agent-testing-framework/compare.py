#!/usr/bin/env python3
"""
Agent Testing Framework - Comparison Tool
Analyzes and compares results from multiple agent runs.
"""

import json
import sys
from pathlib import Path
from typing import Dict, List, Any
from collections import defaultdict


class ResultsAnalyzer:
    """Analyzes and compares agent execution results."""

    def load_results(self, results_file: str) -> Dict[str, Any]:
        """Load results from JSON file."""
        with open(results_file, 'r') as f:
            return json.load(f)

    def compare_runs(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comparative analysis of runs."""
        runs = results['runs']

        analysis = {
            'task': results['task'],
            'total_runs': len(runs),
            'summary': {},
            'rankings': {},
            'details': []
        }

        # Collect metrics
        for run in runs:
            config = run['config']
            analysis['details'].append({
                'config': config,
                'execution_time': run['execution_time'],
                'validation_passed': run['validation']['passed'],
                'score': run['validation']['score'],
                'max_score': run['validation']['max_score'],
                'score_pct': (run['validation']['score'] / run['validation']['max_score'] * 100)
                             if run['validation']['max_score'] > 0 else 0,
                'actions_count': len(run['actions']),
                'files_modified': len(run['files_modified']),
                'commits': len(run['commits'])
            })

        # Rank by different criteria
        details = analysis['details']

        # Best validation score
        best_score = max(details, key=lambda x: x['score_pct'])
        analysis['rankings']['best_score'] = {
            'config': best_score['config'],
            'score': f"{best_score['score']}/{best_score['max_score']} ({best_score['score_pct']:.1f}%)"
        }

        # Fastest execution
        fastest = min(details, key=lambda x: x['execution_time'])
        analysis['rankings']['fastest'] = {
            'config': fastest['config'],
            'time': f"{fastest['execution_time']:.2f}s"
        }

        # Most efficient (best score per second)
        for d in details:
            d['efficiency'] = d['score_pct'] / d['execution_time'] if d['execution_time'] > 0 else 0
        most_efficient = max(details, key=lambda x: x['efficiency'])
        analysis['rankings']['most_efficient'] = {
            'config': most_efficient['config'],
            'efficiency': f"{most_efficient['efficiency']:.2f} points/sec"
        }

        # Summary stats
        analysis['summary'] = {
            'avg_execution_time': sum(d['execution_time'] for d in details) / len(details),
            'avg_score_pct': sum(d['score_pct'] for d in details) / len(details),
            'success_rate': sum(1 for d in details if d['validation_passed']) / len(details) * 100
        }

        return analysis

    def print_comparison(self, analysis: Dict[str, Any]):
        """Pretty print comparison results."""
        print(f"\n{'='*70}")
        print(f"AGENT COMPARISON REPORT: {analysis['task']}")
        print(f"{'='*70}\n")

        # Summary
        print("SUMMARY")
        print("-" * 70)
        print(f"Total runs:            {analysis['total_runs']}")
        print(f"Success rate:          {analysis['summary']['success_rate']:.1f}%")
        print(f"Avg execution time:    {analysis['summary']['avg_execution_time']:.2f}s")
        print(f"Avg score:             {analysis['summary']['avg_score_pct']:.1f}%")

        # Rankings
        print(f"\n{'='*70}")
        print("RANKINGS")
        print("-" * 70)
        print(f"🏆 Best Score:        {analysis['rankings']['best_score']['config']}")
        print(f"                      {analysis['rankings']['best_score']['score']}")
        print(f"\n⚡ Fastest:           {analysis['rankings']['fastest']['config']}")
        print(f"                      {analysis['rankings']['fastest']['time']}")
        print(f"\n💎 Most Efficient:    {analysis['rankings']['most_efficient']['config']}")
        print(f"                      {analysis['rankings']['most_efficient']['efficiency']}")

        # Detailed comparison table
        print(f"\n{'='*70}")
        print("DETAILED RESULTS")
        print("-" * 70)
        print(f"{'Config':<20} {'Time':<10} {'Score':<12} {'Pass':<8} {'Actions':<10}")
        print("-" * 70)

        for detail in sorted(analysis['details'], key=lambda x: x['score_pct'], reverse=True):
            status = '✓' if detail['validation_passed'] else '✗'
            print(f"{detail['config']:<20} "
                  f"{detail['execution_time']:>6.2f}s   "
                  f"{detail['score']}/{detail['max_score']} ({detail['score_pct']:>5.1f}%)  "
                  f"{status:<8} "
                  f"{detail['actions_count']:<10}")

        print(f"{'='*70}\n")

    def generate_markdown_report(self, analysis: Dict[str, Any], output_file: str):
        """Generate a markdown report."""
        lines = []

        lines.append(f"# Agent Comparison Report: {analysis['task']}\n")

        lines.append("## Summary\n")
        lines.append(f"- **Total runs**: {analysis['total_runs']}")
        lines.append(f"- **Success rate**: {analysis['summary']['success_rate']:.1f}%")
        lines.append(f"- **Avg execution time**: {analysis['summary']['avg_execution_time']:.2f}s")
        lines.append(f"- **Avg score**: {analysis['summary']['avg_score_pct']:.1f}%\n")

        lines.append("## Rankings\n")
        lines.append(f"### 🏆 Best Score")
        lines.append(f"**{analysis['rankings']['best_score']['config']}** - "
                    f"{analysis['rankings']['best_score']['score']}\n")
        lines.append(f"### ⚡ Fastest")
        lines.append(f"**{analysis['rankings']['fastest']['config']}** - "
                    f"{analysis['rankings']['fastest']['time']}\n")
        lines.append(f"### 💎 Most Efficient")
        lines.append(f"**{analysis['rankings']['most_efficient']['config']}** - "
                    f"{analysis['rankings']['most_efficient']['efficiency']}\n")

        lines.append("## Detailed Results\n")
        lines.append("| Config | Time | Score | Pass | Actions | Files | Commits |")
        lines.append("|--------|------|-------|------|---------|-------|---------|")

        for detail in sorted(analysis['details'], key=lambda x: x['score_pct'], reverse=True):
            status = '✓' if detail['validation_passed'] else '✗'
            lines.append(
                f"| {detail['config']} | "
                f"{detail['execution_time']:.2f}s | "
                f"{detail['score']}/{detail['max_score']} ({detail['score_pct']:.1f}%) | "
                f"{status} | "
                f"{detail['actions_count']} | "
                f"{detail['files_modified']} | "
                f"{detail['commits']} |"
            )

        with open(output_file, 'w') as f:
            f.write('\n'.join(lines))

        print(f"Markdown report saved to: {output_file}")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='Agent Testing Framework - Results Comparison')
    parser.add_argument('results', help='Path to results JSON file')
    parser.add_argument('--markdown', help='Generate markdown report to file')
    parser.add_argument('--json', help='Save analysis as JSON to file')

    args = parser.parse_args()

    analyzer = ResultsAnalyzer()
    results = analyzer.load_results(args.results)
    analysis = analyzer.compare_runs(results)

    # Print to console
    analyzer.print_comparison(analysis)

    # Generate markdown if requested
    if args.markdown:
        analyzer.generate_markdown_report(analysis, args.markdown)

    # Save JSON if requested
    if args.json:
        with open(args.json, 'w') as f:
            json.dump(analysis, f, indent=2)
        print(f"Analysis JSON saved to: {args.json}")


if __name__ == '__main__':
    main()
