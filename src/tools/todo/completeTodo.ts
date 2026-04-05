import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readTodos, writeTodos } from './todoStorage.js';

export function registerCompleteTodo(server: McpServer): void {
  server.tool(
    'complete_todo',
    'Mark a to-do item as done by its id.',
    {
      id: z.number().int().positive(),
    },
    ({ id }) => {
      const todos = readTodos();
      const todo = todos.find((t) => t.id === id);
      if (!todo) {
        return {
          content: [{ type: 'text', text: `Todo #${id} not found.` }],
          isError: true,
        };
      }
      if (todo.done) {
        return {
          content: [{ type: 'text', text: `Todo #${id} is already done.` }],
        };
      }
      todo.done = true;
      writeTodos(todos);
      return {
        content: [{ type: 'text', text: `Completed todo #${id}: "${todo.text}"` }],
      };
    },
  );
}
