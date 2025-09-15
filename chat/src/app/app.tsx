import { useState, useEffect, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { MCPManager } from './services/MCPManager';
import { OllamaClient } from './services/OllamaClient';
import { ServerManager } from './components/ServerManager';
import styles from './app.module.css';

export function App() {
  const [mcpManager] = useState(() => new MCPManager());
  const [ollamaClient] = useState(() => new OllamaClient());
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load available Ollama models
        const models = await ollamaClient.listModels();
        setAvailableModels(models);
        if (models.length > 0) {
          setSelectedModel(models[0]);
        }

        // Discover MCP servers
        const servers = await mcpManager.discoverServers();
        setMcpServers(servers);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [mcpManager, ollamaClient]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <h2>🚀 Initializing MCP Playground...</h2>
        <p>Setting up Ollama models and MCP servers...</p>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>🤖 MCP Playground Chat</h1>
        <div className={styles.modelSelector}>
          <label htmlFor="model-select">Model:</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className={styles.select}
          >
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.sidebar}>
          <ServerManager
            servers={mcpServers}
            mcpManager={mcpManager}
            onServersChange={setMcpServers}
          />
        </div>

        <div className={styles.chatContainer}>
          <ChatInterface
            ollamaClient={ollamaClient}
            mcpManager={mcpManager}
            selectedModel={selectedModel}
            availableServers={mcpServers}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
