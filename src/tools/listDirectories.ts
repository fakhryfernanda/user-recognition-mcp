import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { resolveSafePath, getContextDir, SecurityError } from '../utils/resolveSafePath.js';

function listDirsRecursive(dir: string, contextDir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      results.push(path.relative(contextDir, fullPath));
      results.push(...listDirsRecursive(fullPath, contextDir));
    }
  }

  return results;
}

export function registerListDirectories(server: McpServer): void {
  server.tool(
    'list_directories',
    'List subdirectories inside the context directory. Optionally filter by a subdirectory (e.g. "work").',
    { directory: z.string().optional() },
    ({ directory }) => {
      try {
        const contextDir = getContextDir();
        const targetPath = directory ? resolveSafePath(directory) : contextDir;

        if (!fs.existsSync(targetPath)) {
          return {
            content: [{ type: 'text', text: `Directory "${directory}" not found` }],
            isError: true,
          };
        }

        const dirs = listDirsRecursive(targetPath, contextDir);
        return {
          content: [{ type: 'text', text: JSON.stringify(dirs) }],
        };
      } catch (err) {
        if (err instanceof SecurityError) {
          return {
            content: [{ type: 'text', text: `Security error: ${err.message}` }],
            isError: true,
          };
        }
        throw err;
      }
    }
  );
}
