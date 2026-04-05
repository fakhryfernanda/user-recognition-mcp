import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readTodos, writeTodos } from './todoStorage.js';

export function registerUpdateTodo(server: McpServer): void {
  server.tool(
    'update_todo',
    'Edit the text of an existing to-do item by its id.',
    {
      id: z.number().int().positive(),
      text: z.string().min(1).optional(),
      reference: z.string().min(1).optional(),
    },
    ({ id, text, reference }) => {
      const todos = readTodos();
      const todo = todos.find((t) => t.id === id);
      if (!todo) {
        return {
          content: [{ type: 'text', text: `Todo #${id} not found.` }],
          isError: true,
        };
      }
      if (!text && reference === undefined) {
        return {
          content: [{ type: 'text', text: 'Provide at least one of: text, reference.' }],
          isError: true,
        };
      }
      const changes: string[] = [];
      if (text) {
        changes.push(`text: "${todo.text}" → "${text}"`);
        todo.text = text;
      }
      if (reference !== undefined) {
        changes.push(`reference: ${reference}`);
        todo.reference = reference;
      }
      writeTodos(todos);
      return {
        content: [
          { type: 'text', text: `Updated todo #${id}: ${changes.join(', ')}` },
        ],
      };
    },
  );
}
