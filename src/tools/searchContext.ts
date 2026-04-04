import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { getContextDir, listFilesRecursive } from '../utils/resolveSafePath.js';

interface SearchMatch {
  path: string;
  snippet: string;
  lineNumber: number;
}

export function registerSearchContext(server: McpServer): void {
  server.tool(
    'search_context',
    'Full-text search across all context files. Returns matches with path, line number, and surrounding snippet.',
    { query: z.string().min(1) },
    ({ query }) => {
      const contextDir = getContextDir();
      const files = listFilesRecursive(contextDir);
      const matches: SearchMatch[] = [];
      const lowerQuery = query.toLowerCase();

      for (const relativePath of files) {
        const fullPath = path.join(contextDir, relativePath);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(lowerQuery)) {
            const start = Math.max(0, i - 1);
            const end = Math.min(lines.length - 1, i + 1);
            const snippet = lines.slice(start, end + 1).join('\n');
            matches.push({
              path: relativePath,
              snippet,
              lineNumber: i + 1,
            });
          }
        }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(matches) }],
      };
    }
  );
}
