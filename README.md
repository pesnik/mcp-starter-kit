# 🛠️ MCP Playground

> **Build, Test, and Experiment with Model Context Protocol (MCP) - The Standard for AI Tool Integration**

A complete development environment for **Model Context Protocol (MCP)** - the open standard that enables AI assistants to securely connect with local and remote resources. Build servers, create clients, and see MCP in action with a live chat interface.

## 🎯 What You'll Learn

This playground demonstrates:

- **🖥️ MCP Servers** - Build tools that AI can use (file operations, web scraping, databases, APIs)
- **💻 MCP Clients** - Connect to and interact with MCP servers
- **🤖 Real AI Integration** - See MCP working with actual LLMs via Ollama
- **🔧 Protocol Details** - Understand MCP transport, tools, resources, and prompts

## ⚡ Quick Start

### 🚀 **Option 1: Experience MCP with AI Chat (5 min)**
```bash
# 1. Setup dependencies
pnpm install
npm run setup:python

# 2. Install Ollama for local AI (if not installed)
# Visit: https://ollama.ai or run: brew install ollama
ollama pull llama3.2:3b

# 3. Start the complete experience
pnpm start             # Chat interface at http://localhost:4200
```
**What you'll see:** A ChatGPT-like interface where AI can actually use file operations and web scraping through MCP!

### 🔧 **Option 2: Learn MCP Development (10 min)**
```bash
# Test MCP servers directly
pnpm run serve:filesystem       # Terminal 1: Start filesystem server
pnpm run test:filesystem        # Terminal 2: Test with CLI client

# Explore project structure
pnpm run graph                  # Visualize the architecture
```

## 📁 Project Structure

```
🤖 Live Demo
├── chat/                          # 💬 AI chat interface with MCP integration

🏗️ MCP Protocol Implementation
├── servers/                       # 🖥️ MCP SERVERS (AI tools)
│   ├── mcp-server-filesystem/     #   📁 File operations (Node.js/TypeScript)
│   └── mcp-server-web-python/     #   🕸️ Web scraping (Python)
├── clients/                       # 💻 MCP CLIENTS
│   └── mcp-client-test/           #   🧪 CLI testing & validation
├── libs/
│   └── mcp-utils/                 # 🔧 Shared utilities & types

📚 Learning Resources
└── examples/                      # 🎯 Guides & integration patterns
```

**Key Insight:** MCP is a **client-server protocol**. Servers provide tools, clients use them. The chat interface is a client that connects to your servers!

## 🔧 Core MCP Commands

### 🤖 **Primary Experience**
```bash
pnpm start               # Complete MCP demo with AI chat
pnpm run chat            # Same as start
pnpm run dev             # Development mode with hot reload
```

### 🖥️ **MCP Server Development**
```bash
pnpm run serve:filesystem    # Start file operations server
pnpm run serve:web           # Start Python web scraping server
pnpm run build               # Build all projects
```

### 🧪 **MCP Client Testing**
```bash
pnpm run test:filesystem     # Test filesystem server via CLI
pnpm run test:web            # Test web server via CLI
pnpm run test-client         # Interactive MCP client
```

### 🛠️ **Development & Analysis**
```bash
pnpm run graph               # Visualize architecture
pnpm run lint                # Code quality checks
pnpm run format              # Code formatting
```

## 🛠️ Building Your Own MCP Server

### 1. Generate Server
```bash
npx nx g @nx/node:application mcp-server-myfeature --directory=servers/mcp-server-myfeature
```

### 2. Implement MCP Protocol
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'my-feature-server',
  version: '1.0.0'
}, {
  capabilities: { tools: {} }
});

// Add your tools here!
```

### 3. Test with CLI Client
```bash
pnpm run test-client custom "npx nx run mcp-server-myfeature:serve"
```

## 📚 Learning Resources

### MCP Protocol Basics
- **Tools**: Functions AI can call (file operations, API calls, calculations)
- **Resources**: URI-addressable content (files, databases, web pages)
- **Prompts**: Template-based text generation
- **Transport**: Communication layer (stdio, HTTP, WebSocket)

### Example Use Cases
- **🔐 Secure File Assistant**: Read/write files with permissions
- **🌐 Web Research Tool**: Scrape and analyze web content
- **💾 Database Interface**: Query and update databases
- **🐳 DevOps Tools**: Docker, Git, cloud provider APIs
- **📊 Data Analysis**: Process CSVs, generate charts

### Protocol Flow
```
AI Client ←→ MCP Transport ←→ Your MCP Server ←→ Real World Systems
```

## 🔌 Integration Examples

### With Popular AI Tools
- **Claude Desktop**: Add your servers to `claude_desktop_config.json`
- **VS Code Extensions**: Connect via MCP client libraries
- **Custom Agents**: Build AI assistants with your specific tools

### Configuration Example
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["nx", "run", "mcp-server-filesystem:serve"]
    },
    "web-scraper": {
      "command": "python",
      "args": ["./servers/mcp-server-web-python/src/main.py"]
    }
  }
}
```

## 🚀 Advanced Features

- **Multi-language Support**: Node.js, Python, with extensible architecture
- **Hot Reloading**: Nx dev server integration
- **Type Safety**: Full TypeScript support with MCP SDK types
- **Testing Framework**: Automated testing for MCP protocol compliance
- **Documentation**: Auto-generated API docs from MCP schemas

## 📖 Documentation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Detailed setup and usage guide
- **[examples/README.md](./examples/README.md)** - Implementation patterns and examples
- **[MCP Official Docs](https://modelcontextprotocol.io/)** - Protocol specification
- **[MCP SDK Reference](https://github.com/modelcontextprotocol/typescript-sdk)** - TypeScript/Node.js SDK
- **[Awesome MCP Servers](https://github.com/wong2/awesome-mcp-servers)** - Community server collection

## 🤝 Contributing

Build something cool? We'd love to see it!

- **New MCP Servers**: Database connectors, API wrappers, dev tools
- **Client Examples**: Different transport methods, integration patterns
- **Extensions**: UI components, visualization tools
- **Documentation**: Tutorials, best practices, use cases

---

**🎪 Welcome to the MCP Playground!**

*Where AI meets real-world tools through the Model Context Protocol.*