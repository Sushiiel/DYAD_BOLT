/**
 * App Generation Service
 * Handles generating app files and managing the preview server
 */

import { spawn, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Buffer } from 'buffer';

const PROJECT_ROOT = '/Users/mymac/project';
const PREVIEW_PORT = 3000;

export interface GeneratedApp {
  name: string;
  path: string;
  files: Record<string, string>;
  status: 'generating' | 'generated' | 'error';
  error?: string;
}

export interface GeneratedFilePayload {
  path: string;
  content: string;
  chatId?: string; // Add chat ID for folder organization
}

let lastGeneratedAppDirectory = PROJECT_ROOT;
let lastPreviewError = '';

export function getLastGeneratedAppDirectory() {
  return lastGeneratedAppDirectory;
}

export function getLastPreviewError() {
  return lastPreviewError;
}

/**
 * Ensure project directory exists
 */
export function ensureProjectDirectory(): boolean {
  try {
    if (!fs.existsSync(PROJECT_ROOT)) {
      fs.mkdirSync(PROJECT_ROOT, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Failed to create project directory:', error);
    return false;
  }
}

/**
 * Generate app files
 */
export function generateAppFiles(appName: string, files: Record<string, string>): GeneratedApp {
  // Store generated directory dynamically (was hardcoded before)
  const appPath = path.join(PROJECT_ROOT, appName);

  try {
    // Create app directory
    if (!fs.existsSync(appPath)) {
      fs.mkdirSync(appPath, { recursive: true });
    }

    // Write all files
    Object.entries(files).forEach(([filePath, content]) => {
      const fullPath = path.join(appPath, filePath);
      const dir = path.dirname(fullPath);

      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(fullPath, content, 'utf-8');
    });

    // Set this as last generated directory for preview
    lastGeneratedAppDirectory = appPath;
    lastPreviewError = '';
    return {
      name: appName,
      path: appPath,
      files,
      status: 'generated',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    lastGeneratedAppDirectory = appPath;
    lastPreviewError = errorMessage;
    return {
      name: appName,
      path: appPath,
      files,
      status: 'error',
      error: errorMessage,
    };
  }
}

/**
 * Start preview server
 */
function isPreviewServerRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`lsof -i :${PREVIEW_PORT}`, (error) => {
      if (!error) {
        resolve(true);
        return;
      }
      resolve(false);
    });
  });
}

function stopPreviewServer(): Promise<void> {
  return new Promise((resolve) => {
    exec(`lsof -ti :${PREVIEW_PORT}`, (error, stdout) => {
      if (error || !stdout) {
        resolve();
        return;
      }

      const pids = stdout
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      for (const pid of pids) {
        const numericPid = Number(pid);

        if (!Number.isNaN(numericPid) && numericPid > 0) {
          try {
            process.kill(numericPid, 'SIGTERM');
          } catch {
            // ignore kill failures
          }
        }
      }

      // give processes a brief moment to settle
      setTimeout(() => resolve(), 250);
    });
  });
}

