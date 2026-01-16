import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { AgentManager } from './agents/agentManager.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONFIG_DIR = join(__dirname, 'configs')
const ACTIVE_CONFIG_FILE = join(__dirname, 'active-config.json')

// Server-level settings (can be overridden via environment variables)
const SERVER_SETTINGS = {
  featureEditorUrl: process.env.FEATURE_EDITOR_URL || 'http://localhost:3000',
  appUrl: process.env.APP_URL || 'http://localhost:3001'
}

// Ensure configs directory exists
if (!existsSync(CONFIG_DIR)) {
  const { mkdirSync } = await import('fs')
  mkdirSync(CONFIG_DIR, { recursive: true })
}

const app = express()
const PORT = 3002

// Enable CORS for all localhost origins
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}))

app.use(express.json())

// Preset configurations for demo
// Scenario IDs must match the feature registry in field-service-app
const PRESET_CONFIGS = {
  'full-featured': {
    name: 'Full Featured',
    description: 'All personas, all features enabled',
    config: {
      version: 'preset-full',
      generatedAt: null,
      features: {
        personas: ['technician', 'dispatcher', 'manager'],
        scenarios: [
          // Technician scenarios
          'view-work-orders', 'update-status', 'complete-checklist', 'capture-photos',
          'view-history', 'scan-barcode',
          // Dispatcher scenarios
          'view-unassigned', 'assign-to-technician', 'track-status', 'view-map',
          // Manager scenarios
          'completion-reports', 'performance-trends', 'individual-metrics', 'team-overview'
        ]
      },
      customFields: {
        workOrder: [
          { id: 'equipmentSerialNumber', name: 'equipmentSerialNumber', type: 'text', label: 'Equipment Serial #', required: false },
          { id: 'safetyChecklistCompleted', name: 'safetyChecklistCompleted', type: 'checkbox', label: 'Safety Checklist Completed', required: true },
          { id: 'customerSatisfaction', name: 'customerSatisfaction', type: 'rating', label: 'Customer Satisfaction', required: false },
          { id: 'partsUsed', name: 'partsUsed', type: 'text', label: 'Parts Used', required: false }
        ]
      },
      workflowStates: [
        { id: 'new', name: 'New', color: 'bg-gray-500', isCustom: false },
        { id: 'assigned', name: 'Assigned', color: 'bg-blue-500', isCustom: false },
        { id: 'in-progress', name: 'In Progress', color: 'bg-yellow-500', isCustom: false },
        { id: 'awaiting-parts', name: 'Awaiting Parts', color: 'bg-purple-500', isCustom: true },
        { id: 'requires-approval', name: 'Requires Approval', color: 'bg-orange-500', isCustom: true },
        { id: 'complete', name: 'Complete', color: 'bg-green-500', isCustom: false }
      ],
      constraints: {
        offlineFirst: true,
        languages: ['en', 'es'],
        infrastructure: 'team'
      }
    }
  },
  'technician-only': {
    name: 'Technician Only',
    description: 'Field technician features only - minimal footprint',
    config: {
      version: 'preset-tech',
      generatedAt: null,
      features: {
        personas: ['technician'],
        scenarios: ['view-work-orders', 'update-status', 'complete-checklist', 'view-history']
      },
      customFields: {
        workOrder: [
          { id: 'equipmentSerialNumber', name: 'equipmentSerialNumber', type: 'text', label: 'Equipment Serial #', required: false },
          { id: 'safetyChecklistCompleted', name: 'safetyChecklistCompleted', type: 'checkbox', label: 'Safety Checklist Completed', required: true }
        ]
      },
      workflowStates: [
        { id: 'new', name: 'New', color: 'bg-gray-500', isCustom: false },
        { id: 'assigned', name: 'Assigned', color: 'bg-blue-500', isCustom: false },
        { id: 'in-progress', name: 'In Progress', color: 'bg-yellow-500', isCustom: false },
        { id: 'complete', name: 'Complete', color: 'bg-green-500', isCustom: false }
      ],
      constraints: {
        offlineFirst: true,
        languages: ['en'],
        infrastructure: 'individual'
      }
    }
  },
  'dispatch-focused': {
    name: 'Dispatch Focused',
    description: 'Dispatcher and technician - team coordination',
    config: {
      version: 'preset-dispatch',
      generatedAt: null,
      features: {
        personas: ['technician', 'dispatcher'],
        scenarios: [
          // Technician
          'view-work-orders', 'update-status', 'complete-checklist', 'view-history',
          // Dispatcher
          'view-unassigned', 'assign-to-technician', 'track-status', 'view-map'
        ]
      },
      customFields: {
        workOrder: [
          { id: 'equipmentSerialNumber', name: 'equipmentSerialNumber', type: 'text', label: 'Equipment Serial #', required: false },
          { id: 'estimatedDuration', name: 'estimatedDuration', type: 'number', label: 'Estimated Duration (hrs)', required: false }
        ]
      },
      workflowStates: [
        { id: 'new', name: 'New', color: 'bg-gray-500', isCustom: false },
        { id: 'assigned', name: 'Assigned', color: 'bg-blue-500', isCustom: false },
        { id: 'in-progress', name: 'In Progress', color: 'bg-yellow-500', isCustom: false },
        { id: 'on-hold', name: 'On Hold', color: 'bg-orange-500', isCustom: true },
        { id: 'complete', name: 'Complete', color: 'bg-green-500', isCustom: false }
      ],
      constraints: {
        offlineFirst: true,
        languages: ['en', 'es'],
        infrastructure: 'team'
      }
    }
  },
  'manager-reports': {
    name: 'Manager + Reports',
    description: 'Focus on reporting and oversight',
    config: {
      version: 'preset-manager',
      generatedAt: null,
      features: {
        personas: ['technician', 'manager'],
        scenarios: [
          // Technician
          'view-work-orders', 'update-status', 'complete-checklist',
          // Manager
          'completion-reports', 'performance-trends', 'individual-metrics', 'team-overview'
        ]
      },
      customFields: {
        workOrder: [
          { id: 'customerSatisfaction', name: 'customerSatisfaction', type: 'rating', label: 'Customer Satisfaction', required: true },
          { id: 'resolutionNotes', name: 'resolutionNotes', type: 'text', label: 'Resolution Notes', required: false }
        ]
      },
      workflowStates: [
        { id: 'new', name: 'New', color: 'bg-gray-500', isCustom: false },
        { id: 'assigned', name: 'Assigned', color: 'bg-blue-500', isCustom: false },
        { id: 'in-progress', name: 'In Progress', color: 'bg-yellow-500', isCustom: false },
        { id: 'pending-review', name: 'Pending Review', color: 'bg-purple-500', isCustom: true },
        { id: 'complete', name: 'Complete', color: 'bg-green-500', isCustom: false }
      ],
      constraints: {
        offlineFirst: true,
        languages: ['en'],
        infrastructure: 'department'
      }
    }
  }
}

