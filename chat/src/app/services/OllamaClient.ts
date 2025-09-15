import { Ollama } from 'ollama';

export class OllamaClient {
  private ollama: Ollama;

  constructor(host = 'http://localhost:11434') {
    this.ollama = new Ollama({ host });
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await this.ollama.list();
      return response.models.map(model => model.name);
    } catch (error) {
      console.warn('Ollama not available, using fallback models:', error);
      // Return some common models as fallback
      return ['llama3.2:3b', 'llama3.2:1b', 'phi3:mini'];
    }
  }

  async chat(
    model: string,
    messages: Array<{ role: string; content: string; tool_calls?: any[]; tool_call_id?: string }>,
    tools?: any[]
  ): Promise<AsyncGenerator<{ type: 'content'; content: string } | { type: 'tool_call'; toolCall: any }, void, unknown>> {
    const stream = await this.ollama.chat({
      model,
      messages,
      tools,
      stream: true,
    });

    return this.processStream(stream);
  }

  private async *processStream(stream: any): AsyncGenerator<{ type: 'content'; content: string } | { type: 'tool_call'; toolCall: any }, void, unknown> {
    for await (const chunk of stream) {
      // Handle regular content
      if (chunk.message?.content) {
        yield {
          type: 'content',
          content: chunk.message.content
        };
      }

      // Handle tool calls
      if (chunk.message?.tool_calls) {
        for (const toolCall of chunk.message.tool_calls) {
          yield {
            type: 'tool_call',
            toolCall: {
              id: toolCall.id || `call_${Date.now()}`,
              function: {
                name: toolCall.function.name,
                arguments: toolCall.function.arguments
              }
            }
          };
        }
      }
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch {
      return false;
    }
  }

  async pullModel(model: string): Promise<void> {
    await this.ollama.pull({ model });
  }
}