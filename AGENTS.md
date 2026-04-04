# AGENTS.md — User Recognition MCP

## Project Overview

MCP server that exposes personal context files (personal, work, projects, social) to an AI coding agent via HTTP/SSE transport. The server provides four tools: `list_files`, `read_file`, `search_context`, and `edit_file`.

## Planning

A complete requirement breakdown is available in `REQUIREMENTS.md` (or the file provided at the start of the session). Read it before starting any task — all Epics, Features, and Tasks are defined there along with their Acceptance Criteria.

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js
- **Framework:** `@modelcontextprotocol/sdk` (McpServer + SSEServerTransport)
- **Key libraries:** `zod` (input validation), `tsx` (dev runner)
- **Formatter:** Prettier
- **Linter:** ESLint

## Folder Structure

```
project-root/
├── src/                  # Main source code
│   ├── index.ts          # Entry point, server init
│   ├── tools/            # MCP tool implementations
│   └── utils/            # Helper functions (including resolveSafePath)
├── context/              # Context files — DO NOT TOUCH
│   ├── personal/
│   ├── work/
│   ├── projects/
│   └── social/
├── .env                  # Env vars — DO NOT TOUCH
├── .env.example          # Env vars template
├── ecosystem.config.cjs  # PM2 config — DO NOT TOUCH
├── tsconfig.json
└── package.json
```

## Commands

```bash
# Install
npm install

# Dev (hot reload)
npm run dev

# Build
npm run build

# Production
npm start
```

## Architecture Notes

- Server is **stateless** — no session state between requests.
- Transport: SSE via `/sse` and `/messages` endpoints. Port is configured via the `PORT` env var.
- **All file operations must go through `resolveSafePath`** before accessing the filesystem. No exceptions.
- `resolveSafePath` verifies that the resolved absolute path starts with the `CONTEXT_DIR` absolute path. If not, it throws a `SecurityError` before any file is accessed.
- Input validation uses Zod on all tool parameters.

## Code Conventions

- TypeScript strict mode — no `any`, no type errors.
- Naming: camelCase for variables/functions, PascalCase for types/interfaces/classes.
- Formatter: Prettier (default config).
- Linter: ESLint with TypeScript rules.
- Error messages must be informative — state what went wrong, not just "error".

## Do Nots

- Never access files outside the `context/` directory — always use `resolveSafePath`.
- Never bypass Zod validation with type casting or `as unknown`.
- Never hardcode paths, ports, or base URLs — all must come from env vars.
- Never add state or sessions to the server — it must remain stateless.
- Never commit `.env` — only `.env.example`.

## Agent Scope

The agent may modify: `src/`, `tsconfig.json`, `package.json`, `.env.example`, `README.md`, `ecosystem.config.cjs` (only if explicitly asked).

The agent must not touch: anything inside `context/`, the `.env` file, and must never read or print the contents of any context file to any output.