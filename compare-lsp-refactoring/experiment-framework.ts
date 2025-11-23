/**
 * Experiment Framework for Agent vs LSP Refactoring Comparison
 */

export interface RefactoringTask {
  type: 'variable' | 'function' | 'class';
  oldName: string;
  newName: string;
  location: {
    file: string;
    line: number;
    column: number;
  };
}

export interface ExperimentResult {
  approach: 'agent' | 'lsp';
  projectSize: 'small' | 'medium' | 'large';
  refactoringType: string;
  success: boolean;
  timeMs: number;
  tokensUsed?: number;
  filesModified: number;
  occurrencesChanged: number;
  errors?: string[];
}

export interface ProjectMetrics {
  name: string;
  size: 'small' | 'medium' | 'large';
  totalLines: number;
  totalFiles: number;
  dependencies: number;
}
