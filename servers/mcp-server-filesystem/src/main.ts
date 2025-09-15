#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';

interface ReadFileArgs {
  path: string;
}

interface WriteFileArgs {
  path: string;
  content: string;
}

interface ListDirectoryArgs {
  path: string;
}

class FilesystemMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'filesystem-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'read_file',
            description: 'Read the contents of a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'The path to the file to read',
                },
              },
              required: ['path'],
            },
          },
          {
            name: 'write_file',
            description: 'Write content to a file',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'The path to the file to write',
                },
                content: {
                  type: 'string',
                  description: 'The content to write to the file',
                },
              },
              required: ['path', 'content'],
            },
          },
          {
            name: 'list_directory',
            description: 'List the contents of a directory',
            inputSchema: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'The path to the directory to list',
                },
              },
              required: ['path'],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'read_file':
            return await this.readFile(args as unknown as ReadFileArgs);
          case 'write_file':
            return await this.writeFile(args as unknown as WriteFileArgs);
          case 'list_directory':
            return await this.listDirectory(args as unknown as ListDirectoryArgs);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async readFile(args: ReadFileArgs) {
    const content = await fs.readFile(resolve(args.path), 'utf-8');
    return {
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
    };
  }

  private async writeFile(args: WriteFileArgs) {
    await fs.mkdir(dirname(resolve(args.path)), { recursive: true });
    await fs.writeFile(resolve(args.path), args.content, 'utf-8');
    return {
      content: [
        {
          type: 'text',
          text: `Successfully wrote to ${args.path}`,
        },
      ],
    };
  }

  private async listDirectory(args: ListDirectoryArgs) {
    const files = await fs.readdir(resolve(args.path), { withFileTypes: true });
    const fileList = files.map((file) => ({
      name: file.name,
      type: file.isDirectory() ? 'directory' : 'file',
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(fileList, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Filesystem MCP Server running on stdio');
  }
}

const server = new FilesystemMCPServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
