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
  type?: 'local' | 'third-party';
  enabled?: boolean;
  env?: Record<string, string>;
  client?: Client;
  transport?: StdioClientTransport;
  tools?: any[];
  resources?: any[];
}

export interface MCPConfig {
  mcpServers: Record<string, Omit<MCPServer, 'id' | 'status' | 'client' | 'transport' | 'tools' | 'resources'>>;
  discovery?: {
    scanLocalServers?: boolean;
    localServerPaths?: string[];
    autoDiscoverWorkspace?: boolean;
  };
  settings?: {
    maxConcurrentServers?: number;
    startupTimeout?: number;
    logLevel?: string;
  };
}

export class MCPServerManager {
  private servers: Map<string, MCPServer> = new Map();

  async discoverServers(): Promise<MCPServer[]> {
    const configServers = await this.loadConfigServers();
    const discoveredServers = await this.scanForMCPServers();

    // Combine config servers with discovered servers
    const allServers = [...configServers, ...discoveredServers];

    // Store servers, but preserve existing status if server is already running
    allServers.forEach(server => {
      const existingServer = this.servers.get(server.id);
      if (existingServer && existingServer.status === 'running') {
        // Preserve running server state
        this.servers.set(server.id, {
          ...server,
          status: existingServer.status,
          client: existingServer.client,
          transport: existingServer.transport,
          tools: existingServer.tools,
          resources: existingServer.resources,
        });
      } else {
        // New or stopped server
        this.servers.set(server.id, server);
      }
    });

    return Array.from(this.servers.values());
  }

  private async loadConfigServers(): Promise<MCPServer[]> {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      console.log(`🔍 Looking for mcp-config.json from working directory: ${process.cwd()}`);

      // Since working directory is /Users/r_hasan/Development/mcp-starter-kit/chat
      // The config should be at ../mcp-config.json
      const configPath = path.join(process.cwd(), '..', 'mcp-config.json');
      console.log(`🔍 Trying config path: ${configPath}`);

      const configData = await fs.readFile(configPath, 'utf-8');
      console.log(`✅ Found and loaded mcp-config.json`);
      const config: MCPConfig = JSON.parse(configData);

      const servers: MCPServer[] = [];

      for (const [serverId, serverConfig] of Object.entries(config.mcpServers)) {
        // Only include enabled servers
        if (serverConfig.enabled !== false) {
          servers.push({
            id: serverId,
            ...serverConfig,
            status: 'stopped' as const,
          });
        }
      }

      console.log(`✅ Loaded ${servers.length} servers from mcp-config.json`);
      return servers;
    } catch (error) {
      console.log('📝 No mcp-config.json found or error reading it, falling back to auto-discovery');
      console.log('🔍 Error details:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  private async scanForMCPServers(): Promise<MCPServer[]> {
    const fs = await import('fs/promises');
    const path = await import('path');

    // Check if local scanning is enabled in config
    const config = await this.loadConfig();
    if (!config?.discovery?.scanLocalServers) {
      return [];
    }

    const servers: MCPServer[] = [];
    const workspaceRoot = process.cwd().includes('/chat') ? '../..' : '.';
    const searchPaths = config.discovery?.localServerPaths || ['servers', 'packages'];

    try {
      for (const searchPath of searchPaths) {
        const basePath = path.join(workspaceRoot, searchPath);

        try {
          const entries = await fs.readdir(basePath, { withFileTypes: true });

          for (const entry of entries) {
            if (entry.isDirectory()) {
              const serverPath = path.join(basePath, entry.name);
              const packageJsonPath = path.join(serverPath, 'package.json');

              try {
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

                // Check if this is an MCP server
                if (packageJson.name?.includes('mcp-server') ||
                    packageJson.keywords?.includes('mcp-server') ||
                    packageJson.dependencies?.['@modelcontextprotocol/sdk']) {

                  const serverId = `local-${entry.name}`;
                  servers.push({
                    id: serverId,
                    name: packageJson.displayName || packageJson.name || entry.name,
                    description: packageJson.description || 'Local MCP Server',
                    command: 'node',
                    args: [path.join(serverPath, packageJson.main || 'index.js')],
                    type: 'local',
                    status: 'stopped' as const,
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

      console.log(`🔍 Discovered ${servers.length} local MCP servers`);

    } catch (error) {
      console.error('Error scanning for local MCP servers:', error);
    }

    return servers;
  }

  private async loadConfig(): Promise<MCPConfig | null> {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
      // Try multiple possible paths for mcp-config.json
      const possiblePaths = [
        path.join(process.cwd(), '../..', 'mcp-config.json'), // from chat/dist/backend
        path.join(process.cwd(), '..', 'mcp-config.json'),    // from chat/dist
        path.join(process.cwd(), 'mcp-config.json'),          // from chat
        path.join(__dirname, '../../../mcp-config.json'),     // relative to this file
      ];

      for (const configPath of possiblePaths) {
        try {
          const configData = await fs.readFile(configPath, 'utf-8');
          return JSON.parse(configData);
        } catch (error) {
          // Try next path
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async startServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) throw new Error(`Server ${serverId} not found`);

    try {
      console.log(`Starting server: ${server.name} (${server.type || 'unknown'})`);

      // Create MCP client
      const client = new Client(
        { name: 'mcp-chat-client', version: '1.0.0' },
        { capabilities: {} }
      );

      // Prepare environment variables for third-party servers
      const processEnv = Object.fromEntries(
        Object.entries(process.env).filter(([_, value]) => value !== undefined)
      ) as Record<string, string>;
      const env = server.env ? { ...processEnv, ...server.env } : processEnv;

      // Create transport - it will spawn the process internally
      const transport = new StdioClientTransport({
        command: server.command,
        args: server.args,
        env,
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
    const parts = functionName.split('_');
    const serverId = parts[0];
    const toolName = parts.slice(1).join('_'); // Rejoin the rest with underscores
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