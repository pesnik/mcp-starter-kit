import { useState, useRef, useEffect } from 'react';
import { OllamaClient } from '../services/OllamaClient';
import { MCPManager } from '../services/MCPManager';
import styles from './ChatInterface.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: any[];
}

interface ChatInterfaceProps {
  ollamaClient: OllamaClient;
  mcpManager: MCPManager;
  selectedModel: string;
  availableServers: any[];
}

export function ChatInterface({
  ollamaClient,
  mcpManager,
  selectedModel,
  availableServers
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'system',
      content: '🎮 Welcome to MCP Playground! I can help you with file operations, web scraping, and more using the connected MCP servers.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [availableToolsCount, setAvailableToolsCount] = useState(0);
  const [availableToolsDisplay, setAvailableToolsDisplay] = useState<Array<{ serverId: string; serverName: string; tool: any }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const updateTools = async () => {
      try {
        const tools = await mcpManager.getAvailableTools();
        setAvailableToolsCount(tools.length);
        setAvailableToolsDisplay(tools);
      } catch (error) {
        console.error('Failed to get tools:', error);
        setAvailableToolsCount(0);
        setAvailableToolsDisplay([]);
      }
    };

    updateTools();
    // Update tools when servers change
  }, [availableServers, mcpManager]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      // Prepare conversation context
      const conversationMessages = messages
        .filter(m => m.role !== 'system')
        .concat(userMessage)
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      // Get available MCP tools
      const availableTools = await mcpManager.getOllamaFunctions();

      // Create initial assistant message
      let assistantContent = '';
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        toolCalls: [],
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle conversation with potential function calls
      let currentMessages = [...conversationMessages];
      let hasToolCalls = false;

      do {
        hasToolCalls = false;

        // Stream response from Ollama
        const stream = await ollamaClient.chat(
          selectedModel,
          currentMessages,
          availableTools.length > 0 ? availableTools : undefined
        );

        let currentResponse = '';
        let toolCalls: any[] = [];

        for await (const chunk of stream) {
          if (chunk.type === 'content') {
            currentResponse += chunk.content;
            assistantContent += chunk.content;
          } else if (chunk.type === 'tool_call') {
            toolCalls.push(chunk.toolCall);
            hasToolCalls = true;
          }

          // Update UI in real-time
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id
                ? { ...m, content: assistantContent, toolCalls: [...(m.toolCalls || []), ...toolCalls] }
                : m
            )
          );
        }

        if (hasToolCalls) {
          // Add assistant message with tool calls
          currentMessages.push({
            role: 'assistant',
            content: currentResponse,
            tool_calls: toolCalls
          });

          // Execute tool calls and add results
          for (const toolCall of toolCalls) {
            try {
              assistantContent += `\n\n🔧 **Calling ${toolCall.function.name}**\n`;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMessage.id
                    ? { ...m, content: assistantContent }
                    : m
                )
              );

              const result = await mcpManager.handleFunctionCall(
                toolCall.function.name,
                toolCall.function.arguments
              );

              const resultText = typeof result.content === 'string'
                ? result.content
                : result.content?.[0]?.text || JSON.stringify(result, null, 2);

              assistantContent += `📊 **Result**: ${resultText}\n`;

              // Add tool result to conversation
              currentMessages.push({
                role: 'tool',
                content: resultText,
                tool_call_id: toolCall.id
              });

            } catch (error) {
              const errorMsg = `❌ Tool call failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
              assistantContent += errorMsg + '\n';

              currentMessages.push({
                role: 'tool',
                content: errorMsg,
                tool_call_id: toolCall.id
              });
            }

            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMessage.id
                  ? { ...m, content: assistantContent }
                  : m
              )
            );
          }
        } else {
          // No tool calls, just add the response
          currentMessages.push({
            role: 'assistant',
            content: currentResponse
          });
        }

      } while (hasToolCalls); // Continue if there were tool calls

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const runningServers = availableServers.filter(s => s.status === 'running');

  return (
    <div className={styles.chatInterface}>
      <div className={styles.header}>
        <h3>Chat with {selectedModel}</h3>
        <div className={styles.status}>
          <span className={styles.serverCount}>
            <span>●</span> {runningServers.length} servers
          </span>
          <span className={styles.toolCount}>
            <span>⚡</span> {availableToolsCount} tools
          </span>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`${styles.message} ${styles[message.role]}`}
          >
            <div className={styles.messageHeader}>
              <span className={styles.role}>
                {message.role}
              </span>
              <span className={styles.timestamp}>
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className={styles.content}>
              {message.content.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className={styles.toolCalls}>
                <strong>Tool Calls</strong>
                {message.toolCalls.map((call, i) => (
                  <div key={i} className={styles.toolCall}>
                    <div><strong>{call.function?.name || 'Unknown'}</strong></div>
                    <div style={{marginTop: '0.5rem', fontSize: '0.75rem', color: '#aaa'}}>
                      {call.function?.arguments ? (() => {
                        try {
                          const args = typeof call.function.arguments === 'string'
                            ? JSON.parse(call.function.arguments)
                            : call.function.arguments;
                          return JSON.stringify(args, null, 2);
                        } catch (e) {
                          return call.function.arguments.toString();
                        }
                      })() : 'No arguments'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.messageHeader}>
              <span className={styles.role}>assistant</span>
            </div>
            <div className={styles.content}>
              <div className={styles.typing}>Thinking...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={styles.inputContainer}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={
              availableToolsCount > 0
                ? "Ask me anything! I can use MCP tools to help you... (Shift+Enter for new line)"
                : "Start some MCP servers to enable tool usage..."
            }
            disabled={isStreaming}
            className={styles.input}
            rows={1}
            style={{ resize: 'none' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className={styles.sendButton}
          >
            {isStreaming ? '⏳' : 'Send'}
          </button>
        </div>

        {availableToolsDisplay.length > 0 && (
          <div className={styles.availableTools}>
            <strong>Available tools:</strong> {' '}
            {availableToolsDisplay.map((tool, i) => (
              <span key={i} className={styles.toolBadge}>
                {tool.serverName}: {tool.tool.name}
              </span>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}