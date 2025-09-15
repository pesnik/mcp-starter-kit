import { useState } from 'react';
import { MCPManager, MCPServer } from '../services/MCPManager';
import styles from './ServerManager.module.css';

interface ServerManagerProps {
  servers: MCPServer[];
  mcpManager: MCPManager;
  onServersChange: (servers: MCPServer[]) => void;
}

export function ServerManager({ servers, mcpManager, onServersChange }: ServerManagerProps) {
  const [loadingServers, setLoadingServers] = useState<Set<string>>(new Set());

  const handleStartServer = async (serverId: string) => {
    setLoadingServers(prev => new Set(prev).add(serverId));
    try {
      await mcpManager.startServer(serverId);
      onServersChange(mcpManager.getAllServers());
    } catch (error) {
      console.error('Failed to start server:', error);
    } finally {
      setLoadingServers(prev => {
        const next = new Set(prev);
        next.delete(serverId);
        return next;
      });
    }
  };

  const handleStopServer = async (serverId: string) => {
    setLoadingServers(prev => new Set(prev).add(serverId));
    try {
      await mcpManager.stopServer(serverId);
      onServersChange(mcpManager.getAllServers());
    } catch (error) {
      console.error('Failed to stop server:', error);
    } finally {
      setLoadingServers(prev => {
        const next = new Set(prev);
        next.delete(serverId);
        return next;
      });
    }
  };

  const getStatusIcon = (status: MCPServer['status']) => {
    switch (status) {
      case 'running': return '🟢';
      case 'stopped': return '🔴';
      case 'error': return '🟡';
      default: return '⚪';
    }
  };

  const getStatusText = (status: MCPServer['status']) => {
    switch (status) {
      case 'running': return 'Running';
      case 'stopped': return 'Stopped';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className={styles.serverManager}>
      <h3>🖥️ MCP Servers</h3>

      <div className={styles.servers}>
        {servers.map((server) => (
          <div key={server.id} className={`${styles.server} ${styles[server.status]}`}>
            <div className={styles.serverHeader}>
              <div className={styles.serverInfo}>
                <span className={styles.status}>
                  {getStatusIcon(server.status)}
                </span>
                <div>
                  <h4 className={styles.serverName}>{server.name}</h4>
                  <p className={styles.serverDescription}>{server.description}</p>
                </div>
              </div>

              <div className={styles.serverControls}>
                {server.status === 'running' ? (
                  <button
                    onClick={() => handleStopServer(server.id)}
                    disabled={loadingServers.has(server.id)}
                    className={`${styles.button} ${styles.stopButton}`}
                  >
                    {loadingServers.has(server.id) ? '⏳' : '⏹️'} Stop
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartServer(server.id)}
                    disabled={loadingServers.has(server.id)}
                    className={`${styles.button} ${styles.startButton}`}
                  >
                    {loadingServers.has(server.id) ? '⏳' : '▶️'} Start
                  </button>
                )}
              </div>
            </div>

            <div className={styles.serverDetails}>
              <div className={styles.command}>
                <strong>Command:</strong> <code>{server.command} {server.args.join(' ')}</code>
              </div>
              <div className={styles.statusText}>
                <strong>Status:</strong> {getStatusText(server.status)}
              </div>

              {server.status === 'running' && server.tools && (
                <div className={styles.tools}>
                  <strong>Tools ({server.tools.length}):</strong>
                  <div className={styles.toolList}>
                    {server.tools.map((tool, i) => (
                      <span key={i} className={styles.tool}>
                        🔧 {tool.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {server.status === 'running' && server.resources && server.resources.length > 0 && (
                <div className={styles.resources}>
                  <strong>Resources ({server.resources.length}):</strong>
                  <div className={styles.resourceList}>
                    {server.resources.map((resource, i) => (
                      <span key={i} className={styles.resource}>
                        📄 {resource.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.addServer}>
        <h4>➕ Add Custom Server</h4>
        <p className={styles.hint}>
          To add a custom MCP server, edit the <code>MCPManager.discoverServers()</code> method
          or use the CLI test client to connect to external servers.
        </p>
        <div className={styles.examples}>
          <strong>Examples:</strong>
          <ul>
            <li><code>npx @modelcontextprotocol/server-memory</code></li>
            <li><code>npx @modelcontextprotocol/server-github</code></li>
            <li><code>python custom-server.py</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}