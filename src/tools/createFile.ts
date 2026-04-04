import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { resolveSafePath, SecurityError } from '../utils/resolveSafePath.js';

export function registerCreateFile(server: McpServer): void {
  server.tool(
    'create_file',
    'Create a new file in the context directory with the specified content.',
    {
      path: z.string().min(1),
      content: z.string(),
    },
    ({ path: filePath, content }) => {
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

        // Check if file already exists
        if (fs.existsSync(resolved)) {
          const stat = fs.statSync(resolved);
          if (stat.isDirectory()) {
            return {
              content: [
                {
                  type: 'text',
                  text: `"${filePath}" is a directory, not a file`,
                },
              ],
              isError: true,
            };
          }
          return {
            content: [
              {
                type: 'text',
                text: `File already exists: "${filePath}"`,
              },
            ],
            isError: true,
          };
        }

        // Auto-create parent directories if needed
        const parentDir = path.dirname(resolved);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        // Create the file
        fs.writeFileSync(resolved, content, 'utf-8');

        return {
          content: [
            {
              type: 'text',
              text: `Successfully created file: "${filePath}"`,
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
