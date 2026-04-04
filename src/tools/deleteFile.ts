import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import { resolveSafePath, SecurityError } from '../utils/resolveSafePath.js';

export function registerDeleteFile(server: McpServer): void {
  server.tool(
    'delete_file',
    'Delete a file from the context directory.',
    {
      path: z.string().min(1),
    },
    ({ path: filePath }) => {
      try {
        // Reject hidden files
        const basename = filePath.split('/').pop() ?? '';
        if (basename.startsWith('.')) {
          return {
            content: [
              {
                type: 'text',
                text: `File not found: "${filePath}"`,
              },
            ],
            isError: true,
          };
        }

        const resolved = resolveSafePath(filePath);

        // Check file exists
        if (!fs.existsSync(resolved)) {
          return {
            content: [
              {
                type: 'text',
                text: `File not found: "${filePath}"`,
              },
            ],
            isError: true,
          };
        }

        // Check it's a file, not a directory
        const stat = fs.statSync(resolved);
        if (!stat.isFile()) {
          return {
            content: [
              {
                type: 'text',
                text: `"${filePath}" is not a file`,
              },
            ],
            isError: true,
          };
        }

        // Delete the file
        fs.unlinkSync(resolved);

        return {
          content: [
            {
              type: 'text',
              text: `Successfully deleted file: "${filePath}"`,
            },
          ],
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