// Empty config returned when a config doesn't exist
// All deployments require a named configuration - no defaults
const EMPTY_CONFIG = {
  version: '0',
  generatedAt: null,
  features: {
    personas: [],
    scenarios: []
  },
  customFields: {
    workOrder: []
  },
  workflowStates: [],
  constraints: {
    offlineFirst: true,
    languages: ['en'],
    infrastructure: 'individual'
  }
}

// Get the active config name
function getActiveConfigName() {
  try {
    if (existsSync(ACTIVE_CONFIG_FILE)) {
      const data = JSON.parse(readFileSync(ACTIVE_CONFIG_FILE, 'utf-8'))
      return data.active || 'default'
    }
  } catch (err) {
    console.error('Error reading active config:', err.message)
  }
  return 'default'
}

// Set the active config name
function setActiveConfigName(name) {
  try {
    writeFileSync(ACTIVE_CONFIG_FILE, JSON.stringify({ active: name }, null, 2))
    return true
  } catch (err) {
    console.error('Error setting active config:', err.message)
    return false
  }
}

// Load a specific config by name
function loadConfigByName(name) {
  // Base metadata included in all responses
  const metadata = {
    _configName: name,
    _serverSettings: SERVER_SETTINGS
  }

  // Check if it's a preset
  if (PRESET_CONFIGS[name]) {
    return { ...PRESET_CONFIGS[name].config, ...metadata, _preset: name }
  }

  // Check saved configs
  const configPath = join(CONFIG_DIR, `${name}.json`)
  try {
    if (existsSync(configPath)) {
      const data = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(data)
      return { ...config, ...metadata }
    }
  } catch (err) {
    console.error(`Error loading config ${name}:`, err.message)
  }

  // Return empty config - no defaults
  return { ...EMPTY_CONFIG, ...metadata, _notFound: true }
}

// Load the active config
function loadConfig() {
  const activeName = getActiveConfigName()
  return loadConfigByName(activeName)
}

