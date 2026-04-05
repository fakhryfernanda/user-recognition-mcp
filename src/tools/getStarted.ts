import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function registerGetStarted(server: McpServer): void {
  server.tool(
    'get_started',
    'Returns onboarding instructions for this server. Call this first to understand available tools and how to navigate the context directory.',
    {},
    () => {
      const welcomePath = process.env.WELCOME_FILE ?? './context/WELCOME.md';
      const welcomeFile = resolve(process.cwd(), welcomePath);
      try {
        const content = readFileSync(welcomeFile, 'utf-8');
        return { content: [{ type: 'text', text: content }] };
      } catch {
        return {
          content: [
            {
              type: 'text',
              text: 'This server provides access to personal context files. Call list_files to get started.',
            },
          ],
        };
      }
    },
  );
}
