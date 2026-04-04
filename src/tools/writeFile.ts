import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { resolveSafePath, SecurityError } from '../utils/resolveSafePath.js';

export function registerWriteFile(server: McpServer): void {
  server.tool(
    'write_file',
    'Write full content to a context file, creating it if it does not exist or overwriting if it does.',
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

        // Auto-create parent directories if needed
        const parentDir = path.dirname(resolved);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        // Write the file (create or overwrite)
        fs.writeFileSync(resolved, content, 'utf-8');

        return {
          content: [
            {
              type: 'text',
              text: `Successfully wrote ${content.length} character(s) to "${filePath}"`,
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