// Save config with a name
function saveConfigByName(name, config) {
  const configPath = join(CONFIG_DIR, `${name}.json`)
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2))
    return true
  } catch (err) {
    console.error(`Error saving config ${name}:`, err.message)
    return false
  }
}

// Save config (saves to active config)
function saveConfig(config) {
  const activeName = getActiveConfigName()
  if (activeName.startsWith('preset-') || PRESET_CONFIGS[activeName]) {
    // Don't overwrite presets - save as custom instead
    return saveConfigByName('custom', config)
  }
  return saveConfigByName(activeName === 'default' ? 'custom' : activeName, config)
}

// List all available configs
function listConfigs() {
  const configs = []

  // Add presets
  for (const [id, preset] of Object.entries(PRESET_CONFIGS)) {
    configs.push({
      id,
      name: preset.name,
      description: preset.description,
      isPreset: true,
      personas: preset.config.features.personas
    })
  }

  // Add saved configs
  try {
    const files = readdirSync(CONFIG_DIR)
    for (const file of files) {
      if (file.endsWith('.json')) {
        const id = file.replace('.json', '')
        const configPath = join(CONFIG_DIR, file)
        try {
          const data = JSON.parse(readFileSync(configPath, 'utf-8'))
          configs.push({
            id,
            name: data.name || id,
            description: data.description || 'Custom configuration',
            isPreset: false,
            personas: data.features?.personas || [],
            generatedAt: data.generatedAt
          })
        } catch (err) {
          // Skip invalid files
        }
      }
    }
  } catch (err) {
    console.error('Error listing configs:', err.message)
  }

  return configs
}

// GET /configs - List all available configs
app.get('/configs', (req, res) => {
  const configs = listConfigs()
  const active = getActiveConfigName()
  console.log(`[${new Date().toISOString()}] GET /configs - ${configs.length} configs, active: ${active}`)
  res.json({ configs, active })
})

// GET /config - Deprecated: use GET /config/:name instead
app.get('/config', (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /config - Deprecated endpoint. Use /config/:name`)
  res.json({
    ...EMPTY_CONFIG,
    _error: 'No config name specified. Use /config/:name to load a specific configuration.',
    _availablePresets: Object.keys(PRESET_CONFIGS)
  })
})

// GET /config/version - Return just the version for quick polling (must be before :name)
app.get('/config/version', (req, res) => {
  const config = loadConfig()
  const active = getActiveConfigName()
  res.json({ version: config.version, generatedAt: config.generatedAt, active })
})

// GET /config/:name - Return a specific config by name
app.get('/config/:name', (req, res) => {
  const { name } = req.params
  const config = loadConfigByName(name)
  console.log(`[${new Date().toISOString()}] GET /config/${name} - version: ${config.version}`)
  res.json(config)
})

// POST /config - Save a new configuration (requires _name)
app.post('/config', (req, res) => {
  const newConfig = req.body

  // Config name is required
  const configName = newConfig._name
  if (!configName) {
    return res.status(400).json({
      success: false,
      error: 'Config name is required. Include _name in the request body.'
    })
  }
  delete newConfig._name

  // Validate required fields
  if (!newConfig.version) {
    newConfig.version = Date.now().toString()
  }
  if (!newConfig.generatedAt) {
    newConfig.generatedAt = new Date().toISOString()
  }

  if (saveConfigByName(configName, newConfig)) {
    console.log(`[${new Date().toISOString()}] POST /config - saved as: ${configName}, version: ${newConfig.version}`)
    console.log('  - Personas:', newConfig.features?.personas?.join(', ') || 'none')
    console.log('  - Custom fields:', newConfig.customFields?.workOrder?.length || 0)
    console.log('  - Workflow states:', newConfig.workflowStates?.length || 0)
    res.json({
      success: true,
      version: newConfig.version,
      name: configName,
      appUrl: `http://localhost:3001/${configName}`
    })
  } else {
    res.status(500).json({ success: false, error: 'Failed to save config' })
  }
})

