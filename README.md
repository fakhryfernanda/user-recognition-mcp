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

> **Note:** The `context/` directory is gitignored and will **not** be uploaded to GitHub. You must create and manage your own context files locally.

## Running locally

```bash
# Dev mode (hot reload)
npm run dev

# Production
npm run build && npm start
```

The server starts on the port defined in `.env` (default: `3001`).

## Connecting

The server supports two MCP transport types:
- **SSE (Server-Sent Events)** at `/sse` - Standard SSE-based transport
- **Streamable HTTP** at `/mcp` - MCP Streamable HTTP transport (supports both SSE streaming and direct HTTP responses)

### Via mcp-inspector

**SSE transport (local):**
```bash
npx @modelcontextprotocol/inspector http://localhost:3001/sse
```

**Streamable HTTP transport (local):**
```bash
npx @modelcontextprotocol/inspector http://localhost:3001/mcp
```

**Production (via Cloudflare Tunnel):**
```bash
# SSE transport
npx @modelcontextprotocol/inspector https://mcp.fakhryfernanda.my.id/sse

# Streamable HTTP transport
npx @modelcontextprotocol/inspector https://mcp.fakhryfernanda.my.id/mcp
```

Open the inspector UI in your browser. All tools will appear in the tool list.

### Via MCP client config (Claude Desktop / Cursor / Windsurf)

**Using Streamable HTTP transport (recommended):**
```json
{
  "mcpServers": {
    "user-recognition": {
      "url": "https://mcp.fakhryfernanda.my.id/mcp"
    }
  }
}
```

**Using SSE transport:**
```json
{
  "mcpServers": {
    "user-recognition": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/inspector",
        "https://mcp.fakhryfernanda.my.id/sse"
      ]
    }
  }
}
```

Or with direct SSE URL if your client supports it:
```json
{
  "mcpServers": {
    "user-recognition": {
      "url": "https://mcp.fakhryfernanda.my.id/sse"
    }
  }
}
```

### Quick connectivity test

**SSE endpoint:**
```bash
# Should return SSE endpoint event
curl -s --max-time 3 https://mcp.fakhryfernanda.my.id/sse
```

Expected output:
```
event: endpoint
data: /messages?sessionId=<uuid>
```

**Streamable HTTP endpoint:**
```bash
# Should return initialization response
curl -X POST https://mcp.fakhryfernanda.my.id/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    }
  }'
```

Expected output (SSE format):
```
event: message
data: {"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{"listChanged":true}},"serverInfo":{"name":"user-recognition","version":"1.0.0"}},"jsonrpc":"2.0","id":1}
```

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

### `edit_file`
Edit a context file by replacing text using exact string matching. The `oldText` must match exactly once in the file.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Relative path to the file (e.g. `"personal/background.md"`) |
| `oldText` | string | Yes | Exact text to find and replace (must match exactly once) |
| `newText` | string | Yes | New text to replace with (can be empty to delete) |

**Example:** Replace a specific section in a file:
```json
{
  "path": "work/stack.json",
  "oldText": "\"language\": \"JavaScript\"",
  "newText": "\"language\": \"TypeScript\""
}
```

**Important:**
- `oldText` must match **exactly once** in the file (including whitespace and newlines)
- If `oldText` appears multiple times, the tool returns an error asking for more context
- If `oldText` is not found, the tool returns an informative error message
- `newText` can be an empty string to effectively delete the `oldText`
- Line endings must match exactly (`\n` vs `\r\n`)

### `write_file`
Write full content to a context file, creating it if it doesn't exist or overwriting if it does.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Relative path to the file (e.g. `"personal/notes.md"`) |
| `content` | string | Yes | Full content to write to the file |

**Example:**
```json
{
  "path": "projects/new-project.md",
  "content": "# New Project\n\nProject description here.\n\n## Goals\n- Goal 1\n- Goal 2"
}
```

**Note:** 
- Parent directories are automatically created if they don't exist
- Overwrites existing files without warning
- Use `edit_file` for surgical changes; use `write_file` for complete rewrites

### `add_todo`
Add a new to-do item to the list.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | The to-do item text |
| `reference` | string | No | Path to a markdown file in the context directory (e.g. `"work/project.md"`) |

