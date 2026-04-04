import 'dotenv/config';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { registerListFiles } from './tools/listFiles.js';
import { registerReadFile } from './tools/readFile.js';
import { registerSearchContext } from './tools/searchContext.js';

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

  registerListFiles(server);
  registerReadFile(server);
  registerSearchContext(server);

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

app.listen(PORT, () => {
  console.log(`User Recognition MCP Server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
});
