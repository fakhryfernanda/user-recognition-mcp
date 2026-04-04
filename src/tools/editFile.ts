import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import { resolveSafePath, SecurityError } from '../utils/resolveSafePath.js';

export function registerEditFile(server: McpServer): void {
  server.tool(
    'edit_file',
    'Edit a context file by replacing text. Provide the exact oldText to find and the newText to replace it with. oldText must match exactly once in the file.',
    {
      path: z.string().min(1),
      oldText: z.string().min(1),
      newText: z.string(),
    },
    ({ path: filePath, oldText, newText }) => {
      try {
        // Reject hidden files
        const basename = filePath.split('/').pop() ?? '';
        if (basename.startsWith('.')) {
          return {
            content: [{ type: 'text', text: `File not found: "${filePath}"` }],
            isError: true,
          };
        }

        const resolved = resolveSafePath(filePath);

        // Check file exists
        if (!fs.existsSync(resolved)) {
          return {
            content: [{ type: 'text', text: `File not found: "${filePath}"` }],
            isError: true,
          };
        }

        // Check it's a file
        const stat = fs.statSync(resolved);
        if (!stat.isFile()) {
          return {
            content: [{ type: 'text', text: `"${filePath}" is not a file` }],
            isError: true,
          };
        }

        // Read file content
        const content = fs.readFileSync(resolved, 'utf-8');

        // Find all occurrences of oldText
        const firstIndex = content.indexOf(oldText);
        if (firstIndex === -1) {
          return {
            content: [
              {
                type: 'text',
                text: `oldText not found in "${filePath}". Ensure the text matches exactly (including whitespace and newlines).`,
              },
            ],
            isError: true,
          };
        }

        // Check for multiple occurrences
        const lastIndex = content.lastIndexOf(oldText);
        if (firstIndex !== lastIndex) {
          return {
            content: [
              {
                type: 'text',
                text: `oldText matches multiple locations in "${filePath}". Provide more context to make it unique.`,
              },
            ],
            isError: true,
          };
        }

        // Perform the replacement
        const newContent =
          content.slice(0, firstIndex) + newText + content.slice(firstIndex + oldText.length);

        // Write back to file
        fs.writeFileSync(resolved, newContent, 'utf-8');

        const bytesChanged = newText.length - oldText.length;
        const direction = bytesChanged >= 0 ? '+' : '';
        return {
          content: [
            {
              type: 'text',
              text: `Successfully edited "${filePath}": replaced ${oldText.length} character(s) with ${newText.length} character(s) (${direction}${bytesChanged} bytes)`,
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