function sanitizeProjectFilePath(filePath: string): string | null {
  if (!filePath) {
    return null;
  }

  let sanitized = filePath.trim();

  // Remove leading ./ or / characters
  sanitized = sanitized.replace(/^\.+\//, '');
  sanitized = sanitized.replace(/^\/+/, '');

  const prefixes = ['/home/project/', 'home/project/', '/project/', 'project/'];

  for (const prefix of prefixes) {
    if (sanitized.startsWith(prefix)) {
      sanitized = sanitized.slice(prefix.length);
      break;
    }
  }

  const normalized = path.normalize(sanitized).replace(/^\.\//, '');

  if (!normalized || normalized.includes('..')) {
    return null;
  }

  return normalized;
}

function isPathInside(targetPath: string, rootPath: string): boolean {
  const normalizedTarget = path.resolve(targetPath);
  const normalizedRoot = path.resolve(rootPath);

  return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}${path.sep}`);
}

function ensureDirectoryExists(directory: string): boolean {
  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    return true;
  } catch (error) {
    console.error('Failed to ensure directory:', directory, error);
    return false;
  }
}

export function getAppDirectoryForChat(chatId: string): string {
  return path.join(PROJECT_ROOT, chatId);
}

export function resolveProjectDirectory(inputPath?: string, chatId?: string): string | null {
  if (!inputPath) {
    return null;
  }

  const resolvedPath = path.resolve(inputPath);
  const targetRoot = chatId ? path.join(PROJECT_ROOT, chatId) : PROJECT_ROOT;

  if (isPathInside(resolvedPath, targetRoot)) {
    return resolvedPath;
  }

  return null;
}

export function saveGeneratedAppFiles(files: GeneratedFilePayload[], chatId?: string): { success: boolean; writtenFiles?: string[]; error?: string } {
  try {
    ensureProjectDirectory();

    const writtenFiles: string[] = [];

    // Create chat-specific directory if chatId is provided
    const targetDirectory = chatId ? path.join(PROJECT_ROOT, chatId) : PROJECT_ROOT;

    console.log(`[AppGenerationService] Saving ${files.length} files to: ${targetDirectory}`);
    console.log(`[AppGenerationService] Chat ID: ${chatId || 'default'}`);

    if (!fs.existsSync(targetDirectory)) {
      fs.mkdirSync(targetDirectory, { recursive: true });
      console.log(`[AppGenerationService] Created directory: ${targetDirectory}`);
    }

    for (const file of files) {
      if (!file?.path) {
        console.warn('[AppGenerationService] Skipping file without path');
        continue;
      }

      const relativePath = sanitizeProjectFilePath(file.path);

      if (!relativePath) {
        console.warn('[AppGenerationService] Skipping invalid file path:', file.path);
        continue;
      }

      const destination = path.join(targetDirectory, relativePath);

      if (!destination.startsWith(targetDirectory)) {
        console.warn('[AppGenerationService] Skipping file outside target directory:', destination);
        continue;
      }

      const dir = path.dirname(destination);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`[AppGenerationService] Created subdirectory: ${dir}`);
      }

      if (fs.existsSync(destination) && fs.statSync(destination).isDirectory()) {
        console.log('[AppGenerationService] Skipping directory entry:', destination);
        continue;
      }

      const content = file.content ?? '';

      try {
        if (typeof content === 'string' && content.startsWith('__base64:')) {
          const buffer = Buffer.from(content.substring('__base64:'.length), 'base64');
          fs.writeFileSync(destination, buffer);
        } else {
          fs.writeFileSync(destination, content, 'utf-8');
        }

        writtenFiles.push(relativePath);
        console.log(`[AppGenerationService] Wrote file: ${relativePath} (${content.length} chars)`);
      } catch (writeError) {
        console.error(`[AppGenerationService] Failed to write file ${destination}:`, writeError);
      }
    }

    lastGeneratedAppDirectory = targetDirectory;
    console.log(`[AppGenerationService] Successfully wrote ${writtenFiles.length} files`);

    return { success: true, writtenFiles };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[AppGenerationService] Failed to save files:', error);
    return { success: false, error: errMsg };
  }
}

export async function startPreviewServer(options?: {
  forceRestart?: boolean;
  projectDirectory?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const forceRestart = options?.forceRestart ?? false;
    const projectDirectory = options?.projectDirectory
      ? resolveProjectDirectory(options.projectDirectory)
      : null;

    const cwd = projectDirectory || lastGeneratedAppDirectory || PROJECT_ROOT;

    if (!ensureDirectoryExists(cwd)) {
      return { success: false, error: `Project directory not accessible: ${cwd}` };
    }

    lastGeneratedAppDirectory = cwd;

    const isRunning = await isPreviewServerRunning();

    if (isRunning && !forceRestart) {
      lastPreviewError = '';
      return { success: true };
    }

    if (isRunning && forceRestart) {
      await stopPreviewServer();
    }

    return await new Promise((resolve) => {
      let stderr = '';
      const serverProcess = spawn('npm', ['run', 'dev'], {
        cwd,
        detached: true,
        stdio: ['ignore', 'ignore', 'pipe'],
      });

      if (serverProcess.stderr) {
        serverProcess.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }
      serverProcess.unref();

      setTimeout(() => {
        if (stderr) {
          lastPreviewError = stderr;
          resolve({ success: false, error: stderr });
        } else {
          lastPreviewError = '';
          resolve({ success: true });
        }
      }, 4000);
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    lastPreviewError = errMsg;
    return { success: false, error: errMsg };
  }
}

/**
 * Get app file structure
 */
export function getAppFileStructure(appPath: string): Record<string, any> {
  const structure: Record<string, any> = {};

  function walkDir(dir: string, prefix = ''): void {
    try {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        if (file.startsWith('.')) return; // Skip hidden files
        if (file === 'node_modules') return; // Skip node_modules

        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        const key = prefix ? `${prefix}/${file}` : file;

        if (stat.isDirectory()) {
          structure[key] = { type: 'directory', children: {} };
          walkDir(fullPath, key);
        } else {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            structure[key] = {
              type: 'file',
              size: stat.size,
              content: content.substring(0, 500), // First 500 chars
            };
          } catch {
            structure[key] = { type: 'file', size: stat.size, content: '[Binary file]' };
          }
        }
      });
    } catch (error) {
      console.error(`Failed to read directory ${dir}:`, error);
    }
  }

  walkDir(appPath);
  return structure;
}

/**
 * Validate app files
 */
export function validateAppFiles(appPath: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required files
  const requiredFiles = [
    'package.json',
    'app.json',
    'app/_layout.tsx',
    'app/(tabs)/index.tsx',
  ];

  requiredFiles.forEach((file) => {
    const fullPath = path.join(appPath, file);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Missing required file: ${file}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * List DYAD projects
 * This function lists projects that have been synced from Bolt to DYAD
 */
export function listDyadProjects(): any[] {
  try {
    ensureProjectDirectory();

    const entries = fs.readdirSync(PROJECT_ROOT, { withFileTypes: true });

    const projects = entries
      .filter(entry => entry.isDirectory())
      .map(entry => {
        const fullPath = path.join(PROJECT_ROOT, entry.name);
        const packageJsonPath = path.join(fullPath, 'package.json');
        const hasPackageJson = fs.existsSync(packageJsonPath);

        let updatedAt = Date.now();
        try {
          const stats = fs.statSync(fullPath);
          updatedAt = stats.mtimeMs;
        } catch (e) {
          // ignore stat error
        }

        return {
          name: entry.name,
          fullPath,
          hasPackageJson,
          updatedAt
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt); // Sort by newest first

    return projects;
  } catch (error) {
    console.error('Failed to list Dyad projects:', error);
    return [];
  }
}
