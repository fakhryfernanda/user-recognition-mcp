import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import fs from 'fs';
import { resolveSafePath, SecurityError } from '../utils/resolveSafePath.js';

export function registerEditFile(server: McpServer): void {
  server.tool(
    'edit_file',
    'Edit a context file by replacing specific lines. Line numbers are 1-indexed.',
    {
      path: z.string().min(1),
      startLine: z.number().int().positive(),
      endLine: z.number().int().positive(),
      newContent: z.string(),
    },
    ({ path: filePath, startLine, endLine, newContent }) => {
      try {
        // Validate line range
        if (startLine > endLine) {
          return {
            content: [
              {
                type: 'text',
                text: `Invalid line range: startLine (${startLine}) cannot be greater than endLine (${endLine})`,
              },
            ],
            isError: true,
          };
        }

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

        // Read file and split into lines
        const content = fs.readFileSync(resolved, 'utf-8');
        const lines = content.split('\n');

        // Validate line numbers are within bounds
        if (startLine > lines.length) {
          return {
            content: [
              {
                type: 'text',
                text: `startLine (${startLine}) is beyond end of file (${lines.length} lines)`,
              },
            ],
            isError: true,
          };
        }

        if (endLine > lines.length) {
          return {
            content: [
              {
                type: 'text',
                text: `endLine (${endLine}) is beyond end of file (${lines.length} lines)`,
              },
            ],
            isError: true,
          };
        }

        // Replace lines (convert from 1-indexed to 0-indexed)
        const newLines = newContent.split('\n');
        lines.splice(startLine - 1, endLine - startLine + 1, ...newLines);

        // Write back to file
        fs.writeFileSync(resolved, lines.join('\n'), 'utf-8');

        const linesReplaced = endLine - startLine + 1;
        return {
          content: [
            {
              type: 'text',
              text: `Successfully edited "${filePath}": replaced ${linesReplaced} line(s) (${startLine}-${endLine}) with ${newLines.length} line(s)`,
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
