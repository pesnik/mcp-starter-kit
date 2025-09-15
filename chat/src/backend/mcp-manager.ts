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
    // Dynamically discover MCP servers in the workspace
    const discoveredServers = await this.scanForMCPServers();

    const servers = discoveredServers.map((server, index) => ({
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

  private async scanForMCPServers(): Promise<Omit<MCPServer, 'status' | 'id'>[]> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const servers: Omit<MCPServer, 'status' | 'id'>[] = [];
    const workspaceRoot = process.cwd().includes('/chat') ? '../..' : '.';

    try {
      // Check for package.json files that might contain MCP servers
      const packagePaths = [
        path.join(workspaceRoot, 'servers'),
        path.join(workspaceRoot, 'packages'),
        path.join(workspaceRoot),
      ];

      for (const basePath of packagePaths) {
        try {
          const entries = await fs.readdir(basePath, { withFileTypes: true });

          for (const entry of entries) {
            if (entry.isDirectory() && entry.name.includes('mcp-server')) {
              const serverPath = path.join(basePath, entry.name);
              const packageJsonPath = path.join(serverPath, 'package.json');

              try {
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

                // Check if this is an MCP server
                if (packageJson.name?.includes('mcp-server') ||
                    packageJson.keywords?.includes('mcp-server') ||
                    packageJson.dependencies?.['@modelcontextprotocol/sdk']) {

                  servers.push({
                    name: packageJson.displayName || packageJson.name || entry.name,
                    description: packageJson.description || 'MCP Server',
                    command: 'node',
                    args: [path.join(serverPath, packageJson.main || 'index.js')],
                  });
                }
              } catch (error) {
                // Skip if package.json doesn't exist or is invalid
                console.log(`Skipping ${serverPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
        } catch (error) {
          // Directory doesn't exist, skip
        }
      }

      // If no servers found, show helpful message
      if (servers.length === 0) {
        servers.push({
          name: 'No MCP Servers Found',
          description: 'Add MCP servers to the servers/ directory. See README for setup instructions.',
          command: 'echo',
          args: ['No MCP servers configured'],
        });
      }

    } catch (error) {
      console.error('Error scanning for MCP servers:', error);
      servers.push({
        name: 'Server Discovery Error',
        description: 'Error occurred while scanning for MCP servers',
        command: 'echo',
        args: ['Server discovery failed'],
      });
    }

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