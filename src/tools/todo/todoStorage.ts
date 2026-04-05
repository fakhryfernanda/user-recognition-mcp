import fs from 'fs';
import { resolveSafePath } from '../../utils/resolveSafePath.js';

export interface Todo {
  id: number;
  text: string;
  done: boolean;
  createdAt: string;
  dueDate?: string;
  reference?: string;
}

export const TODOS_PATH = resolveSafePath('todos.json');

export function readTodos(): Todo[] {
  if (!fs.existsSync(TODOS_PATH)) return [];
  const raw = fs.readFileSync(TODOS_PATH, 'utf-8');
  return JSON.parse(raw) as Todo[];
}

export function writeTodos(todos: Todo[]): void {
  fs.writeFileSync(TODOS_PATH, JSON.stringify(todos, null, 2), 'utf-8');
}
