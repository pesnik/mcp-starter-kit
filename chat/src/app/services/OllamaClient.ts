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
    messages: Array<{ role: string; content: string }>,
    tools?: any[]
  ): Promise<AsyncGenerator<string, void, unknown>> {
    const stream = await this.ollama.chat({
      model,
      messages,
      tools,
      stream: true,
    });

    return this.processStream(stream);
  }

  private async *processStream(stream: any): AsyncGenerator<string, void, unknown> {
    for await (const chunk of stream) {
      if (chunk.message?.content) {
        yield chunk.message.content;
      }

      // Handle tool calls
      if (chunk.message?.tool_calls) {
        for (const toolCall of chunk.message.tool_calls) {
          yield `\n🔧 **Tool Call**: ${toolCall.function.name}\n`;
          yield `📋 **Arguments**: \`${JSON.stringify(toolCall.function.arguments, null, 2)}\`\n`;
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