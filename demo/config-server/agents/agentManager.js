import { randomUUID } from 'crypto'

/**
 * AgentManager handles WebSocket connections from sync agents
 * running on customer infrastructure.
 */
export class AgentManager {
  constructor(configValidator) {
    // Map of configName -> agent connection info
    this.agents = new Map()
    // Map of commandId -> { resolve, reject, timeout }
    this.pendingCommands = new Map()
    // Function to validate config names exist
    this.configValidator = configValidator
    // Cleanup interval for stale agents
    this.cleanupInterval = setInterval(() => this.cleanupStaleAgents(), 30000)
  }

  /**
   * Handle a new WebSocket connection
   */
  handleConnection(ws) {
    let configName = null

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        this.handleMessage(ws, msg, (name) => { configName = name })
      } catch (err) {
        console.error('[AgentManager] Error parsing message:', err.message)
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }))
      }
    })

    ws.on('close', () => {
      if (configName && this.agents.has(configName)) {
        console.log(`[AgentManager] Agent disconnected: ${configName}`)
        this.agents.delete(configName)
      }
    })

    ws.on('error', (err) => {
      console.error(`[AgentManager] WebSocket error for ${configName}:`, err.message)
    })

    // Send welcome message
    ws.send(JSON.stringify({ type: 'welcome', timestamp: Date.now() }))
  }

  /**
   * Handle incoming message from agent
   */
  handleMessage(ws, msg, setConfigName) {
    switch (msg.type) {
      case 'register':
        this.handleRegister(ws, msg, setConfigName)
        break

      case 'heartbeat':
        this.handleHeartbeat(ws, msg)
        break

      case 'command_response':
        this.handleCommandResponse(msg)
        break

      default:
        console.log(`[AgentManager] Unknown message type: ${msg.type}`)
    }
  }

  /**
   * Handle agent registration
   */
  handleRegister(ws, msg, setConfigName) {
    const { configName, systemInfo } = msg

    if (!configName) {
      ws.send(JSON.stringify({ type: 'register_ack', success: false, error: 'Config name required' }))
      ws.close(4001, 'Config name required')
      return
    }

    // Validate config exists
    if (!this.configValidator(configName)) {
      ws.send(JSON.stringify({ type: 'register_ack', success: false, error: 'Unknown config name' }))
      ws.close(4002, 'Unknown config name')
      return
    }

    // Check if agent already connected
    if (this.agents.has(configName)) {
      const existing = this.agents.get(configName)
      // Close old connection
      try {
        existing.ws.close(4003, 'Replaced by new connection')
      } catch (e) {
        // Ignore close errors
      }
    }

    // Store agent connection
    setConfigName(configName)
    this.agents.set(configName, {
      configName,
      ws,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      status: {
        state: 'connected',
        couchdbInstalled: false,
        couchdbRunning: false,
        couchdbVersion: null,
        lastError: null
      },
      systemInfo: systemInfo || {}
    })

    console.log(`[AgentManager] Agent registered: ${configName} (${systemInfo?.hostname || 'unknown'})`)

    ws.send(JSON.stringify({
      type: 'register_ack',
      success: true,
      timestamp: Date.now()
    }))
  }

  /**
   * Handle heartbeat from agent
   */
  handleHeartbeat(ws, msg) {
    const { configName, status } = msg

    if (!configName || !this.agents.has(configName)) {
      return
    }

    const agent = this.agents.get(configName)
    agent.lastHeartbeat = new Date()
    if (status) {
      agent.status = { ...agent.status, ...status }
    }

    ws.send(JSON.stringify({ type: 'heartbeat_ack', timestamp: Date.now() }))
  }

  /**
   * Handle command response from agent
   */
  handleCommandResponse(msg) {
    const { commandId, success, output, error } = msg

    const pending = this.pendingCommands.get(commandId)
    if (!pending) {
      console.log(`[AgentManager] Received response for unknown command: ${commandId}`)
      return
    }

    clearTimeout(pending.timeout)
    this.pendingCommands.delete(commandId)

    if (success) {
      pending.resolve({ success: true, output })
    } else {
      pending.reject(new Error(error || 'Command failed'))
    }
  }

  /**
   * Send a command to an agent
   */
  async sendCommand(configName, command, params = {}, timeoutMs = 60000) {
    const agent = this.agents.get(configName)

    if (!agent) {
      throw new Error('Agent not connected')
    }

    if (agent.ws.readyState !== 1) { // WebSocket.OPEN
      throw new Error('Agent connection not ready')
    }

    const commandId = randomUUID()

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(commandId)
        reject(new Error('Command timeout'))
      }, timeoutMs)

      this.pendingCommands.set(commandId, { resolve, reject, timeout })

      agent.status.state = 'busy'
      agent.status.currentCommand = command

      agent.ws.send(JSON.stringify({
        type: 'command',
        commandId,
        command,
        params,
        timestamp: Date.now()
      }))

      console.log(`[AgentManager] Sent command to ${configName}: ${command}`)
    }).finally(() => {
      if (agent) {
        agent.status.state = 'connected'
        agent.status.currentCommand = null
      }
    })
  }

  /**
   * List all connected agents
   */
  listAgents() {
    const agents = []

    for (const [configName, agent] of this.agents) {
      agents.push({
        configName,
        connected: agent.ws.readyState === 1,
        connectedAt: agent.connectedAt.toISOString(),
        lastHeartbeat: agent.lastHeartbeat.toISOString(),
        status: agent.status,
        systemInfo: agent.systemInfo
      })
    }

    return { agents }
  }

  /**
   * Get a specific agent
   */
  getAgent(configName) {
    const agent = this.agents.get(configName)
    if (!agent) return null

    return {
      configName,
      connected: agent.ws.readyState === 1,
      connectedAt: agent.connectedAt.toISOString(),
      lastHeartbeat: agent.lastHeartbeat.toISOString(),
      status: agent.status,
      systemInfo: agent.systemInfo
    }
  }

  /**
   * Clean up stale agent connections (no heartbeat for 90s)
   */
  cleanupStaleAgents() {
    const now = Date.now()
    const staleThreshold = 90000 // 90 seconds

    for (const [configName, agent] of this.agents) {
      const lastHeartbeat = agent.lastHeartbeat.getTime()
      if (now - lastHeartbeat > staleThreshold) {
        console.log(`[AgentManager] Removing stale agent: ${configName}`)
        try {
          agent.ws.close(4004, 'Heartbeat timeout')
        } catch (e) {
          // Ignore close errors
        }
        this.agents.delete(configName)
      }
    }
  }

  /**
   * Shutdown the agent manager
   */
  shutdown() {
    clearInterval(this.cleanupInterval)

    for (const [configName, agent] of this.agents) {
      try {
        agent.ws.close(1001, 'Server shutting down')
      } catch (e) {
        // Ignore close errors
      }
    }

    this.agents.clear()
    this.pendingCommands.clear()
  }
}
