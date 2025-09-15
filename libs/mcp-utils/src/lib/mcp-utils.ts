export interface MCPServerConfig {
  name: string;
  version: string;
  description?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

export class MCPValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MCPValidationError';
  }
}

export function validateToolArgs(args: any, schema: object): boolean {
  // Basic validation - in a real implementation you'd use a JSON schema validator
  if (!args || typeof args !== 'object') {
    throw new MCPValidationError('Arguments must be an object');
  }
  return true;
}

export function formatMCPError(error: Error): object {
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

export function createSuccessResponse(content: string): object {
  return {
    content: [
      {
        type: 'text',
        text: content,
      },
    ],
  };
}

export function sanitizeFilePath(path: string): string {
  // Basic path sanitization - remove dangerous patterns
  return path.replace(/\.\./g, '').replace(/\/+/g, '/');
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
