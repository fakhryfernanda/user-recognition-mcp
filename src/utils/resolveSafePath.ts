import path from 'path';
import fs from 'fs';

export class SecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityError';
  }
}

export function getContextDir(): string {
  const raw = process.env.CONTEXT_DIR;
  if (!raw) throw new Error('CONTEXT_DIR env var is not set');
  return path.resolve(raw);
}

export function resolveSafePath(relativePath: string): string {
  const contextDir = getContextDir();

  // Reject null bytes
  if (relativePath.includes('\0')) {
    throw new SecurityError('Path contains null bytes');
  }

  const resolved = path.resolve(contextDir, relativePath);

  if (!resolved.startsWith(contextDir + path.sep) && resolved !== contextDir) {
    throw new SecurityError(
      `Path "${relativePath}" resolves outside the context directory`
    );
  }

  return resolved;
}

export function listFilesRecursive(dir: string): string[] {
  const contextDir = getContextDir();
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath));
    } else {
      results.push(path.relative(contextDir, fullPath));
    }
  }

  return results;
}
