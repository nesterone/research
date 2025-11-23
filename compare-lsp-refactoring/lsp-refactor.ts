/**
 * LSP-based refactoring implementation using TypeScript Language Server
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

export class LSPRefactorer {
  private program: ts.Program;
  private languageService: ts.LanguageService;

  constructor(private projectRoot: string, private tsConfigPath: string) {
    this.initializeLanguageService();
  }

  private initializeLanguageService() {
    // Read tsconfig
    const configFile = ts.readConfigFile(this.tsConfigPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(this.tsConfigPath)
    );

    // Create language service host
    const files: ts.MapLike<{ version: number }> = {};

    parsedConfig.fileNames.forEach(fileName => {
      files[fileName] = { version: 0 };
    });

    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => parsedConfig.fileNames,
      getScriptVersion: fileName => files[fileName] && files[fileName].version.toString(),
      getScriptSnapshot: fileName => {
        if (!fs.existsSync(fileName)) {
          return undefined;
        }
        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => parsedConfig.options,
      getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory,
    };

    this.languageService = ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
    this.program = this.languageService.getProgram()!;
  }

  /**
   * Rename a symbol using LSP
   */
  async renameSymbol(
    fileName: string,
    position: number,
    newName: string
  ): Promise<{ success: boolean; edits: Map<string, ts.TextChange[]>; timeMs: number }> {
    const startTime = performance.now();

    try {
      const renameLocations = this.languageService.findRenameLocations(
        fileName,
        position,
        false,
        false
      );

      if (!renameLocations) {
        return { success: false, edits: new Map(), timeMs: performance.now() - startTime };
      }

      // Group changes by file
      const edits = new Map<string, ts.TextChange[]>();

      for (const location of renameLocations) {
        const changes = edits.get(location.fileName) || [];
        changes.push({
          span: location.textSpan,
          newText: newName,
        });
        edits.set(location.fileName, changes);
      }

      return {
        success: true,
        edits,
        timeMs: performance.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        edits: new Map(),
        timeMs: performance.now() - startTime,
      };
    }
  }

  /**
   * Apply text changes to files
   */
  applyEdits(edits: Map<string, ts.TextChange[]>): number {
    let filesModified = 0;

    edits.forEach((changes, fileName) => {
      const sourceFile = this.program.getSourceFile(fileName);
      if (!sourceFile) return;

      let content = sourceFile.getFullText();

      // Sort changes in reverse order to maintain positions
      changes.sort((a, b) => b.span.start - a.span.start);

      for (const change of changes) {
        content =
          content.slice(0, change.span.start) +
          change.newText +
          content.slice(change.span.start + change.span.length);
      }

      fs.writeFileSync(fileName, content, 'utf8');
      filesModified++;
    });

    return filesModified;
  }

  /**
   * Get position from line and column
   */
  getPositionFromLineAndColumn(fileName: string, line: number, column: number): number {
    const sourceFile = this.program.getSourceFile(fileName);
    if (!sourceFile) return -1;

    return ts.getPositionOfLineAndCharacter(sourceFile, line - 1, column - 1);
  }
}
