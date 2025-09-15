#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import os from 'os';

// Create MCP server
const server = new Server(
  {
    name: 'greeting-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const TOOLS = [
  {
    name: 'greet_user',
    description: 'Greet the user with their system username and current time',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Optional custom message to include in greeting',
          default: 'Hello'
        }
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_system_info',
    description: 'Get basic system information like username, hostname, and OS',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  }
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'greet_user': {
        const customMessage = args?.message || 'Hello';
        const username = os.userInfo().username;
        const currentTime = new Date().toLocaleString();

        // Get a friendly time of day greeting
        const hour = new Date().getHours();
        let timeGreeting = '';
        if (hour < 12) timeGreeting = 'Good morning';
        else if (hour < 17) timeGreeting = 'Good afternoon';
        else timeGreeting = 'Good evening';

        const greeting = `${timeGreeting}, ${username}! 👋

Welcome to your MCP playground! I'm your locally developed greeting server, and I'm happy to meet you.

Hope you're having a wonderful day! 😊

*Current time: ${currentTime}*`;

        return {
          content: [
            {
              type: 'text',
              text: greeting,
            },
          ],
        };
      }

      case 'get_system_info': {
        const systemInfo = {
          username: os.userInfo().username,
          hostname: os.hostname(),
          platform: os.platform(),
          type: os.type(),
          release: os.release(),
          arch: os.arch(),
          uptime: Math.floor(os.uptime()),
          totalMemory: os.totalmem(),
          freeMemory: os.freemem(),
          currentTime: new Date().toISOString()
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(systemInfo, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Greeting MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});