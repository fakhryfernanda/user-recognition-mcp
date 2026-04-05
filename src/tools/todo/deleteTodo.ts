import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readTodos, writeTodos } from './todoStorage.js';

export function registerDeleteTodo(server: McpServer): void {
  server.tool(
    'delete_todo',
    'Remove a to-do item by its id.',
    {
      id: z.number().int().positive(),
    },
    ({ id }) => {
      const todos = readTodos();
      const index = todos.findIndex((t) => t.id === id);
      if (index === -1) {
        return {
          content: [{ type: 'text', text: `Todo #${id} not found.` }],
          isError: true,
        };
      }
      const [removed] = todos.splice(index, 1);
      writeTodos(todos);
      return {
        content: [{ type: 'text', text: `Deleted todo #${id}: "${removed.text}"` }],
      };
    },
  );
}
