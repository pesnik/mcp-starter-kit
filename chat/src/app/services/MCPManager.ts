export interface MCPServer {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  status: 'stopped' | 'running' | 'error';
  tools?: any[];
  resources?: any[];
}

export class MCPManager {
  private readonly backendUrl: string;

  constructor(backendUrl = 'http://localhost:3001') {
    this.backendUrl = backendUrl;
  }

  async discoverServers(): Promise<MCPServer[]> {
    const response = await fetch(`${this.backendUrl}/api/servers`);
    if (!response.ok) {
      throw new Error(`Failed to discover servers: ${response.statusText}`);
    }
    return response.json();
  }

  async startServer(serverId: string): Promise<void> {
    const response = await fetch(`${this.backendUrl}/api/servers/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to start server: ${response.statusText}`);
    }
  }

  async stopServer(serverId: string): Promise<void> {
    const response = await fetch(`${this.backendUrl}/api/servers/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to stop server: ${response.statusText}`);
    }
  }

  async callTool(serverId: string, toolName: string, args: any): Promise<any> {
    const response = await fetch(`${this.backendUrl}/api/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serverId, toolName, args }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to call tool: ${response.statusText}`);
    }

    return response.json();
  }

  async getAvailableTools(): Promise<Array<{ serverId: string; serverName: string; tool: any }>> {
    const response = await fetch(`${this.backendUrl}/api/tools`);
    if (!response.ok) {
      throw new Error(`Failed to get tools: ${response.statusText}`);
    }
    return response.json();
  }

  // Convert MCP tools to Ollama function format
  async getOllamaFunctions(): Promise<any[]> {
    const tools = await this.getAvailableTools();

    return tools.map(({ serverId, tool }) => ({
      type: 'function',
      function: {
        name: `${serverId}_${tool.name}`,
        description: `[${serverId}] ${tool.description}`,
        parameters: tool.inputSchema || {},
      },
    }));
  }

  // Parse function call from Ollama and route to appropriate MCP server
  async handleFunctionCall(functionName: string, args: any): Promise<any> {
    const [serverId, toolName] = functionName.split('_', 2);
    return this.callTool(serverId, toolName, args);
  }
}