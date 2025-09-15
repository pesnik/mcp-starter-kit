# MCP Playground - Just Commands

# Default recipe (shows available commands)
default:
    @just --list

# Start the chat application with backend for testing MCP servers
chat:
    pnpm -w run chat:full

# Start only the chat backend (for MCP server testing)
chat-backend:
    pnpm -w run chat:backend

# Start only the chat frontend (UI only)
chat-frontend:
    pnpm run chat

# Build all projects
build:
    pnpm run build

# Run tests
test:
    pnpm run test

# Format code
format:
    pnpm run format

# Run linting
lint:
    pnpm run lint

# Show project dependency graph
graph:
    pnpm run graph

# Setup Python environment for Python MCP servers
setup-python:
    @echo "Add Python servers to servers/ directory and install their dependencies"

# Setup Ollama for AI integration
setup-ollama:
    @echo "Install Ollama from https://ollama.ai and run: ollama pull llama3.2:3b"

# Clean all build artifacts and node_modules
clean:
    rm -rf node_modules
    rm -rf chat/node_modules
    rm -rf chat/dist
    find . -name "dist" -type d -exec rm -rf {} +

# Install all dependencies
install:
    pnpm install