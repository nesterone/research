/**
 * LSP-based refactoring using ts-morph (TypeScript Compiler API wrapper)
 */

import { Project, SourceFile } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

export interface RefactoringResult {
  success: boolean;
  timeMs: number;
  filesModified: number;
  occurrencesChanged: number;
  errors: string[];
}

export class LSPRefactorer {
  private project: Project;

  constructor(private projectPath: string, tsConfigPath?: string) {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath || path.join(projectPath, 'tsconfig.json'),
      skipAddingFilesFromTsConfig: false,
    });
  }

  /**
   * Rename a symbol using TypeScript Language Server APIs
   */
  async renameSymbol(
    filePath: string,
    oldName: string,
    newName: string,
    line: number,
    column: number
  ): Promise<RefactoringResult> {
    const startTime = Date.now();
    const result: RefactoringResult = {
      success: false,
      timeMs: 0,
      filesModified: 0,
      occurrencesChanged: 0,
      errors: [],
    };

    try {
      const absolutePath = path.join(this.projectPath, filePath);
      const sourceFile = this.project.getSourceFile(absolutePath);

      if (!sourceFile) {
        result.errors.push(`Source file not found: ${absolutePath}`);
        return result;
      }

      // Find the node at the specified position
      const position = sourceFile.compilerNode.getPositionOfLineAndCharacter(line - 1, column - 1);
      const node = sourceFile.getDescendantAtPos(position);

      if (!node) {
        result.errors.push(`No node found at position ${line}:${column}`);
        return result;
      }

      // Try to find the symbol
      const symbol = node.getSymbol();
      if (!symbol) {
        result.errors.push(`No symbol found for ${oldName}`);
        return result;
      }

      // Find all references to the symbol
      const referencedSymbols = this.project.getLanguageService().findReferences(sourceFile.getFilePath(), position);

      const modifiedFiles = new Set<string>();
      let totalChanges = 0;

      // Rename all references
      for (const referencedSymbol of referencedSymbols) {
        for (const reference of referencedSymbol.getReferences()) {
          const refSourceFile = reference.getSourceFile();
          const refNode = reference.getNode();

          // Rename the node
          if (refNode.getText() === oldName) {
            const parent = refNode.getParent();
            if (parent) {
              // Replace the text
              refSourceFile.replaceText(
                [refNode.getStart(), refNode.getEnd()],
                newName
              );
              modifiedFiles.add(refSourceFile.getFilePath());
              totalChanges++;
            }
          }
        }
      }

      // Save all modified files
      await this.project.save();

      result.success = true;
      result.filesModified = modifiedFiles.size;
      result.occurrencesChanged = totalChanges;

    } catch (error: any) {
      result.errors.push(error.message);
    }

    result.timeMs = Date.now() - startTime;
    return result;
  }

  /**
   * Rename a class throughout the project
   */
  async renameClass(
    filePath: string,
    oldName: string,
    newName: string
  ): Promise<RefactoringResult> {
    const startTime = Date.now();
    const result: RefactoringResult = {
      success: false,
      timeMs: 0,
      filesModified: 0,
      occurrencesChanged: 0,
      errors: [],
    };

    try {
      const absolutePath = path.join(this.projectPath, filePath);
      const sourceFile = this.project.getSourceFile(absolutePath);

      if (!sourceFile) {
        result.errors.push(`Source file not found: ${absolutePath}`);
        return result;
      }

      // Find the class declaration
      const classDeclaration = sourceFile.getClass(oldName);
      if (!classDeclaration) {
        result.errors.push(`Class ${oldName} not found in ${filePath}`);
        return result;
      }

      // Use the language service to find all references
      const modifiedFiles = new Set<string>();
      let totalChanges = 0;

      // Rename the class and all its references
      classDeclaration.rename(newName);

      // Track all modified files
      for (const sourceFile of this.project.getSourceFiles()) {
        if (sourceFile.wasForgotten() === false && sourceFile.isSaved() === false) {
          modifiedFiles.add(sourceFile.getFilePath());
        }
      }

      // Count occurrences in all TypeScript files
      for (const file of this.project.getSourceFiles()) {
        const text = file.getFullText();
        const regex = new RegExp(`\\b${newName}\\b`, 'g');
        const matches = text.match(regex);
        if (matches) {
          totalChanges += matches.length;
        }
      }

      // Save all changes
      await this.project.save();

      result.success = true;
      result.filesModified = modifiedFiles.size;
      result.occurrencesChanged = totalChanges;

    } catch (error: any) {
      result.errors.push(error.message);
    }

    result.timeMs = Date.now() - startTime;
    return result;
  }

  /**
   * Rename a function throughout the project
   */
  async renameFunction(
    filePath: string,
    oldName: string,
    newName: string
  ): Promise<RefactoringResult> {
    const startTime = Date.now();
    const result: RefactoringResult = {
      success: false,
      timeMs: 0,
      filesModified: 0,
      occurrencesChanged: 0,
      errors: [],
    };

    try {
      const absolutePath = path.join(this.projectPath, filePath);
      const sourceFile = this.project.getSourceFile(absolutePath);

      if (!sourceFile) {
        result.errors.push(`Source file not found: ${absolutePath}`);
        return result;
      }

      // Find the function declaration
      const functionDeclaration = sourceFile.getFunction(oldName);
      if (!functionDeclaration) {
        result.errors.push(`Function ${oldName} not found in ${filePath}`);
        return result;
      }

      const modifiedFiles = new Set<string>();

      // Rename the function and all its references
      functionDeclaration.rename(newName);

      // Track modified files and count changes
      let totalChanges = 0;
      for (const file of this.project.getSourceFiles()) {
        if (file.wasForgotten() === false && file.isSaved() === false) {
          modifiedFiles.add(file.getFilePath());
          const text = file.getFullText();
          const regex = new RegExp(`\\b${newName}\\b`, 'g');
          const matches = text.match(regex);
          if (matches) {
            totalChanges += matches.length;
          }
        }
      }

      // Save all changes
      await this.project.save();

      result.success = true;
      result.filesModified = modifiedFiles.size;
      result.occurrencesChanged = totalChanges;

    } catch (error: any) {
      result.errors.push(error.message);
    }

    result.timeMs = Date.now() - startTime;
    return result;
  }
}
