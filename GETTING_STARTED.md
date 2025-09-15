# 🚀 MCP Playground - Getting Started

Welcome to the **Model Context Protocol (MCP) Playground**! This is a complete development environment for experimenting with MCP servers, clients, and real-world LLM integration.

## 🎯 What You Get

- **🤖 Real Chat Interface** with Ollama integration
- **🔧 Pre-built MCP Servers** (File system, Web scraping)
- **📊 Visual Server Management**
- **🛠️ Development Tools** for creating custom MCP servers
- **📚 Comprehensive Examples** and documentation

## ⚡ Quick Start (5 minutes)

### 1. Install Dependencies
```bash
pnpm install
npm run setup:python
```

### 2. Install Ollama (if not already installed)
```bash
# Install Ollama from https://ollama.ai
# Then pull a model:
ollama pull llama3.2:3b
```

### 3. Start the Chat Interface
```bash
npm start
# or
npm run chat
```

### 4. Open your browser
Navigate to `http://localhost:4200` and start chatting!

## 🎮 What to Try First

1. **Start the Filesystem Server** in the sidebar
2. **Ask the AI**: "List all files in the current directory"
3. **Try**: "Create a new file called 'hello.txt' with some content"
4. **Start the Web Server** and ask: "Fetch the content from example.com"

## 🏗️ Architecture Overview

```
🌐 Web Chat UI (React + Vite)
    ↓
🤖 Ollama (Local LLM)
    ↓
🔗 MCP Manager (Tool Routing)
    ↓
🖥️ MCP Servers (Node.js + Python)
```

## 📁 Project Structure

```
apps/
├── mcp-chat/                   # 🌐 Web chat interface
├── mcp-server-filesystem/      # 📁 File operations (Node.js)
├── mcp-server-web-python/      # 🕸️ Web scraping (Python)
└── mcp-client-test/           # 🧪 CLI testing client

libs/
└── mcp-utils/                 # 🔧 Shared utilities

examples/
└── README.md                  # 📖 Development guides
```

## 🛠️ Available Commands

### Development
- `npm start` - Start the chat interface
- `npm run dev` - Development mode with hot reload
- `npm run build` - Build all projects
- `npm run graph` - Visualize project dependencies

### MCP Servers
- `npm run serve:filesystem` - Start filesystem server (standalone)
- `npm run serve:web` - Start web server (standalone)

### Testing
- `npm run test:filesystem` - Test filesystem server (CLI)
- `npm run test:web` - Test web server (CLI)
- `npm run test-client` - Interactive CLI client

### Utilities
- `npm run setup:python` - Install Python dependencies
- `npm run setup:ollama` - Instructions for Ollama setup
- `npm run lint` - Lint all code
- `npm run format` - Format code

## 🔧 Creating Your Own MCP Server

### 1. Generate a new server
```bash
npx nx g @nx/node:application mcp-server-myfeature --directory=apps/mcp-server-myfeature
```

### 2. Install MCP SDK
Already available workspace-wide!

### 3. Implement your server
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

const server = new Server({
  name: 'my-feature-server',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
});

// Add your tools here!
```

### 4. Register in the chat interface
Edit `apps/mcp-chat/src/app/services/MCPManager.ts` to add your server.

## 🐛 Troubleshooting

### Ollama Issues
- **Not starting?** Make sure Ollama is installed and running: `ollama list`
- **No models?** Pull a model: `ollama pull llama3.2:3b`
- **Connection failed?** Check if Ollama is running on `localhost:11434`

### MCP Server Issues
- **Server won't start?** Check the server logs in the chat interface
- **Tool not working?** Use the CLI client to debug: `npm run test-client`
- **Python errors?** Make sure dependencies are installed: `npm run setup:python`

### Development Issues
- **TypeScript errors?** Run `npm run build` to see detailed errors
- **Hot reload not working?** Restart with `npm run dev`

## 🚀 Advanced Usage

### Adding API Providers
Edit the `OllamaClient` to support OpenAI, Anthropic, or other providers:

```typescript
// In apps/mcp-chat/src/app/services/OllamaClient.ts
// Add support for multiple providers
```

### Custom Tool Discovery
Modify `MCPManager.discoverServers()` to auto-discover servers from:
- Configuration files
- Environment variables
- Network discovery
- Docker containers

### Real-world Integration
- **VS Code Extension**: Connect to the MCP servers from VS Code
- **Claude Desktop**: Use the servers with Claude Desktop
- **API Endpoints**: Expose servers via HTTP for remote access

## 📚 Learn More

- **MCP Documentation**: https://modelcontextprotocol.io/
- **Official Examples**: https://github.com/modelcontextprotocol/servers
- **Nx Documentation**: https://nx.dev/
- **Ollama Documentation**: https://ollama.ai/

## 🤝 Contributing

This playground is designed to be extended! Some ideas:

- **New MCP Servers**: Database, API, Git, Docker, etc.
- **Enhanced UI**: Voice chat, file uploads, code highlighting
- **Integrations**: Discord bots, Slack apps, browser extensions
- **Documentation**: Tutorials, examples, best practices

---

**🎉 Happy hacking with MCP!**

Start with the chat interface and explore what's possible when AI can use real tools.