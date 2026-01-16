import { Receipt } from 'lucide-react'
import type { SpecState } from '../App'

interface Scenario {
  id: string
  name: string
  price: number
  included?: boolean
}

interface Outcome {
  id: string
  name: string
  scenarios: Scenario[]
}

interface Persona {
  id: string
  name: string
  basePrice: number
  outcomes: Outcome[]
}

interface PricingConfig {
  currency: string
  period: string
  base: {
    amount: number
    description: string
    includes: string[]
  }
  perUser: { amount: number; description: string }
  customField: { amount: number; description: string }
  customWorkflowState: { amount: number; description: string }
  additionalLanguage: { amount: number; description: string }
}

interface AuthTier {
  id: string
  name: string
  price: number
  available: boolean
}

interface AuthAddon {
  id: string
  name: string
  price: number
  available: boolean
}

interface Ontology {
  personas: Persona[]
  pricing: PricingConfig
  dataModel: {
    entities: { id: string; name: string }[]
  }
  workflows: Record<string, { id: string; name: string }>
  authentication: {
    tiers: AuthTier[]
    addons: AuthAddon[]
  }
}

interface SpecPreviewProps {
  spec: SpecState
  ontology: Ontology
}

interface LineItem {
  description: string
  qty: number
  unitPrice: number
  total: number
  included?: boolean
}

export default function SpecPreview({ spec, ontology }: SpecPreviewProps) {
  const { pricing } = ontology

  // Build line items
  const lineItems: LineItem[] = []

  // 1. Platform base
  lineItems.push({
    description: 'Platform Base',
    qty: 1,
    unitPrice: pricing.base.amount,
    total: pricing.base.amount
  })

  // 2. Persona modules
  ontology.personas.forEach(persona => {
    const hasSelectedScenarios = persona.outcomes.some(o =>
      o.scenarios.some(s => spec.selectedScenarios.has(s.id))
    )
    if (hasSelectedScenarios && persona.basePrice > 0) {
      lineItems.push({
        description: `${persona.name} Module`,
        qty: 1,
        unitPrice: persona.basePrice,
        total: persona.basePrice
      })
    }
  })

  // 3. Add-on features (non-included scenarios with price)
  const paidFeatures = ontology.personas.flatMap(p =>
    p.outcomes.flatMap(o =>
      o.scenarios.filter(s => spec.selectedScenarios.has(s.id) && !s.included && s.price > 0)
    )
  )
  paidFeatures.forEach(feature => {
    lineItems.push({
      description: feature.name,
      qty: 1,
      unitPrice: feature.price,
      total: feature.price
    })
  })

  // 4. Custom fields
  const customFieldCount = Object.values(spec.customFields).flat().length
  if (customFieldCount > 0) {
    lineItems.push({
      description: 'Custom Data Fields',
      qty: customFieldCount,
      unitPrice: pricing.customField.amount,
      total: customFieldCount * pricing.customField.amount
    })
  }

  // 5. Custom workflow states
  const customStateCount = spec.customWorkflowStates.length
  if (customStateCount > 0) {
    lineItems.push({
      description: 'Custom Workflow States',
      qty: customStateCount,
      unitPrice: pricing.customWorkflowState.amount,
      total: customStateCount * pricing.customWorkflowState.amount
    })
  }

  // 6. Additional languages
  const additionalLanguages = Math.max(0, spec.constraints.languages.length - 1)
  if (additionalLanguages > 0) {
    lineItems.push({
      description: 'Additional Languages',
      qty: additionalLanguages,
      unitPrice: pricing.additionalLanguage.amount,
      total: additionalLanguages * pricing.additionalLanguage.amount
    })
  }

  // 7. Authentication tier (always show as line item)
  const authTier = ontology.authentication?.tiers.find(t => t.id === spec.authentication?.tier)
  if (authTier) {
    lineItems.push({
      description: authTier.name,
      qty: 1,
      unitPrice: authTier.price,
      total: authTier.price
    })
  }

  // 8. Authentication add-ons
  if (spec.authentication?.mfaEnabled) {
    const mfaAddon = ontology.authentication?.addons.find(a => a.id === 'mfa')
    if (mfaAddon) {
      lineItems.push({
        description: mfaAddon.name,
        qty: 1,
        unitPrice: mfaAddon.price,
        total: mfaAddon.price
      })
    }
  }

  if (spec.authentication?.userManagementEnabled) {
    const umAddon = ontology.authentication?.addons.find(a => a.id === 'user-management')
    if (umAddon) {
      lineItems.push({
        description: umAddon.name,
        qty: 1,
        unitPrice: umAddon.price,
        total: umAddon.price
      })
    }
  }

  if (spec.authentication?.auditLoggingEnabled) {
    const alAddon = ontology.authentication?.addons.find(a => a.id === 'audit-logging')
    if (alAddon) {
      lineItems.push({
        description: alAddon.name,
        qty: 1,
        unitPrice: alAddon.price,
        total: alAddon.price
      })
    }
  }

  // Calculate total
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)

  // Count included features for display
  const includedFeatures = ontology.personas.flatMap(p =>
    p.outcomes.flatMap(o =>
      o.scenarios.filter(s => spec.selectedScenarios.has(s.id) && s.included)
    )
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-900">Bill of Materials</span>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="divide-y divide-gray-100">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50">
          <div className="col-span-6">Item</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Unit</div>
          <div className="col-span-2 text-right">Total</div>
        </div>

        {/* Line Items */}
        {lineItems.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-sm hover:bg-gray-50">
            <div className="col-span-6 text-gray-800">{item.description}</div>
            <div className="col-span-2 text-right text-gray-600">{item.qty}</div>
            <div className="col-span-2 text-right text-gray-600">${item.unitPrice}</div>
            <div className="col-span-2 text-right font-medium text-gray-900">${item.total}</div>
          </div>
        ))}

        {/* Included Features (shown as $0 items) */}
        {includedFeatures.length > 0 && (
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-sm bg-green-50/50">
            <div className="col-span-6 text-gray-600">
              Included Features
              <span className="text-xs text-gray-400 ml-1">({includedFeatures.length} items)</span>
            </div>
            <div className="col-span-2 text-right text-gray-400">—</div>
            <div className="col-span-2 text-right text-gray-400">—</div>
            <div className="col-span-2 text-right text-green-600 font-medium">$0</div>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="border-t-2 border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="grid grid-cols-12 gap-2 px-4 py-3">
          <div className="col-span-8 text-right text-sm font-medium text-gray-600">Monthly Subtotal</div>
          <div className="col-span-4 text-right text-lg font-bold text-gray-900">${subtotal}/mo</div>
        </div>
        <div className="grid grid-cols-12 gap-2 px-4 pb-3">
          <div className="col-span-8 text-right text-xs text-gray-500">Per active user</div>
          <div className="col-span-4 text-right text-sm text-gray-600">+${pricing.perUser.amount}/user</div>
        </div>
      </div>
    </div>
  )
}
