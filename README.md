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

The server starts on the port defined in `.env` (default: `3001`).

## Connecting

### Via mcp-inspector

**Local development:**
```bash
npx @modelcontextprotocol/inspector http://localhost:3001/sse
```

**Production (via Cloudflare Tunnel):**
```bash
npx @modelcontextprotocol/inspector https://mcp.fakhryfernanda.my.id/sse
```

Open the inspector UI in your browser. All tools will appear in the tool list.

### Via MCP client config (Claude Desktop / Cursor / Windsurf)

Add this to your MCP client's `mcp.json` or equivalent config:

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

Or with a direct HTTP SSE transport if your client supports it:

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

```bash
# Should return SSE endpoint event
curl -s --max-time 3 https://mcp.fakhryfernanda.my.id/sse
```

Expected output:
```
event: endpoint
data: /messages?sessionId=<uuid>
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

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the server listens on |
| `CONTEXT_DIR` | `./context` | Absolute or relative path to the context directory |

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
