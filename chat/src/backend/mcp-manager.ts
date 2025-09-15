import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListToolsResultSchema, CallToolResultSchema, ListResourcesResultSchema } from '@modelcontextprotocol/sdk/types.js';

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  command: string;
  args: string[];
  status: 'stopped' | 'running' | 'error';
  client?: Client;
  transport?: StdioClientTransport;
  tools?: any[];
  resources?: any[];
}

export class MCPServerManager {
  private servers: Map<string, MCPServer> = new Map();

  async discoverServers(): Promise<MCPServer[]> {
    // Default servers available in the playground
    const defaultServers: Omit<MCPServer, 'status' | 'id'>[] = [
      {
        name: 'Filesystem Server',
        description: 'File operations (read, write, list)',
        command: 'npx',
        args: ['nx', 'run', 'mcp-server-filesystem:serve'],
      },
      {
        name: 'Web Server',
        description: 'Web scraping and content extraction',
        command: 'python',
        args: ['./servers/mcp-server-web-python/src/main.py'],
      },
    ];

    const servers = defaultServers.map((server, index) => ({
      ...server,
      id: `server-${index}`,
      status: 'stopped' as const,
    }));

    // Store servers
    servers.forEach(server => {
      this.servers.set(server.id, server);
    });

    return servers;
  }

  async startServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) throw new Error(`Server ${serverId} not found`);

    try {
      console.log(`Starting server: ${server.name}`);

      // Create MCP client
      const client = new Client(
        { name: 'mcp-chat-client', version: '1.0.0' },
        { capabilities: {} }
      );

      // Create transport - it will spawn the process internally
      const transport = new StdioClientTransport({
        command: server.command,
        args: server.args,
      });

      await client.connect(transport);

      // Get available tools and resources
      const toolsResponse = await client.request(
        { method: 'tools/list', params: {} },
        ListToolsResultSchema
      );

      const resourcesResponse = await client.request(
        { method: 'resources/list', params: {} },
        ListResourcesResultSchema
      ).catch(() => ({ resources: [] })); // Some servers may not have resources

      // Update server state
      server.status = 'running';
      server.client = client;
      server.transport = transport;
      server.tools = toolsResponse.tools || [];
      server.resources = resourcesResponse.resources || [];

      console.log(`✅ Server ${server.name} started with ${server.tools?.length} tools`);

    } catch (error) {
      server.status = 'error';
      console.error(`❌ Failed to start server ${server.name}:`, error);
      throw error;
    }
  }

  async stopServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) return;

    if (server.client) {
      await server.client.close();
    }

    if (server.transport) {
      await server.transport.close();
    }

    server.status = 'stopped';
    server.client = undefined;
    server.transport = undefined;
  }

  async callTool(serverId: string, toolName: string, args: any): Promise<any> {
    const server = this.servers.get(serverId);
    if (!server || !server.client) {
      throw new Error(`Server ${serverId} not running`);
    }

    const response = await server.client.request(
      { method: 'tools/call', params: { name: toolName, arguments: args } },
      CallToolResultSchema
    );

    return response;
  }

  getServer(serverId: string): MCPServer | undefined {
    return this.servers.get(serverId);
  }

  getAllServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  getAvailableTools(): Array<{ serverId: string; serverName: string; tool: any }> {
    const tools: Array<{ serverId: string; serverName: string; tool: any }> = [];

    for (const server of this.servers.values()) {
      if (server.status === 'running' && server.tools) {
        server.tools.forEach(tool => {
          tools.push({
            serverId: server.id,
            serverName: server.name,
            tool
          });
        });
      }
    }

    return tools;
  }

  // Convert MCP tools to Ollama function format
  getOllamaFunctions(): any[] {
    const tools = this.getAvailableTools();

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

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down all MCP servers...');
    const stopPromises = Array.from(this.servers.keys()).map(serverId =>
      this.stopServer(serverId)
    );
    await Promise.all(stopPromises);
  }
}