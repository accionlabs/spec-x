// PouchDB is loaded via CDN in index.html
declare const PouchDB: new (name: string) => PouchDBInstance

interface SyncHandler {
  on(event: 'change' | 'paused' | 'active' | 'denied' | 'complete' | 'error', listener: (info?: any) => void): SyncHandler
  cancel(): void
}

interface PouchDBInstance {
  allDocs(options?: { include_docs?: boolean }): Promise<{
    rows: Array<{ doc?: any; id: string; value: { rev: string } }>
  }>
  get(id: string): Promise<any>
  put(doc: any): Promise<{ ok: boolean; id: string; rev: string }>
  remove(doc: any): Promise<{ ok: boolean; id: string; rev: string }>
  sync(remote: string, options?: { live?: boolean; retry?: boolean }): SyncHandler
}

// Sync state
interface SyncState {
  isActive: boolean
  isPaused: boolean
  lastSync: Date | null
  error: string | null
}

let syncHandlers: SyncHandler[] = []
let currentSyncState: SyncState = {
  isActive: false,
  isPaused: false,
  lastSync: null,
  error: null
}
let syncStateListeners: ((state: SyncState) => void)[] = []

function notifySyncStateChange() {
  syncStateListeners.forEach(listener => listener(currentSyncState))
}

export function subscribeSyncState(listener: (state: SyncState) => void): () => void {
  syncStateListeners.push(listener)
  listener(currentSyncState)
  return () => {
    syncStateListeners = syncStateListeners.filter(l => l !== listener)
  }
}

export function getSyncState(): SyncState {
  return { ...currentSyncState }
}

// Types
export interface WorkOrder {
  _id: string
  _rev?: string
  type: 'work-order'
  title: string
  description: string
  status: 'new' | 'assigned' | 'in-progress' | 'awaiting-parts' | 'complete'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignedTo: string
  dueDate: string
  location: string
  // Custom fields (from spec)
  equipmentSerialNumber?: string
  safetyChecklistCompleted?: boolean
  customerSatisfaction?: number
  // Photos - stored as base64 data URLs
  photos?: string[]
  // Service data
  checklist: {
    inspect: boolean
    diagnose: boolean
    repair: boolean
    test: boolean
    cleanup: boolean
  }
  notes: string[]
  createdAt: string
  updatedAt: string
}

export interface Equipment {
  _id: string
  _rev?: string
  type: 'equipment'
  name: string
  serialNumber: string
  manufacturer: string
  installDate: string
  lastService?: string
  location?: string
}

// Config and persona-aware database names
// Each deployment (config) gets isolated storage
type PersonaId = 'technician' | 'dispatcher' | 'manager'

const PERSONA_IDS = ['technician', 'dispatcher', 'manager']

