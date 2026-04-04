import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import { resolveSafePath, SecurityError } from '../utils/resolveSafePath.js';

export function registerReadFile(server: McpServer): void {
  server.tool(
    'read_file',
    'Read the contents of a context file by its relative path (e.g. "personal/background.md").',
    { path: z.string().min(1) },
    ({ path: filePath }) => {
      try {
        const resolved = resolveSafePath(filePath);

        if (!fs.existsSync(resolved)) {
          return {
            content: [{ type: 'text', text: `File not found: "${filePath}"` }],
            isError: true,
          };
        }

        const stat = fs.statSync(resolved);
        if (!stat.isFile()) {
          return {
            content: [{ type: 'text', text: `"${filePath}" is not a file` }],
            isError: true,
          };
        }

        const content = fs.readFileSync(resolved, 'utf-8');
        return {
          content: [{ type: 'text', text: content }],
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
