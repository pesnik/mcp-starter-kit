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
# Build your own MCP servers and clients
npx nx g @nx/node:application my-server --directory=servers/my-server
npx nx g @nx/node:application my-client --directory=clients/my-client

# Explore project structure
pnpm run graph                  # Visualize the architecture
```

## 📁 Project Structure

```
🤖 Live Demo
├── chat/                          # 💬 AI chat interface with MCP integration

🏗️ MCP Protocol Implementation
├── servers/                       # 🖥️ MCP SERVERS (Create your AI tools here)
│   └── .gitignore                 #   Ready for your server implementations
├── clients/                       # 💻 MCP CLIENTS (Create your MCP clients here)
│   └── .gitignore                 #   Ready for your client implementations
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
# Generate and run your servers
npx nx g @nx/node:application my-server --directory=servers/my-server
npx nx run my-server:serve   # Start your server
pnpm run build               # Build all projects
```

### 🧪 **MCP Client Testing**
```bash
# Generate and test your clients
npx nx g @nx/node:application my-client --directory=clients/my-client
npx nx run my-client:serve   # Run your client
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
npx nx g @nx/node:application my-server --directory=servers/my-server
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

### 3. Test Your Server
```bash
npx nx run my-server:serve     # Start your server
# Then connect with the chat interface or build a test client
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
    "my-server": {
      "command": "npx",
      "args": ["nx", "run", "my-server:serve"]
    },
    "custom-server": {
      "command": "node",
      "args": ["./servers/custom-server/dist/main.js"]
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