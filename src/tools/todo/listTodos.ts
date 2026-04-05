import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readTodos } from './todoStorage.js';

export function registerListTodos(server: McpServer): void {
  server.tool(
    'list_todos',
    'List to-do items. Optionally filter by status: "all" (default), "done", or "pending".',
    {
      filter: z.enum(['all', 'done', 'pending']).optional(),
    },
    ({ filter = 'all' }) => {
      const todos = readTodos();
      const filtered =
        filter === 'done'
          ? todos.filter((t) => t.done)
          : filter === 'pending'
            ? todos.filter((t) => !t.done)
            : todos;

      if (filtered.length === 0) {
        return { content: [{ type: 'text', text: 'No todos found.' }] };
      }

      const lines = filtered.map(
        (t) => `[${t.done ? 'x' : ' '}] #${t.id} ${t.text}${t.reference ? ` → ${t.reference}` : ''}`,
      );
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    },
  );
}
