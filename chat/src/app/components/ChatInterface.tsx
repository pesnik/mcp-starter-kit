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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      const availableTools = mcpManager.getOllamaFunctions();

      // Stream response from Ollama
      const stream = await ollamaClient.chat(
        selectedModel,
        conversationMessages,
        availableTools.length > 0 ? availableTools : undefined
      );

      let assistantContent = '';
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      for await (const chunk of stream) {
        assistantContent += chunk;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id
              ? { ...m, content: assistantContent }
              : m
          )
        );
      }

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
  const availableTools = mcpManager.getAvailableTools();

  return (
    <div className={styles.chatInterface}>
      <div className={styles.header}>
        <h3>Chat with {selectedModel}</h3>
        <div className={styles.status}>
          <span className={styles.serverCount}>
            🖥️ {runningServers.length} servers running
          </span>
          <span className={styles.toolCount}>
            🔧 {availableTools.length} tools available
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
                {message.role === 'user' ? '👤' : message.role === 'assistant' ? '🤖' : '💡'}
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
                <strong>🔧 Tool Calls:</strong>
                {message.toolCalls.map((call, i) => (
                  <div key={i} className={styles.toolCall}>
                    <code>{JSON.stringify(call, null, 2)}</code>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.messageHeader}>
              <span className={styles.role}>🤖 assistant</span>
            </div>
            <div className={styles.content}>
              <div className={styles.typing}>💭 Thinking...</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              availableTools.length > 0
                ? "Ask me anything! I can use MCP tools to help you..."
                : "Start some MCP servers to enable tool usage..."
            }
            disabled={isStreaming}
            className={styles.input}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className={styles.sendButton}
          >
            {isStreaming ? '⏳' : '🚀'}
          </button>
        </div>

        {availableTools.length > 0 && (
          <div className={styles.availableTools}>
            <strong>Available tools:</strong> {' '}
            {availableTools.map((tool, i) => (
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