function parsePathForDB(): { configName: string | null; personaId: PersonaId } {
  const path = window.location.pathname
  const segments = path.replace(/^\//, '').split('/').filter(Boolean)

  if (segments.length === 0) {
    return { configName: null, personaId: 'technician' }
  }

  // Check if first segment is a persona ID (old URL format - not supported)
  if (PERSONA_IDS.includes(segments[0])) {
    return { configName: null, personaId: segments[0] as PersonaId }
  }

  // First segment is config name, second is persona
  // Format: /{configName}/{personaId}/...
  const configName = segments[0]
  const personaId = (segments[1] && PERSONA_IDS.includes(segments[1]))
    ? segments[1] as PersonaId
    : 'technician'

  return { configName, personaId }
}

function getDBName(baseName: string): string {
  const { configName, personaId } = parsePathForDB()
  // Include config name for deployment isolation
  const prefix = configName ? `${configName}-${personaId}` : personaId
  return `fieldservice-${prefix}-${baseName}`
}

function getPersonaFromPath(): PersonaId {
  return parsePathForDB().personaId
}

// Initialize databases - persona-specific
let workOrdersDB: PouchDBInstance | null = null
let equipmentDB: PouchDBInstance | null = null

function getWorkOrdersDB(): PouchDBInstance {
  if (!workOrdersDB) {
    workOrdersDB = new PouchDB(getDBName('workorders'))
  }
  return workOrdersDB
}

function getEquipmentDB(): PouchDBInstance {
  if (!equipmentDB) {
    equipmentDB = new PouchDB(getDBName('equipment'))
  }
  return equipmentDB
}

// Different seed data based on persona
function getSeedWorkOrders(): Omit<WorkOrder, '_rev'>[] {
  const persona = getPersonaFromPath()
  const baseDate = new Date()

  // Common work orders - but different views per persona
  const allWorkOrders: Omit<WorkOrder, '_rev'>[] = [
    {
      _id: 'wo-001',
      type: 'work-order',
      title: 'HVAC Unit Maintenance',
      description: 'Annual preventive maintenance for rooftop HVAC unit',
      status: 'assigned',
      priority: 'medium',
      assignedTo: 'John Smith',
      dueDate: new Date(baseDate.getTime() + 86400000).toISOString().split('T')[0],
      location: '123 Main St, Building A',
      equipmentSerialNumber: 'HVAC-2023-001',
      safetyChecklistCompleted: false,
      checklist: { inspect: false, diagnose: false, repair: false, test: false, cleanup: false },
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'wo-002',
      type: 'work-order',
      title: 'Emergency Cooling Repair',
      description: 'Server room AC not cooling. Temperature rising.',
      status: 'in-progress',
      priority: 'critical',
      assignedTo: 'John Smith',
      dueDate: baseDate.toISOString().split('T')[0],
      location: '456 Tech Park, Data Center',
      equipmentSerialNumber: 'AC-DC-2022-045',
      safetyChecklistCompleted: false,
      checklist: { inspect: true, diagnose: true, repair: false, test: false, cleanup: false },
      notes: ['Compressor making unusual noise', 'Refrigerant levels low'],
      createdAt: new Date(baseDate.getTime() - 3600000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'wo-003',
      type: 'work-order',
      title: 'Generator Inspection',
      description: 'Quarterly inspection of backup generator',
      status: 'new',
      priority: 'low',
      assignedTo: '',
      dueDate: new Date(baseDate.getTime() + 604800000).toISOString().split('T')[0],
      location: '789 Industrial Ave',
      equipmentSerialNumber: 'GEN-2021-012',
      safetyChecklistCompleted: false,
      checklist: { inspect: false, diagnose: false, repair: false, test: false, cleanup: false },
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'wo-004',
      type: 'work-order',
      title: 'Elevator Service Call',
      description: 'Elevator stuck on 3rd floor. Passengers evacuated.',
      status: 'awaiting-parts',
      priority: 'high',
      assignedTo: 'Maria Garcia',
      dueDate: baseDate.toISOString().split('T')[0],
      location: '321 Commerce Blvd, Tower B',
      equipmentSerialNumber: 'ELEV-2019-003',
      safetyChecklistCompleted: true,
      checklist: { inspect: true, diagnose: true, repair: false, test: false, cleanup: false },
      notes: ['Motor controller failure', 'Part ordered: MC-4500X'],
      createdAt: new Date(baseDate.getTime() - 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'wo-005',
      type: 'work-order',
      title: 'Fire Alarm Inspection',
      description: 'Annual fire alarm system inspection',
      status: 'complete',
      priority: 'high',
      assignedTo: 'Sarah Johnson',
      dueDate: new Date(baseDate.getTime() - 172800000).toISOString().split('T')[0],
      location: '555 Office Park, Building C',
      equipmentSerialNumber: 'FIRE-2020-008',
      safetyChecklistCompleted: true,
      customerSatisfaction: 5,
      checklist: { inspect: true, diagnose: true, repair: true, test: true, cleanup: true },
      notes: ['All systems functional', 'Replaced battery in panel'],
      createdAt: new Date(baseDate.getTime() - 259200000).toISOString(),
      updatedAt: new Date(baseDate.getTime() - 172800000).toISOString()
    }
  ]

  // Filter based on persona role
  switch (persona) {
    case 'technician':
      // Technicians see work orders assigned to them (John Smith)
      return allWorkOrders.filter(wo => wo.assignedTo === 'John Smith')
    case 'dispatcher':
      // Dispatchers see unassigned and active work orders
      return allWorkOrders.filter(wo => wo.status !== 'complete')
    case 'manager':
      // Managers see all work orders for reporting
      return allWorkOrders
  }
}

const SEED_EQUIPMENT: Omit<Equipment, '_rev'>[] = [
  {
    _id: 'eq-001',
    type: 'equipment',
    name: 'Rooftop HVAC Unit',
    serialNumber: 'HVAC-2023-001',
    manufacturer: 'Carrier',
    installDate: '2023-01-15',
    lastService: '2023-06-15',
    location: '123 Main St, Building A'
  },
  {
    _id: 'eq-002',
    type: 'equipment',
    name: 'Data Center AC',
    serialNumber: 'AC-DC-2022-045',
    manufacturer: 'Liebert',
    installDate: '2022-03-20',
    lastService: '2023-09-01',
    location: '456 Tech Park, Data Center'
  },
  {
    _id: 'eq-003',
    type: 'equipment',
    name: 'Backup Generator',
    serialNumber: 'GEN-2021-012',
    manufacturer: 'Caterpillar',
    installDate: '2021-08-10',
    lastService: '2023-08-10',
    location: '789 Industrial Ave'
  },
  {
    _id: 'eq-004',
    type: 'equipment',
    name: 'Passenger Elevator',
    serialNumber: 'ELEV-2019-003',
    manufacturer: 'Otis',
    installDate: '2019-02-28',
    lastService: '2023-07-15',
    location: '321 Commerce Blvd, Tower B'
  }
]

// Initialize with seed data
export async function initializeDB() {
  const persona = getPersonaFromPath()
  console.log(`Initializing database for persona: ${persona}`)

  try {
    const db = getWorkOrdersDB()
    const existingWorkOrders = await db.allDocs()

    if (existingWorkOrders.rows.length === 0) {
      const seedData = getSeedWorkOrders()
      for (const wo of seedData) {
        await db.put(wo)
      }
      console.log(`Seeded ${seedData.length} work orders for ${persona}`)
    }

    const eqDb = getEquipmentDB()
    const existingEquipment = await eqDb.allDocs()
    if (existingEquipment.rows.length === 0) {
      for (const eq of SEED_EQUIPMENT) {
        await eqDb.put(eq)
      }
      console.log('Seeded equipment')
    }
  } catch (error) {
    console.error('Error initializing DB:', error)
  }
}

// Work Order Operations
export async function getWorkOrders(): Promise<WorkOrder[]> {
  const db = getWorkOrdersDB()
  const result = await db.allDocs({ include_docs: true })
  return result.rows
    .map((row: { doc?: WorkOrder }) => row.doc!)
    .filter((doc: WorkOrder) => doc && doc.type === 'work-order')
}

export async function getWorkOrder(id: string): Promise<WorkOrder | null> {
  try {
    const db = getWorkOrdersDB()
    return await db.get(id) as WorkOrder
  } catch {
    return null
  }
}

export async function saveWorkOrder(workOrder: WorkOrder): Promise<WorkOrder> {
  workOrder.updatedAt = new Date().toISOString()
  const db = getWorkOrdersDB()
  const response = await db.put(workOrder)
  return { ...workOrder, _rev: response.rev }
}

export async function updateWorkOrder(workOrder: WorkOrder): Promise<WorkOrder> {
  return saveWorkOrder(workOrder)
}

export async function createWorkOrder(data: Omit<WorkOrder, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>): Promise<WorkOrder> {
  const now = new Date().toISOString()
  const id = `wo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const workOrder: WorkOrder = {
    _id: id,
    type: 'work-order',
    ...data,
    checklist: data.checklist || {
      inspect: false,
      diagnose: false,
      repair: false,
      test: false,
      cleanup: false
    },
    notes: data.notes || [],
    createdAt: now,
    updatedAt: now
  }

  const db = getWorkOrdersDB()
  const response = await db.put(workOrder)
  return { ...workOrder, _rev: response.rev }
}

// Equipment Operations
export async function getEquipment(): Promise<Equipment[]> {
  const db = getEquipmentDB()
  const result = await db.allDocs({ include_docs: true })
  return result.rows
    .map((row: { doc?: Equipment }) => row.doc!)
    .filter((doc: Equipment) => doc && doc.type === 'equipment')
}

export async function getEquipmentBySerial(serialNumber: string): Promise<Equipment | null> {
  const all = await getEquipment()
  return all.find(eq => eq.serialNumber === serialNumber) || null
}

// Sync Functions
function setupSyncForDB(localDB: PouchDBInstance, remoteUrl: string, dbName: string) {
  console.log(`Setting up sync for ${dbName} to ${remoteUrl}`)

  const sync = localDB.sync(remoteUrl, {
    live: true,
    retry: true
  })

  sync.on('change', (info) => {
    console.log(`Sync change for ${dbName}:`, info)
    currentSyncState = {
      ...currentSyncState,
      lastSync: new Date(),
      error: null
    }
    notifySyncStateChange()
  })

  sync.on('paused', () => {
    console.log(`Sync paused for ${dbName}`)
    currentSyncState = {
      ...currentSyncState,
      isPaused: true
    }
    notifySyncStateChange()
  })

  sync.on('active', () => {
    console.log(`Sync active for ${dbName}`)
    currentSyncState = {
      ...currentSyncState,
      isActive: true,
      isPaused: false,
      error: null
    }
    notifySyncStateChange()
  })

  sync.on('error', (err) => {
    console.error(`Sync error for ${dbName}:`, err)
    currentSyncState = {
      ...currentSyncState,
      error: err?.message || 'Sync error'
    }
    notifySyncStateChange()
  })

  syncHandlers.push(sync)
  return sync
}

export function setupSync(syncUrl: string): void {
  // Cancel existing sync handlers
  stopSync()

  if (!syncUrl) {
    console.log('No sync URL provided, skipping sync setup')
    return
  }

  const { configName, personaId } = parsePathForDB()
  const dbPrefix = configName ? `${configName}-${personaId}` : personaId

  // Set up sync for each database
  const workOrdersRemote = `${syncUrl}/fieldservice-${dbPrefix}-workorders`
  const equipmentRemote = `${syncUrl}/fieldservice-${dbPrefix}-equipment`

  currentSyncState = {
    isActive: true,
    isPaused: false,
    lastSync: null,
    error: null
  }
  notifySyncStateChange()

  setupSyncForDB(getWorkOrdersDB(), workOrdersRemote, 'workorders')
  setupSyncForDB(getEquipmentDB(), equipmentRemote, 'equipment')

  console.log(`Sync started with ${syncUrl}`)
}

export function stopSync(): void {
  syncHandlers.forEach(handler => {
    try {
      handler.cancel()
    } catch (e) {
      console.warn('Error cancelling sync:', e)
    }
  })
  syncHandlers = []

  currentSyncState = {
    isActive: false,
    isPaused: false,
    lastSync: currentSyncState.lastSync,
    error: null
  }
  notifySyncStateChange()

  console.log('Sync stopped')
}

export function isSyncEnabled(): boolean {
  return syncHandlers.length > 0
}
