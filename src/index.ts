import 'dotenv/config';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { registerListFiles } from './tools/listFiles.js';
import { registerReadFile } from './tools/readFile.js';
import { registerSearchContext } from './tools/searchContext.js';
import { registerListDirectories } from './tools/listDirectories.js';
import { registerEditFile } from './tools/editFile.js';
import { registerCreateFile } from './tools/createFile.js';
import { registerDeleteFile } from './tools/deleteFile.js';
import { registerWriteFile } from './tools/writeFile.js';
import { registerGetStarted } from './tools/getStarted.js';
import { registerAddTodo } from './tools/todo/addTodo.js';
import { registerListTodos } from './tools/todo/listTodos.js';
import { registerCompleteTodo } from './tools/todo/completeTodo.js';
import { registerDeleteTodo } from './tools/todo/deleteTodo.js';
import { registerUpdateTodo } from './tools/todo/updateTodo.js';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

const app = express();
app.use(express.json());

// Track transports by session id for stateless SSE handling
const transports: Record<string, SSEServerTransport> = {};

app.get('/sse', async (req, res) => {
  const server = new McpServer({
    name: 'user-recognition',
    version: '1.0.0',
  });

  registerGetStarted(server);
  registerListFiles(server);
  registerReadFile(server);
  registerSearchContext(server);
  registerListDirectories(server);
  registerEditFile(server);
  registerCreateFile(server);
  registerDeleteFile(server);
  registerWriteFile(server);
  registerAddTodo(server);
  registerListTodos(server);
  registerCompleteTodo(server);
  registerDeleteTodo(server);
  registerUpdateTodo(server);

  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;

  res.on('close', () => {
    delete transports[transport.sessionId];
  });

  await server.connect(transport);
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];

  if (!transport) {
    res.status(404).json({ error: `No active session: ${sessionId}` });
    return;
  }

  await transport.handlePostMessage(req, res);
});

// Streamable HTTP transport endpoint
app.post('/mcp', async (req, res) => {
  const server = new McpServer({
    name: 'user-recognition',
    version: '1.0.0',
  });

  registerGetStarted(server);
  registerListFiles(server);
  registerReadFile(server);
  registerSearchContext(server);
  registerListDirectories(server);
  registerEditFile(server);
  registerCreateFile(server);
  registerDeleteFile(server);
  registerWriteFile(server);
  registerAddTodo(server);
  registerListTodos(server);
  registerCompleteTodo(server);
  registerDeleteTodo(server);
  registerUpdateTodo(server);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get('/mcp', async (req, res) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: {
      code: -32000,
      message: 'Method not allowed: server runs in stateless mode',
    },
    id: null,
  });
});

app.listen(PORT, () => {
  console.log(`User Recognition MCP Server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Streamable HTTP endpoint: http://localhost:${PORT}/mcp`);
});
