# Personal Context MCP Server

> **Assumed context:** TypeScript + official MCP SDK; deployment target VPS with Cloudflare Tunnel; custom domain; local is for dev/testing only; no claude.ai integration steps.

---

## Definition of Done (Project-wide)
- [x] All MCP tools can be called via MCP client without errors
- [x] Path traversal attacks confirmed unable to break out of context directory
- [x] Server runs with a single command locally and on VPS
- [x] All env vars documented in .env.example

---

## Epic 1 — Project Foundation & Tech Stack

### Feature: As a developer, I want a scaffolded TypeScript project with the right dependencies and folder structure, so that I can start building the MCP server without setup overhead.

#### Task: [Dev] Initialize project with TypeScript + MCP SDK ✅
**Description:** Run npm init, install @modelcontextprotocol/sdk, typescript, tsx, zod. Setup tsconfig.json targeting ESNext with moduleResolution: bundler. Create folder structure: src/, context/personal, context/work, context/projects, context/social.
**Acceptance Criteria:**
- [x] npm run dev executes server entry point without compile errors
- [x] All context/ folders exist and contain at least one placeholder file
- [x] tsconfig.json strict mode enabled with no type errors
- [x] .env.example available with all variables documented

#### Task: [Dev] Create sample context files (1 per category) ✅
**Description:** Create example files: context/personal/background.md, context/work/stack.json, context/projects/active.md, context/social/communities.md. Hybrid format: Markdown for narrative, JSON for structured data.
**Acceptance Criteria:**
- [x] Each file contains representative content (minimum 5 lines)
- [x] JSON files are valid and parseable without errors
- [x] Markdown files have clear headings

---

## Epic 2 — MCP Server Core

### Feature: As a developer, I want to expose list_files, read_file, and search_context tools via MCP over HTTP/SSE, so that Claude can access context files on-demand.

#### Task: [Dev] Setup MCP server with HTTP/SSE transport ✅
**Description:** Initialize McpServer from SDK with SSEServerTransport. Expose /sse and /messages endpoints. Load port and base URL from env vars. Server must be stateless.
**Acceptance Criteria:**
- [x] Server listens on port configured via PORT env var
- [x] MCP client can connect via SSE
- [x] Server does not crash if client disconnects unexpectedly
- [x] Restarting server requires no more than one command

#### Task: [Dev] Implement list_files tool ✅
**Description:** Tool accepts optional directory parameter. If empty, list root context dir. Return array of relative paths. Validate input with Zod.
**Acceptance Criteria:**
- [x] Without argument, returns all files in context/ recursively
- [x] With argument "work", returns only files in context/work/
- [x] Arguments like "../etc" are rejected with a clear error
- [x] Return format is consistent: array of string relative paths

#### Task: [Dev] Implement read_file tool ✅
**Description:** Tool accepts path parameter (relative to context dir). Read file and return its content as a string. Validate that resolved path remains inside the context directory.
**Acceptance Criteria:**
- [x] Valid path returns full file content as string
- [x] Path traversal like "../../etc/passwd" returns an error, not the file
- [x] File not found returns an informative error
- [x] Large files (>1MB) can still be read without timeout

#### Task: [Dev] Implement search_context tool ✅
**Description:** Tool accepts query parameter. Full-text search across all context files recursively. Return array of { path, snippet, lineNumber }. Search is case-insensitive.
**Acceptance Criteria:**
- [x] Query found in files returns at least one match with a relevant snippet
- [x] Query not found returns empty array, not an error
- [x] Search is case-insensitive
- [x] Snippet includes at least 1 line of surrounding context around the match

---

## Epic 3 — Security Hardening

### Feature: As a developer, I want all file operations validated against the context directory boundary, so that the server cannot be exploited to read files outside the context folder.

#### Task: [Dev] Create resolveSafePath utility ✅
**Description:** Create a helper function that resolves path input to an absolute path, then verifies the result starts with the CONTEXT_DIR absolute path. If not, throw SecurityError.
**Acceptance Criteria:**
- [x] Input "personal/background.md" resolves to a valid path inside context dir
- [x] Input "../../etc/passwd" throws SecurityError before file is accessed
- [x] Input with null bytes or unusual characters is rejected
- [x] All three tools use this helper with no bypass

---

## Epic 4a — Local Dev Setup

### Feature: As a developer, I want to run the server locally with a single command and test tools via MCP client, so that I can iterate quickly before deploying to VPS.

#### Task: [Dev] Setup npm scripts and env config ✅
**Description:** Add scripts in package.json: dev (tsx watch), build (tsc), start (node dist). Create .env.example. Add .env to .gitignore.
**Acceptance Criteria:**
- [x] npm run dev runs server with hot reload
- [x] Changing PORT in .env changes server port without code changes
- [x] .env is not committed to git

#### Task: [Dev] Verify tools via mcp-inspector ✅
**Description:** Test all three tools using mcp-inspector or another MCP client. Document how to connect in README.md.
**Acceptance Criteria:**
- [x] All three tools appear in MCP client tool list
- [x] Each tool can be called and returns the correct response
- [x] README.md contains connection instructions for local dev

---

## Epic 4b — VPS Production Deployment

### Feature: As a developer, I want the server running persistently on VPS and accessible via custom domain through Cloudflare Tunnel, so that the MCP server can be accessed from anywhere.

#### Task: [DevOps] Setup server build and PM2 on VPS ✅
**Description:** On VPS: clone repo, install dependencies, build TypeScript. Install PM2. Create ecosystem.config.cjs. Setup pm2 startup for auto-start after reboot.
**Acceptance Criteria:**
- [x] Server runs via PM2 with status online
- [x] After VPS reboot, server starts automatically
- [x] Server logs accessible via pm2 logs
- [x] pm2 restart applies code updates without significant downtime

#### Task: [DevOps] Setup Cloudflare Tunnel to VPS ✅
**Description:** Install cloudflared on VPS. Authenticate, create tunnel, configure routing to localhost:PORT. Point custom domain to tunnel. Run cloudflared via PM2 for persistence.
**Acceptance Criteria:**
- [x] Custom domain resolves to MCP server
- [x] HTTPS active automatically via Cloudflare
- [x] cloudflared runs persistently and auto-restarts on crash
- [x] MCP client can connect via domain URL, not VPS IP

#### Task: [DevOps] Document deployment and update workflow ✅
**Description:** Add "Deployment" section to README.md: fresh deploy steps, how to update code, how to check tunnel status, troubleshooting.
**Acceptance Criteria:**
- [x] Fresh deployment to a new VPS can be done by following README alone
- [x] Code update documented in 5 steps or fewer
- [x] Troubleshooting covers at least 3 common error scenarios