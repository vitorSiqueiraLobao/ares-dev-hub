import { simpleGit, SimpleGit, StatusResult } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

export interface FileTreeItem {
  name: string;
  path: string;
  isDirectory: boolean;
  extension?: string;
  size?: number;
  status?: string;
}

export class GitService {
  private git: SimpleGit;

  constructor(private workingDir: string = config.workspaceDir) {
    this.git = simpleGit(workingDir);
  }

  /**
   * Retrieves Git status of the workspace.
   */
  public async getStatus(): Promise<StatusResult> {
    try {
      return await this.git.status();
    } catch (err: any) {
      throw new Error(`Erro ao obter status do git: ${err.message}`);
    }
  }

  /**
   * Generates diff for a specific file or the entire working tree.
   */
  public async getDiff(filePath?: string): Promise<string> {
    try {
      if (filePath) {
        return await this.git.diff([filePath]);
      }
      return await this.git.diff();
    } catch (err: any) {
      return '';
    }
  }

  /**
   * Gets recent commits log.
   */
  public async getLog(maxCount: number = 10) {
    try {
      return await this.git.log({ maxCount });
    } catch (err: any) {
      return { all: [] };
    }
  }

  /**
   * Scans the workspace directory recursively to build a file tree.
   */
  public async getFileTree(dir: string = this.workingDir, relativeTo: string = this.workingDir): Promise<FileTreeItem[]> {
    const items: FileTreeItem[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden folders, node_modules, git, dist
        if (
          entry.name.startsWith('.') ||
          entry.name === 'node_modules' ||
          entry.name === 'dist' ||
          entry.name === 'build'
        ) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(relativeTo, fullPath);

        if (entry.isDirectory()) {
          items.push({
            name: entry.name,
            path: relPath,
            isDirectory: true,
          });
          const subItems = await this.getFileTree(fullPath, relativeTo);
          items.push(...subItems);
        } else {
          const ext = path.extname(entry.name);
          const stats = await fs.stat(fullPath);
          items.push({
            name: entry.name,
            path: relPath,
            isDirectory: false,
            extension: ext,
            size: stats.size,
          });
        }
      }
    } catch (err) {
      // directory error
    }

    return items;
  }

  /**
   * Reads raw file content from workspace.
   */
  public async readFile(relativePath: string): Promise<string> {
    const fullPath = path.join(this.workingDir, relativePath);
    return await fs.readFile(fullPath, 'utf-8');
  }

  /**
   * Writes raw file content to workspace.
   */
  public async writeFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.workingDir, relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
  }
}

export const gitService = new GitService();