// POST /config/activate/:name - Set the active config
app.post('/config/activate/:name', (req, res) => {
  const { name } = req.params

  // Verify config exists
  const config = loadConfigByName(name)
  if (!config || config.version === '0') {
    return res.status(404).json({ success: false, error: 'Config not found' })
  }

  if (setActiveConfigName(name)) {
    console.log(`[${new Date().toISOString()}] POST /config/activate/${name} - activated`)
    res.json({ success: true, active: name, config })
  } else {
    res.status(500).json({ success: false, error: 'Failed to activate config' })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// ============================================================
// WebSocket Server for Sync Agents
// ============================================================

// Create HTTP server for both Express and WebSocket
const server = createServer(app)

// Config validator function for agent registration
function validateConfigExists(configName) {
  // Check presets
  if (PRESET_CONFIGS[configName]) return true
  // Check saved configs
  const configPath = join(CONFIG_DIR, `${configName}.json`)
  return existsSync(configPath)
}

// Initialize agent manager
const agentManager = new AgentManager(validateConfigExists)

// Create WebSocket server on /ws/agent path
const wss = new WebSocketServer({ server, path: '/ws/agent' })

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress
  console.log(`[WebSocket] New connection from ${clientIP}`)
  agentManager.handleConnection(ws)
})

// ============================================================
// Agent Management REST Endpoints
// ============================================================

// GET /agents - List all connected agents
app.get('/agents', (req, res) => {
  const result = agentManager.listAgents()
  console.log(`[${new Date().toISOString()}] GET /agents - ${result.agents.length} agents connected`)
  res.json(result)
})

// GET /agents/:configName - Get a specific agent
app.get('/agents/:configName', (req, res) => {
  const { configName } = req.params
  const agent = agentManager.getAgent(configName)

  if (!agent) {
    return res.status(404).json({ error: 'Agent not found or not connected' })
  }

  res.json(agent)
})

// POST /agents/:configName/command - Send command to agent
app.post('/agents/:configName/command', async (req, res) => {
  const { configName } = req.params
  const { command, params } = req.body

  if (!command) {
    return res.status(400).json({ error: 'Command is required' })
  }

  console.log(`[${new Date().toISOString()}] POST /agents/${configName}/command - ${command}`)

  try {
    const result = await agentManager.sendCommand(configName, command, params)
    res.json(result)
  } catch (err) {
    console.error(`[AgentCommand] Error: ${err.message}`)
    res.status(500).json({ error: err.message })
  }
})

// GET /agent/install.sh - Serve the install script
app.get('/agent/install.sh', (req, res) => {
  const serverUrl = req.query.server || `ws://${req.headers.host}/ws/agent`
  const configName = req.query.config || ''

  const script = `#!/bin/bash
# Sync Agent Installation Script
# Generated by config-server

set -e

INSTALL_DIR="\${INSTALL_DIR:-./sync-agent}"
CONFIG_NAME="${configName}"
SERVER_URL="${serverUrl}"

echo "================================"
echo "  Sync Agent Installer"
echo "================================"
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || {
  echo "Error: Node.js is required. Install it first.";
  exit 1;
}

command -v docker >/dev/null 2>&1 || {
  echo "Warning: Docker is recommended for CouchDB installation.";
}

# Get config name if not provided
if [ -z "$CONFIG_NAME" ]; then
  read -p "Enter your config name (from spec-selector): " CONFIG_NAME
fi

if [ -z "$CONFIG_NAME" ]; then
  echo "Error: Config name is required"
  exit 1
fi

# Create install directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Create package.json
cat > package.json << 'PKGEOF'
{
  "name": "sync-agent",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "ws": "^8.14.0"
  }
}
PKGEOF

# Create config file
cat > config.json << CFGEOF
{
  "configName": "$CONFIG_NAME",
  "serverUrl": "$SERVER_URL"
}
CFGEOF

echo "Installing dependencies..."
npm install --silent

echo ""
echo "================================"
echo "  Installation Complete!"
echo "================================"
echo ""
echo "Config: $CONFIG_NAME"
echo "Server: $SERVER_URL"
echo ""
echo "To start the agent, run:"
echo "  cd $INSTALL_DIR && node agent.js"
echo ""
echo "Download agent.js from the spec-selector repository"
echo "or copy it from the sync-agent package."
echo ""
`

  res.type('text/plain').send(script)
})

// ============================================================
// Start Server
// ============================================================

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           Config Server for Sp-a-a-S Demo                 ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                  ║
║                                                           ║
║  REST Endpoints:                                          ║
║    GET  /config/:name   - Load a specific config          ║
║    GET  /config/version - Get config version (polling)    ║
║    POST /config         - Save config (from spec-selector)║
║    GET  /agents         - List connected agents           ║
║    POST /agents/:name/command - Send command to agent     ║
║    GET  /agent/install.sh - Download install script       ║
║    GET  /health         - Health check                    ║
║                                                           ║
║  WebSocket:                                               ║
║    ws://localhost:${PORT}/ws/agent - Agent connections       ║
╚═══════════════════════════════════════════════════════════╝
  `)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...')
  agentManager.shutdown()
  server.close()
})
