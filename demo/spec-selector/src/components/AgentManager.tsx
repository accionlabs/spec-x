import { useState, useEffect } from 'react'
import {
  Server, Wifi, WifiOff, Database, Play, RefreshCw,
  AlertCircle, CheckCircle, Loader2, Terminal, Copy, Square
} from 'lucide-react'

interface AgentStatus {
  state: 'connected' | 'busy' | 'error'
  currentCommand?: string
  couchdbInstalled: boolean
  couchdbRunning: boolean
  couchdbVersion?: string
  lastError?: string
}

interface SystemInfo {
  hostname: string
  platform: string
  arch: string
  nodeVersion: string
  memory: number
  cpus?: number
  uptime?: number
}

interface AgentInfo {
  configName: string
  connected: boolean
  connectedAt?: string
  lastHeartbeat?: string
  status: AgentStatus
  systemInfo?: SystemInfo
}

const CONFIG_SERVER_URL = 'http://localhost:3002'

export default function AgentManager() {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commandOutput, setCommandOutput] = useState<string | null>(null)
  const [executingCommand, setExecutingCommand] = useState<string | null>(null)
  const [copiedScript, setCopiedScript] = useState(false)

  // Fetch agents on mount and periodically
  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${CONFIG_SERVER_URL}/agents`)
      if (!res.ok) throw new Error('Failed to fetch agents')
      const data = await res.json()
      setAgents(data.agents || [])
      setError(null)
    } catch (err) {
      setError('Could not connect to config server')
      console.error('Failed to fetch agents:', err)
    } finally {
      setLoading(false)
    }
  }

  const sendCommand = async (configName: string, command: string, params?: Record<string, unknown>) => {
    setExecutingCommand(`${configName}:${command}`)
    setCommandOutput(null)

    try {
      const res = await fetch(`${CONFIG_SERVER_URL}/agents/${configName}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, params })
      })

      const result = await res.json()

      if (res.ok) {
        setCommandOutput(result.output || 'Command completed successfully')
        // Refresh agents after command
        setTimeout(fetchAgents, 1000)
      } else {
        setCommandOutput(`Error: ${result.error || 'Command failed'}`)
      }
    } catch (err) {
      setCommandOutput(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setExecutingCommand(null)
    }
  }

  const copyInstallScript = () => {
    const script = `curl -sL ${CONFIG_SERVER_URL}/agent/install.sh | bash`
    navigator.clipboard.writeText(script)
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }

  const formatTimeSince = (dateStr?: string) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return date.toLocaleDateString()
  }

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Sync Agents</h2>
        <p className="text-sm text-gray-500">
          Manage sync agents installed on customer infrastructure
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <div className="font-medium text-red-800">{error}</div>
            <div className="text-sm text-red-600">Make sure config-server is running on port 3002</div>
          </div>
        </div>
      )}

      {/* Install Script */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Install Script</span>
          </div>
          <button
            onClick={copyInstallScript}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm font-medium"
          >
            {copiedScript ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
        <code className="block bg-gray-800 text-green-400 p-3 rounded-lg text-sm font-mono overflow-x-auto">
          curl -sL {CONFIG_SERVER_URL}/agent/install.sh | bash
        </code>
        <p className="text-xs text-gray-500 mt-2">
          Have customers run this command on their server to install the sync agent
        </p>
      </div>

      {/* Agent List */}
      {agents.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-600 mb-2">No Agents Connected</div>
          <div className="text-sm text-gray-400 max-w-sm mx-auto">
            Agents will appear here when customers run the install script on their servers
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent.configName}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              {/* Agent Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    agent.connected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {agent.connected ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">{agent.configName}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span>{agent.systemInfo?.hostname || 'Unknown host'}</span>
                      <span className="text-gray-300">|</span>
                      <span>{agent.systemInfo?.platform || 'unknown'}</span>
                      {agent.systemInfo?.arch && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span>{agent.systemInfo.arch}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  agent.connected
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {agent.connected ? 'Connected' : 'Disconnected'}
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">CouchDB:</span>
                  {agent.status.couchdbRunning ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Running {agent.status.couchdbVersion && `(${agent.status.couchdbVersion})`}
                    </span>
                  ) : agent.status.couchdbInstalled ? (
                    <span className="flex items-center gap-1 text-yellow-600 text-sm font-medium">
                      <AlertCircle className="w-4 h-4" />
                      Stopped
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Not installed</span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Last heartbeat: {formatTimeSince(agent.lastHeartbeat)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {!agent.status.couchdbInstalled && (
                  <button
                    onClick={() => sendCommand(agent.configName, 'install_couchdb')}
                    disabled={executingCommand !== null || !agent.connected}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {executingCommand === `${agent.configName}:install_couchdb` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Install CouchDB
                  </button>
                )}

                {agent.status.couchdbInstalled && agent.status.couchdbRunning && (
                  <button
                    onClick={() => sendCommand(agent.configName, 'restart_couchdb')}
                    disabled={executingCommand !== null || !agent.connected}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {executingCommand === `${agent.configName}:restart_couchdb` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Restart
                  </button>
                )}

                {agent.status.couchdbInstalled && agent.status.couchdbRunning && (
                  <button
                    onClick={() => sendCommand(agent.configName, 'stop_couchdb')}
                    disabled={executingCommand !== null || !agent.connected}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {executingCommand === `${agent.configName}:stop_couchdb` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    Stop
                  </button>
                )}

                {agent.status.couchdbInstalled && !agent.status.couchdbRunning && (
                  <button
                    onClick={() => sendCommand(agent.configName, 'install_couchdb')}
                    disabled={executingCommand !== null || !agent.connected}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {executingCommand === `${agent.configName}:install_couchdb` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Start
                  </button>
                )}

                <button
                  onClick={() => sendCommand(agent.configName, 'status')}
                  disabled={executingCommand !== null || !agent.connected}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {executingCommand === `${agent.configName}:status` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Terminal className="w-4 h-4" />
                  )}
                  Status
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Command Output */}
      {commandOutput && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-700">
            <span className="text-sm font-medium text-gray-300">Command Output</span>
            <button
              onClick={() => setCommandOutput(null)}
              className="text-gray-400 hover:text-gray-200 text-sm"
            >
              Clear
            </button>
          </div>
          <pre className="p-4 text-green-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap">
            {commandOutput}
          </pre>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-blue-800">Remote Management</div>
            <div className="text-sm text-blue-700 mt-1">
              Agents connect <strong>outbound</strong> to this server - no firewall changes needed on customer infrastructure.
              CouchDB is installed via Docker for easy management and updates.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