### `list_todos`
List to-do items, optionally filtered by status.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `filter` | `"all"` \| `"done"` \| `"pending"` | No | Filter by status (default: `"all"`) |

### `complete_todo`
Mark a to-do item as done.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The id of the to-do item |

### `update_todo`
Edit the text and/or reference of an existing to-do item. At least one of `text` or `reference` must be provided.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The id of the to-do item |
| `text` | string | No | New text for the item |
| `reference` | string | No | Path to a markdown file in the context directory |

### `delete_todo`
Remove a to-do item by id.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | The id of the to-do item to delete |

**Note:** To-do data is persisted in `context/todos.json`.

---

## Security & Limitations

### Path Security
All file operations are restricted to the `CONTEXT_DIR` boundary:
- ✅ Path traversal attacks (`../../etc/passwd`) are blocked
- ✅ Hidden files (starting with `.`) are rejected
- ✅ Null bytes in paths are rejected
- ⚠️ **Note:** Symbolic links are not explicitly blocked. Avoid creating symlinks in the context directory.

### File Size Recommendations
- **Recommended maximum:** 10MB per file
- Both `edit_file` and `write_file` load entire file content into memory
- Very large files (>100MB) may cause performance issues

### Error Handling
The server provides informative error messages for:
- File not found
- Path outside context directory
- Multiple matches in `edit_file` (when `oldText` appears more than once)
- Text not found in `edit_file`
- Permission denied and disk space errors

### Known Limitations
1. **edit_file:** Requires exact string match including whitespace and line endings
2. **Line endings:** Must match exactly (`\n` vs `\r\n`) for `edit_file` operations
3. **Unicode:** Character counts in success messages may differ from byte counts for multi-byte characters (e.g., emoji)

---

### `list_directories`
List subdirectories in the context directory.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `directory` | string | No | Parent directory to list subdirectories from |

### `create_file`
Create a new file in the context directory with specified content.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Relative path for the new file (e.g. `"work/new-doc.md"`) |
| `content` | string | Yes | Content to write to the file |

**Example:**
```json
{
  "path": "projects/new-project.md",
  "content": "# New Project\n\nProject description here."
}
```

**Note:** Parent directories are automatically created if they don't exist. The tool rejects if the file already exists or if the path is invalid.

### `delete_file`
Delete a file from the context directory.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Relative path to the file to delete (e.g. `"work/old-doc.md"`) |

**Example:**
```json
{
  "path": "projects/archived-project.md"
}
```

**Note:** The tool only deletes files (not directories) and validates the file exists before deletion.

## Server Instructions

The server can provide onboarding instructions to AI agents via a WELCOME.md file:

1. Create `context/WELCOME.md` with your onboarding content
2. The server automatically reads it at startup and provides it as instructions to connecting agents
3. If the file doesn't exist, a default fallback message is used

**Example WELCOME.md structure:**
- Overview of available tools
- Getting started guide (e.g., "Read MEMORY.md first")
- Navigation strategy and workspace structure

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the server listens on |
| `CONTEXT_DIR` | `./context` | Absolute or relative path to the context directory |
| `WELCOME_FILE` | `./context/WELCOME.md` | Path to the server instructions file for AI agents |

---

## Production Deployment

### PM2 Setup

1. **Clone and build**
   ```bash
   git clone <repo-url> user-recognition-mcp
   cd user-recognition-mcp
   npm install
   npm run build
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```

3. **Create logs directory**
   ```bash
   mkdir -p logs
   ```

4. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

### Cloudflare Tunnel Setup

1. **Add DNS route to your tunnel**
   ```bash
   cloudflared tunnel route dns <tunnel-id> mcp.fakhryfernanda.my.id
   ```

2. **Update `/etc/cloudflared/config.yml`**
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: /etc/cloudflared/<tunnel-id>.json

   ingress:
     - hostname: mcp.fakhryfernanda.my.id
       service: http://localhost:3001

     - service: http_status:404
   ```

3. **Restart cloudflared**
   ```bash
   sudo systemctl restart cloudflared
   ```

### Code Update Workflow

```bash
cd ~/user-recognition-mcp
git pull origin main
npm install
npm run build
pm2 restart user-recognition-mcp
```
