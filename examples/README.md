# MCP Playground Examples

This directory contains examples and documentation for experimenting with Model Context Protocol (MCP).

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   npm run setup:python  # For Python MCP server
   ```

2. **Test the playground:**
   ```bash
   # Test Node.js filesystem server
   npm run test:filesystem

   # Test Python web server
   npm run test:web

   # View the project graph
   npm run graph
   ```

## What's Included

### 🔧 MCP Servers

#### Node.js Filesystem Server (`apps/mcp-server-filesystem`)
- **Tools:** `read_file`, `write_file`, `list_directory`
- **Purpose:** Safe file system operations
- **Run:** `npm run serve:filesystem`

#### Python Web Server (`apps/mcp-server-web-python`)
- **Tools:** `fetch_url`, `extract_links`, `extract_text`
- **Purpose:** Web scraping and content analysis
- **Run:** `npm run serve:web`

### 🧪 Test Client (`apps/mcp-client-test`)
- Interactive client for testing MCP servers
- Supports both filesystem and web server testing
- **Run:** `npm run test-client`

### 📚 Shared Library (`libs/mcp-utils`)
- Common utilities and types for MCP development
- Validation helpers and error handling
- Type definitions for MCP components

## Development Patterns

### Creating a New MCP Server

1. **Node.js Server:**
   ```bash
   npx nx g @nx/node:application mcp-server-myfeature --directory=apps/mcp-server-myfeature
   ```

2. **Basic server structure:**
   ```typescript
   import { Server } from '@modelcontextprotocol/sdk/server/index.js';
   import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

   const server = new Server({
     name: 'my-feature-server',
     version: '1.0.0'
   }, {
     capabilities: { tools: {} }
   });
   ```

### MCP Tool Pattern

```typescript
{
  name: 'my_tool',
  description: 'Description of what this tool does',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Parameter description' }
    },
    required: ['param1']
  }
}
```

### Testing Pattern

```typescript
// In test client
await testClient.callTool('my_tool', {
  param1: 'test-value'
});
```

## Architecture

```
apps/
├── mcp-server-filesystem/     # Node.js file operations
├── mcp-server-web-python/     # Python web scraping
└── mcp-client-test/           # Test client

libs/
└── mcp-utils/                 # Shared utilities

examples/
├── tools/                     # Example tool implementations
├── resources/                 # Example resource handlers
└── prompts/                   # Example prompt templates
```

## MCP Protocol Overview

### Core Concepts

1. **Tools:** Functions that can be called by MCP clients
2. **Resources:** URI-addressable content (files, web pages, etc.)
3. **Prompts:** Template-based text generation
4. **Sampling:** LLM text generation requests

### Communication Flow

```
Client ←→ Transport (stdio/http) ←→ Server
```

### Message Types

- **Request/Response:** Synchronous operations
- **Notifications:** Asynchronous events
- **Subscriptions:** Real-time updates

## Useful Commands

```bash
# Development
npm run build          # Build all projects
npm run lint           # Lint all projects
npm run format         # Format code
npm run graph          # View dependency graph

# Server Operations
npm run serve:filesystem   # Start filesystem server
npm run serve:web         # Start web server

# Testing
npm run test:filesystem   # Test filesystem server
npm run test:web         # Test web server
npm run test-client      # Interactive client

# Python Setup
npm run setup:python     # Install Python dependencies
```

## Extending the Playground

### Add a Database Server

```bash
npx nx g @nx/node:application mcp-server-database --directory=apps/mcp-server-database
```

### Add New Tools

1. Define in server's tool list
2. Implement handler function
3. Add input schema validation
4. Update test client

### Add Resources

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'file://path/to/resource',
        name: 'Resource Name',
        mimeType: 'text/plain'
      }
    ]
  };
});
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors:** Run `npm run build` to check compilation
2. **Python Import Errors:** Run `npm run setup:python`
3. **Server Connection:** Check if server process is running
4. **Tool Calls Failing:** Validate input schema matches arguments

### Debug Mode

Set environment variable for verbose logging:
```bash
DEBUG=mcp:* npm run test:filesystem
```