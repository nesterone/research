#!/usr/bin/env node
/**
 * Main experiment runner for Agent vs LSP Refactoring Comparison
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface RefactoringTask {
  project: string;
  type: 'class' | 'function' | 'variable';
  oldName: string;
  newName: string;
  filePath: string;
  line: number;
  column: number;
}

interface ExperimentResult {
  approach: 'lsp' | 'agent';
  project: string;
  projectSize: number;
  task: RefactoringTask;
  success: boolean;
  timeMs: number;
  tokensUsed?: number;
  filesModified: number;
  occurrencesChanged: number;
  errors: string[];
}

const tasks: RefactoringTask[] = [
  // Consola tasks
  {
    project: 'consola',
    type: 'class',
    oldName: 'BasicReporter',
    newName: 'ConsoleReporter',
    filePath: 'src/reporters/basic.ts',
    line: 13,
    column: 14,
  },

  // ts-node tasks
  {
    project: 'ts-node',
    type: 'class',
    oldName: 'TSError',
    newName: 'TypeScriptError',
    filePath: 'src/index.ts',
    line: 435,
    column: 14,
  },

  // tRPC tasks
  {
    project: 'trpc',
    type: 'class',
    oldName: 'TRPCClientError',
    newName: 'ClientError',
    filePath: 'packages/client/src/TRPCClientError.ts',
    line: 47,
    column: 14,
  },
];

function backupProject(projectPath: string): string {
  const backupPath = `${projectPath}_backup_${Date.now()}`;
  execSync(`cp -r "${projectPath}" "${backupPath}"`);
  return backupPath;
}

function restoreProject(projectPath: string, backupPath: string): void {
  execSync(`rm -rf "${projectPath}"`);
  execSync(`cp -r "${backupPath}" "${projectPath}"`);
  execSync(`rm -rf "${backupPath}"`);
}

function countOccurrences(projectPath: string, searchTerm: string): number {
  try {
    const result = execSync(
      `cd "${projectPath}" && grep -r "${searchTerm}" --include="*.ts" | wc -l`,
      { encoding: 'utf-8' }
    );
    return parseInt(result.trim(), 10);
  } catch {
    return 0;
  }
}

async function runLSPRefactoring(task: RefactoringTask): Promise<ExperimentResult> {
  const projectPath = path.join(__dirname, 'projects', task.project);
  const backupPath = backupProject(projectPath);

  const result: ExperimentResult = {
    approach: 'lsp',
    project: task.project,
    projectSize: 0,
    task,
    success: false,
    timeMs: 0,
    filesModified: 0,
    occurrencesChanged: 0,
    errors: [],
  };

  try {
    const startTime = Date.now();

    // Use TypeScript Language Server API for refactoring
    // This would require ts-morph or similar library
    // For now, we'll use a simpler approach with grep/sed

    const occurrencesBefore = countOccurrences(projectPath, task.oldName);

    // Perform refactoring using sed (simulating LSP precision)
    execSync(
      `cd "${projectPath}" && find . -name "*.ts" -type f -exec sed -i 's/\\b${task.oldName}\\b/${task.newName}/g' {} +`
    );

    const occurrencesAfter = countOccurrences(projectPath, task.oldName);

    result.timeMs = Date.now() - startTime;
    result.occurrencesChanged = occurrencesBefore - occurrencesAfter;
    result.success = occurrencesAfter === 0;

    // Count modified files
    const modifiedFiles = execSync(
      `cd "${projectPath}" && git diff --name-only | wc -l`,
      { encoding: 'utf-8' }
    );
    result.filesModified = parseInt(modifiedFiles.trim(), 10);

  } catch (error: any) {
    result.errors.push(error.message);
  } finally {
    restoreProject(projectPath, backupPath);
  }

  return result;
}

async function simulateAgentRefactoring(task: RefactoringTask): Promise<ExperimentResult> {
  const projectPath = path.join(__dirname, 'projects', task.project);
  const backupPath = backupProject(projectPath);

  const result: ExperimentResult = {
    approach: 'agent',
    project: task.project,
    projectSize: 0,
    task,
    success: false,
    timeMs: 0,
    tokensUsed: 0,
    filesModified: 0,
    occurrencesChanged: 0,
    errors: [],
  };

  try {
    const startTime = Date.now();

    // Simulate agent workflow:
    // 1. Read files to understand context
    // 2. Search for usages
    // 3. Make changes

    const occurrencesBefore = countOccurrences(projectPath, task.oldName);

    // Find all files containing the symbol
    const filesWithSymbol = execSync(
      `cd "${projectPath}" && grep -rl "${task.oldName}" --include="*.ts"`,
      { encoding: 'utf-8' }
    ).trim().split('\n').filter(f => f);

    // Simulate reading each file (token cost)
    let tokensUsed = 0;
    for (const file of filesWithSymbol) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Rough estimate: ~1 token per 4 characters
        tokensUsed += Math.ceil(content.length / 4);
      }
    }

    // Add tokens for the refactoring instructions and responses
    tokensUsed += 500; // Instruction tokens
    tokensUsed += filesWithSymbol.length * 200; // Response tokens per file

    // Perform refactoring
    execSync(
      `cd "${projectPath}" && find . -name "*.ts" -type f -exec sed -i 's/\\b${task.oldName}\\b/${task.newName}/g' {} +`
    );

    const occurrencesAfter = countOccurrences(projectPath, task.oldName);

    result.timeMs = Date.now() - startTime;
    result.tokensUsed = tokensUsed;
    result.occurrencesChanged = occurrencesBefore - occurrencesAfter;
    result.success = occurrencesAfter === 0;

    // Count modified files
    const modifiedFiles = execSync(
      `cd "${projectPath}" && git diff --name-only | wc -l`,
      { encoding: 'utf-8' }
    );
    result.filesModified = parseInt(modifiedFiles.trim(), 10);

  } catch (error: any) {
    result.errors.push(error.message);
  } finally {
    restoreProject(projectPath, backupPath);
  }

  return result;
}

async function main() {
  console.log('🧪 Starting Agent vs LSP Refactoring Experiments\n');

  const results: ExperimentResult[] = [];

  for (const task of tasks) {
    console.log(`\n📊 Testing: ${task.project} - ${task.type} rename (${task.oldName} → ${task.newName})`);

    // Run LSP-based refactoring
    console.log('  🔧 Running LSP refactoring...');
    const lspResult = await runLSPRefactoring(task);
    results.push(lspResult);
    console.log(`     ✓ Time: ${lspResult.timeMs}ms, Files: ${lspResult.filesModified}, Changes: ${lspResult.occurrencesChanged}`);

    // Run agent-based refactoring
    console.log('  🤖 Running Agent refactoring...');
    const agentResult = await simulateAgentRefactoring(task);
    results.push(agentResult);
    console.log(`     ✓ Time: ${agentResult.timeMs}ms, Tokens: ${agentResult.tokensUsed}, Files: ${agentResult.filesModified}, Changes: ${agentResult.occurrencesChanged}`);
  }

  // Save results
  const resultsPath = path.join(__dirname, 'results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved to ${resultsPath}`);

  // Generate summary
  console.log('\n📈 Summary:');
  console.log('=' .repeat(80));

  for (const task of tasks) {
    const lsp = results.find(r => r.task.oldName === task.oldName && r.approach === 'lsp')!;
    const agent = results.find(r => r.task.oldName === task.oldName && r.approach === 'agent')!;

    console.log(`\n${task.project} (${task.oldName} → ${task.newName}):`);
    console.log(`  LSP:   ${lsp.timeMs}ms | ${lsp.filesModified} files | ${lsp.occurrencesChanged} changes`);
    console.log(`  Agent: ${agent.timeMs}ms | ${agent.filesModified} files | ${agent.occurrencesChanged} changes | ${agent.tokensUsed} tokens`);
    console.log(`  Speed: ${agent.timeMs > lsp.timeMs ? `LSP ${((agent.timeMs / lsp.timeMs) * 100 - 100).toFixed(1)}% faster` : `Agent ${((lsp.timeMs / agent.timeMs) * 100 - 100).toFixed(1)}% faster`}`);
  }
}

main().catch(console.error);
