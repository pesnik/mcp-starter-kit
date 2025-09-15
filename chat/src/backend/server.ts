#!/usr/bin/env node

import { createServer } from 'http';
import { parse } from 'url';
import { MCPServerManager } from './mcp-manager.js';

const manager = new MCPServerManager();
const PORT = process.env.PORT || 3001;

const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const { pathname } = parse(req.url!, true);

  try {
    if (pathname === '/api/servers' && req.method === 'GET') {
      const servers = await manager.discoverServers();
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(servers));

    } else if (pathname === '/api/servers/start' && req.method === 'POST') {
      const body = await getRequestBody(req);
      const { serverId } = JSON.parse(body);
      await manager.startServer(serverId);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));

    } else if (pathname === '/api/servers/stop' && req.method === 'POST') {
      const body = await getRequestBody(req);
      const { serverId } = JSON.parse(body);
      await manager.stopServer(serverId);
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));

    } else if (pathname === '/api/tools' && req.method === 'GET') {
      const tools = manager.getAvailableTools();
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(tools));

    } else if (pathname === '/api/tools/call' && req.method === 'POST') {
      const body = await getRequestBody(req);
      const { serverId, toolName, args } = JSON.parse(body);
      const result = await manager.callTool(serverId, toolName, args);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(result));

    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  } catch (error) {
    console.error('API Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }));
  }
});

function getRequestBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}

server.listen(PORT, () => {
  console.log(`🚀 MCP Chat Backend running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down MCP Chat Backend...');
  await manager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down MCP Chat Backend...');
  await manager.shutdown();
  process.exit(0);
});