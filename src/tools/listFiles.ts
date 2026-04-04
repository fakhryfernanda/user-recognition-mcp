import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import { resolveSafePath, getContextDir, listFilesRecursive, SecurityError } from '../utils/resolveSafePath.js';

export function registerListFiles(server: McpServer): void {
  server.tool(
    'list_files',
    'List files in the context directory. Optionally filter by subdirectory (e.g. "work", "personal").',
    { directory: z.string().optional() },
    ({ directory }) => {
      try {
        const targetPath = directory
          ? resolveSafePath(directory)
          : getContextDir();

        if (!fs.existsSync(targetPath)) {
          return {
            content: [{ type: 'text', text: `Directory "${directory}" not found` }],
            isError: true,
          };
        }

        const stat = fs.statSync(targetPath);
        if (!stat.isDirectory()) {
          return {
            content: [{ type: 'text', text: `"${directory}" is not a directory` }],
            isError: true,
          };
        }

        const files = listFilesRecursive(targetPath);
        return {
          content: [{ type: 'text', text: JSON.stringify(files) }],
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
