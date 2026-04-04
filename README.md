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

---

## Deployment

### Fresh Deployment to VPS

#### Prerequisites on VPS

```bash
# Install Node.js (Ubuntu/Debian example)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install build tools (if needed)
sudo apt-get install -y build-essential
```

#### Deploy Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url> user-recognition-mcp
   cd user-recognition-mcp
   ```

2. **Install dependencies and build**
   ```bash
   npm install
   npm run build
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your production settings
   nano .env
   ```

4. **Create logs directory**
   ```bash
   mkdir -p logs
   ```

5. **Start with PM2**
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   ```

6. **Setup auto-start on boot**
   ```bash
   pm2 startup
   # Run the command PM2 outputs
   ```

7. **Verify**
   ```bash
   pm2 status
   pm2 logs user-recognition-mcp
   ```

### Cloudflare Tunnel Setup

#### 1. Install cloudflared

```bash
# Ubuntu/Debian
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared

# Or via npm
sudo npm install -g cloudflared
```

#### 2. Authenticate

```bash
cloudflared tunnel login
# Opens browser — select your Cloudflare account
```

#### 3. Create Tunnel

```bash
cloudflared tunnel create mcp-server
# Outputs a tunnel ID: <TUNNEL_ID>
# Creates credentials file: ~/.cloudflared/<TUNNEL_ID>.json
```

#### 4. Configure DNS Routing

```bash
cloudflared tunnel route dns mcp-server yourdomain.com
# Replace with your actual domain
```

#### 5. Create Tunnel Config

Create `~/.cloudflared/config.yml`:
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/deploy/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

#### 6. Run Cloudflared via PM2 (for persistence)

```bash
pm2 start cloudflared --name "cloudflared-tunnel" -- tunnel --config ~/.cloudflared/config.yml run
pm2 save
```

#### 7. Verify

```bash
# Test tunnel connectivity
curl https://yourdomain.com/sse

# Check tunnel status in Cloudflare Dashboard → Zero Trust → Networks → Tunnels
```

### Code Update Workflow

```bash
# 1. Navigate to project
cd ~/user-recognition-mcp

# 2. Pull latest changes
git pull origin main

# 3. Install any new dependencies
npm install

# 4. Rebuild TypeScript
npm run build

# 5. Restart PM2
pm2 restart user-recognition-mcp

# Verify
pm2 logs user-recognition-mcp --lines 20
```

### Troubleshooting

#### PM2: Server won't start

```bash
# Check logs
pm2 logs user-recognition-mcp --lines 50

# Common causes:
# - Missing dependencies → run npm install
# - Build failed → run npm run build and check for TypeScript errors
# - Port already in use → change PORT in .env or kill the process: lsof -ti:3000 | xargs kill
# - .env file missing → cp .env.example .env

# Force restart
pm2 delete user-recognition-mcp
pm2 start ecosystem.config.js
```

#### Cloudflare Tunnel: Domain not resolving

```bash
# Check tunnel status
pm2 status cloudflared-tunnel
pm2 logs cloudflared-tunnel --lines 30

# Verify tunnel is active
cloudflared tunnel info mcp-server

# Common causes:
# - Tunnel not running → pm2 restart cloudflared-tunnel
# - DNS not routed → cloudflared tunnel route dns mcp-server yourdomain.com
# - Credentials file missing → re-run cloudflared tunnel login
# - Port mismatch → ensure config.yml service points to correct localhost:PORT

# Test locally first
curl http://localhost:3000/sse
# If this fails, fix the server before debugging the tunnel
```

#### Auto-start not working after reboot

```bash
# Verify PM2 startup is configured
pm2 startup
# Re-run the startup command if needed

# Ensure saved state exists
pm2 list
pm2 save

# Check systemd service (Ubuntu/Debian)
systemctl status pm2-deploy

# For cloudflared, ensure PM2 dump was saved
pm2 dump
```
