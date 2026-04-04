# User Recognition MCP Server

An MCP server that exposes personal context files to an AI coding agent via HTTP/SSE transport.

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
cp .env.example .env
# Edit .env to set PORT and CONTEXT_DIR if needed
```

## Running locally

```bash
# Dev mode (hot reload)
npm run dev

# Production
npm run build && npm start
```

The server starts on the port defined in `.env` (default: `3000`).

## Connecting via mcp-inspector

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/sse
```

Open the inspector UI in your browser. All three tools will appear in the tool list.

## Tools

### `list_files`
Lists files in the context directory.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `directory` | string | No | Subdirectory to filter by (e.g. `"work"`, `"personal"`) |

**Example:** call with no arguments → returns all files recursively.  
**Example:** call with `directory: "work"` → returns only `work/` files.

### `read_file`
Returns the full content of a context file.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Relative path to the file (e.g. `"personal/background.md"`) |

### `search_context`
Full-text search across all context files. Case-insensitive.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search term |

Returns an array of `{ path, snippet, lineNumber }` objects.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the server listens on |
| `CONTEXT_DIR` | `./context` | Absolute or relative path to the context directory |
