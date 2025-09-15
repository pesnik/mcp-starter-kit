# 🎮 MCP Extensions

This directory contains **optional extensions** that demonstrate how to integrate MCP servers with real-world applications. These are **examples**, not core playground functionality.

## 💬 Chat Interface (`mcp-chat`)

A complete web-based chat interface that connects to MCP servers and provides a ChatGPT-like experience with **real tool usage**.

### Features
- **🤖 Ollama Integration** - Local LLM hosting (no API keys needed)
- **🔧 Live MCP Tool Usage** - AI can actually use your MCP servers
- **🖥️ Visual Server Management** - Start/stop servers from the UI
- **📊 Real-time Monitoring** - See tool calls and server health

### Usage
```bash
# Install Ollama first: https://ollama.ai
ollama pull llama3.2:3b

# Start the chat interface
npm run example:chat
# Open http://localhost:4200
```

### What You Can Do
1. **Start MCP servers** from the sidebar
2. **Ask AI to use tools**: "List files in the current directory"
3. **See real tool execution**: File operations, web scraping, etc.
4. **Experiment with prompts**: "Create a file, then read it back to me"

## 🎯 Why Extensions?

The chat interface is an **extension** because:

- **MCP is the core focus** - This playground is for learning MCP protocol
- **Chat is just one use case** - MCP works with Claude Desktop, VS Code, APIs, etc.
- **Modular design** - You can ignore extensions and focus on MCP development
- **Learning progression** - Start with CLI clients, then try visual interfaces

## 🔮 Future Extensions

Ideas for more extensions:

### 🔌 Integrations (`../integrations/`)
- **VS Code Extension** - Use MCP servers directly in your editor
- **Claude Desktop Config** - Generated configurations for Claude Desktop
- **Discord Bot** - Chat bot that uses your MCP servers
- **REST API Gateway** - HTTP wrapper for MCP servers

### 🛠️ Developer Tools
- **MCP Protocol Inspector** - Debug MCP messages
- **Server Performance Monitor** - Metrics and logging
- **Schema Validator** - Validate MCP tool definitions
- **Code Generator** - Generate server boilerplate from schemas

### 📊 Specialized UIs
- **Database Explorer** - GUI for database MCP servers
- **File Manager** - Visual interface for file operations
- **API Tester** - Postman-like tool for MCP servers
- **Workflow Builder** - Chain MCP tools together

## 🚀 Building Your Own Extension

Extensions follow this pattern:

1. **Use core MCP libraries** from `libs/mcp-utils`
2. **Connect to existing servers** in `apps/`
3. **Provide specialized interface** for your use case
4. **Maintain separation** from core MCP functionality

### Example Structure
```
examples/extensions/my-extension/
├── src/
│   ├── services/
│   │   └── MCPConnector.ts    # Connect to MCP servers
│   └── ui/                    # Your specialized interface
├── package.json
└── README.md
```

## 📚 Learning Path

1. **Start with core MCP** - Build servers in `apps/`
2. **Test with CLI client** - Use `examples/clients/mcp-client-test`
3. **Try chat extension** - See MCP in a familiar interface
4. **Build custom extensions** - Create your own specialized tools

---

**💡 Remember**: Extensions are **optional examples**. The core value is learning to build and use MCP servers!