#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  ListToolsResultSchema,
  CallToolResultSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';

class MCPTestClient {
  private client: Client;

  constructor() {
    this.client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  async connectToServer(serverCommand: string, serverArgs: string[] = []) {
    console.log(`Connecting to server: ${serverCommand} ${serverArgs.join(' ')}`);

    const serverProcess = spawn(serverCommand, serverArgs, {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    const transport = new StdioClientTransport({
      reader: serverProcess.stdout!,
      writer: serverProcess.stdin!,
    });

    await this.client.connect(transport);
    console.log('Connected to MCP server');

    return serverProcess;
  }

  async listTools() {
    console.log('\n=== Available Tools ===');
    const response = await this.client.request(
      { method: 'tools/list' },
      ListToolsRequestSchema
    );

    const tools = (response as any).tools || [];
    tools.forEach((tool: any) => {
      console.log(`\n🔧 ${tool.name}: ${tool.description}`);
      console.log(`   Input schema: ${JSON.stringify(tool.inputSchema, null, 2)}`);
    });

    return tools;
  }

  async callTool(name: string, args: any) {
    console.log(`\n=== Calling Tool: ${name} ===`);
    console.log(`Arguments: ${JSON.stringify(args, null, 2)}`);

    try {
      const response = await this.client.request(
        { method: 'tools/call', params: { name, arguments: args } },
        CallToolRequestSchema
      );

      console.log('Response:');
      const content = (response as any).content || [];
      content.forEach((item: any) => {
        console.log(item.text);
      });

      return response;
    } catch (error) {
      console.error(`Error calling tool: ${error}`);
      throw error;
    }
  }

  async testFilesystemServer() {
    console.log('\n🧪 Testing Filesystem Server');

    const tools = await this.listTools();

    if (tools.find((t: any) => t.name === 'write_file')) {
      await this.callTool('write_file', {
        path: './test-file.txt',
        content: 'Hello from MCP test client!'
      });
    }

    if (tools.find((t: any) => t.name === 'read_file')) {
      await this.callTool('read_file', {
        path: './test-file.txt'
      });
    }

    if (tools.find((t: any) => t.name === 'list_directory')) {
      await this.callTool('list_directory', {
        path: '.'
      });
    }
  }

  async testWebServer() {
    console.log('\n🧪 Testing Web Server');

    const tools = await this.listTools();

    if (tools.find((t: any) => t.name === 'fetch_url')) {
      await this.callTool('fetch_url', {
        url: 'https://example.com'
      });
    }
  }

  async disconnect() {
    await this.client.close();
    console.log('Disconnected from server');
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npm run test-client filesystem  # Test filesystem server');
    console.log('  npm run test-client web         # Test web server');
    console.log('  npm run test-client custom <command> [args...]  # Test custom server');
    return;
  }

  const testClient = new MCPTestClient();
  let serverProcess: any;

  try {
    const serverType = args[0];

    switch (serverType) {
      case 'filesystem':
        serverProcess = await testClient.connectToServer('npx', ['nx', 'run', 'mcp-server-filesystem:serve']);
        await testClient.testFilesystemServer();
        break;

      case 'web':
        serverProcess = await testClient.connectToServer('python', ['./apps/mcp-server-web-python/src/main.py']);
        await testClient.testWebServer();
        break;

      case 'custom':
        if (args.length < 2) {
          console.error('Custom server requires command argument');
          process.exit(1);
        }
        serverProcess = await testClient.connectToServer(args[1], args.slice(2));
        await testClient.listTools();
        break;

      default:
        console.error(`Unknown server type: ${serverType}`);
        process.exit(1);
    }

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await testClient.disconnect();
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}
