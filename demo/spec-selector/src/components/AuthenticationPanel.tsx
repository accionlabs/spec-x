import { useState } from 'react'
import { Shield, Check, Lock, Mail, Key, Users, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import type { SpecState, AuthUser, AuthTier } from '../App'

interface AuthenticationPanelProps {
  ontology: {
    authentication: {
      tiers: Array<{
        id: string
        name: string
        description: string
        price: number
        features: string[]
        available: boolean
      }>
      addons: Array<{
        id: string
        name: string
        description: string
        price: number
        available: boolean
      }>
    }
  }
  spec: SpecState
  onSpecChange: (spec: SpecState) => void
}

const TIER_ICONS: Record<string, React.ReactNode> = {
  basic: <Lock className="w-5 h-5" />,
  'pin-device': <Key className="w-5 h-5" />,
  'magic-link': <Mail className="w-5 h-5" />,
  oidc: <Shield className="w-5 h-5" />
}

export default function AuthenticationPanel({ ontology, spec, onSpecChange }: AuthenticationPanelProps) {
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [newUser, setNewUser] = useState<Partial<AuthUser>>({
    email: '',
    name: '',
    password: '',
    persona: 'technician',
    permissions: []
  })

  const handleTierChange = (tierId: AuthTier) => {
    onSpecChange({
      ...spec,
      authentication: {
        ...spec.authentication,
        tier: tierId
      }
    })
  }

  const handleAddonToggle = (addonId: string) => {
    const field = addonId === 'mfa' ? 'mfaEnabled'
      : addonId === 'user-management' ? 'userManagementEnabled'
      : 'auditLoggingEnabled'

    onSpecChange({
      ...spec,
      authentication: {
        ...spec.authentication,
        [field]: !spec.authentication[field as keyof typeof spec.authentication]
      }
    })
  }

  const handleAddUser = () => {
    if (!newUser.email || !newUser.name) return

    const user: AuthUser = {
      id: `user-${Date.now()}`,
      email: newUser.email,
      name: newUser.name,
      password: newUser.password,
      persona: newUser.persona as 'technician' | 'dispatcher' | 'manager',
      permissions: []
    }

    onSpecChange({
      ...spec,
      users: [...spec.users, user]
    })

    setNewUser({
      email: '',
      name: '',
      password: '',
      persona: 'technician',
      permissions: []
    })
  }

  const handleRemoveUser = (userId: string) => {
    onSpecChange({
      ...spec,
      users: spec.users.filter(u => u.id !== userId)
    })
  }

  const handleUserChange = (userId: string, field: keyof AuthUser, value: string) => {
    onSpecChange({
      ...spec,
      users: spec.users.map(u =>
        u.id === userId ? { ...u, [field]: value } : u
      )
    })
  }

  const togglePasswordVisibility = (userId: string) => {
    setShowPassword(prev => ({ ...prev, [userId]: !prev[userId] }))
  }

  return (
    <div className="space-y-8">
      {/* Authentication Tiers */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Authentication Method
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {ontology.authentication.tiers.map((tier) => {
            const isSelected = spec.authentication.tier === tier.id
            const isAvailable = tier.available

            return (
              <button
                key={tier.id}
                onClick={() => isAvailable && handleTierChange(tier.id as AuthTier)}
                disabled={!isAvailable}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : isAvailable
                    ? 'border-gray-200 hover:border-gray-300 bg-white'
                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {!isAvailable && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 bg-gray-200 rounded text-xs font-medium text-gray-500">
                    Coming Soon
                  </div>
                )}

                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {TIER_ICONS[tier.id] || <Shield className="w-5 h-5" />}
                </div>

                <div className="flex items-baseline gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                  <span className={`text-sm font-medium ${
                    tier.price === 0 ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {tier.price === 0 ? 'Free' : `$${tier.price}/mo`}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-3">{tier.description}</p>

                <div className="flex flex-wrap gap-1">
                  {tier.features.map(feature => (
                    <span
                      key={feature}
                      className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                    >
                      {feature.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Add-ons */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Add-ons</h3>
        <div className="space-y-3">
          {ontology.authentication.addons.map((addon) => {
            const isEnabled = addon.id === 'mfa'
              ? spec.authentication.mfaEnabled
              : addon.id === 'user-management'
              ? spec.authentication.userManagementEnabled
              : spec.authentication.auditLoggingEnabled
            const isAvailable = addon.available

            return (
              <div
                key={addon.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  isEnabled ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                } ${!isAvailable ? 'opacity-60' : ''}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{addon.name}</h4>
                    <span className="text-sm text-blue-600 font-medium">+${addon.price}/mo</span>
                    {!isAvailable && (
                      <span className="px-2 py-0.5 bg-gray-200 rounded text-xs font-medium text-gray-500">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{addon.description}</p>
                </div>
                <button
                  onClick={() => isAvailable && handleAddonToggle(addon.id)}
                  disabled={!isAvailable}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    isEnabled ? 'bg-blue-500' : 'bg-gray-300'
                  } ${!isAvailable ? 'cursor-not-allowed' : ''}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                    isEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* User Management */}
      {spec.authentication.tier === 'basic' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Users ({spec.users.length})
          </h3>

          <p className="text-sm text-gray-500 mb-4">
            Add users who can access this deployment. Passwords are hashed before saving.
          </p>

          {/* Existing Users */}
          {spec.users.length > 0 && (
            <div className="space-y-3 mb-6">
              {spec.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1 grid grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => handleUserChange(user.id, 'name', e.target.value)}
                      placeholder="Name"
                      className="px-3 py-2 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      value={user.email}
                      onChange={(e) => handleUserChange(user.id, 'email', e.target.value)}
                      placeholder="Email"
                      className="px-3 py-2 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="relative">
                      <input
                        type={showPassword[user.id] ? 'text' : 'password'}
                        value={user.password || ''}
                        onChange={(e) => handleUserChange(user.id, 'password', e.target.value)}
                        placeholder="Password"
                        className="w-full px-3 py-2 pr-10 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword[user.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <select
                      value={user.persona}
                      onChange={(e) => handleUserChange(user.id, 'persona', e.target.value)}
                      className="px-3 py-2 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="technician">Technician</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(user.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New User */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-dashed border-gray-300">
            <div className="flex-1 grid grid-cols-4 gap-3">
              <input
                type="text"
                value={newUser.name || ''}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Name"
                className="px-3 py-2 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                value={newUser.email || ''}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="Email"
                className="px-3 py-2 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="relative">
                <input
                  type={showPassword['new'] ? 'text' : 'password'}
                  value={newUser.password || ''}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Password"
                  className="w-full px-3 py-2 pr-10 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword['new'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <select
                value={newUser.persona || 'technician'}
                onChange={(e) => setNewUser({ ...newUser, persona: e.target.value as 'technician' | 'dispatcher' | 'manager' })}
                className="px-3 py-2 rounded border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="technician">Technician</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <button
              onClick={handleAddUser}
              disabled={!newUser.email || !newUser.name}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {spec.users.length === 0 && (
            <p className="text-sm text-amber-600 mt-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Add at least one user to enable authentication for this deployment.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
