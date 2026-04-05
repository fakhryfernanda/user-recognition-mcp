import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readTodos, writeTodos } from './todoStorage.js';

export function registerAddTodo(server: McpServer): void {
  server.tool(
    'add_todo',
    'Add a new to-do item to the list.',
    {
      text: z.string().min(1),
      dueDate: z.string().min(1).optional(),
      reference: z.string().min(1).optional(),
    },
    ({ text, dueDate, reference }) => {
      const todos = readTodos();
      const id = todos.length > 0 ? Math.max(...todos.map((t) => t.id)) + 1 : 1;
      const todo = {
        id,
        text,
        done: false,
        createdAt: new Date().toISOString(),
        ...(dueDate && { dueDate }),
        ...(reference && { reference }),
      };
      todos.push(todo);
      writeTodos(todos);
      const refNote = reference ? ` (ref: ${reference})` : '';
      return {
        content: [{ type: 'text', text: `Added todo #${id}: "${text}"${refNote}` }],
      };
    },
  );
}
