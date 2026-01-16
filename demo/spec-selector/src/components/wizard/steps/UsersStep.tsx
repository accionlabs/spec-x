import { useState } from 'react'
import { Users, Plus, Trash2, Eye, EyeOff, UserCircle } from 'lucide-react'
import type { AuthUser } from '../../../App'

interface UsersStepProps {
  users: AuthUser[]
  onUsersChange: (users: AuthUser[]) => void
  infrastructure: string
  availablePersonas: string[]
}

export default function UsersStep({ users, onUsersChange, infrastructure, availablePersonas }: UsersStepProps) {
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [newUser, setNewUser] = useState<Partial<AuthUser>>({
    email: '',
    name: '',
    password: '',
    persona: 'technician',
    permissions: []
  })

  const isIndividual = infrastructure === 'individual'

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

    onUsersChange([...users, user])

    setNewUser({
      email: '',
      name: '',
      password: '',
      persona: 'technician',
      permissions: []
    })
  }

  const handleRemoveUser = (userId: string) => {
    onUsersChange(users.filter(u => u.id !== userId))
  }

  const handleUserChange = (userId: string, field: keyof AuthUser, value: string) => {
    onUsersChange(
      users.map(u => u.id === userId ? { ...u, [field]: value } : u)
    )
  }

  const togglePasswordVisibility = (userId: string) => {
    setShowPassword(prev => ({ ...prev, [userId]: !prev[userId] }))
  }

  // For individual mode, show a different UI
  if (isIndividual) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
              <UserCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900 mb-2">Single User Mode</h3>
              <p className="text-sm text-green-800">
                In individual mode, you're the only user. No authentication is required -
                the app is tied to your device. Your data stays private and local.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="text-blue-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-blue-800">Want multiple users?</div>
              <div className="text-sm text-blue-700">
                Go back to Team Size and select "Small Team" or higher to enable multi-user
                support with authentication.
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <p className="text-sm text-blue-800">
          Add users who can access your app. Each user needs a password and assigned persona.
          Personas determine what features each user can access.
        </p>
      </div>

      {/* User count */}
      <div className="flex items-center gap-2 text-gray-700">
        <Users className="w-5 h-5 text-blue-600" />
        <span className="font-medium">{users.length} user{users.length !== 1 ? 's' : ''} configured</span>
      </div>

      {/* Existing Users */}
      {users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200"
            >
              <div className="flex-1 grid grid-cols-4 gap-3">
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => handleUserChange(user.id, 'name', e.target.value)}
                  placeholder="Name"
                  className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  value={user.email}
                  onChange={(e) => handleUserChange(user.id, 'email', e.target.value)}
                  placeholder="Email"
                  className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="relative">
                  <input
                    type={showPassword[user.id] ? 'text' : 'password'}
                    value={user.password || ''}
                    onChange={(e) => handleUserChange(user.id, 'password', e.target.value)}
                    placeholder="Password"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {availablePersonas.includes('technician') && <option value="technician">Technician</option>}
                  {availablePersonas.includes('dispatcher') && <option value="dispatcher">Dispatcher</option>}
                  {availablePersonas.includes('manager') && <option value="manager">Manager</option>}
                </select>
              </div>
              <button
                onClick={() => handleRemoveUser(user.id)}
                className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New User */}
      <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
        <div className="text-sm font-medium text-gray-700 mb-3">Add New User</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 grid grid-cols-4 gap-3">
            <input
              type="text"
              value={newUser.name || ''}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="Name"
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <input
              type="email"
              value={newUser.email || ''}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="Email"
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <div className="relative">
              <input
                type={showPassword['new'] ? 'text' : 'password'}
                value={newUser.password || ''}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Password"
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {availablePersonas.includes('technician') && <option value="technician">Technician</option>}
              {availablePersonas.includes('dispatcher') && <option value="dispatcher">Dispatcher</option>}
              {availablePersonas.includes('manager') && <option value="manager">Manager</option>}
            </select>
          </div>
          <button
            onClick={handleAddUser}
            disabled={!newUser.email || !newUser.name}
            className="p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Warning if no users */}
      {users.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="text-amber-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <div className="font-medium text-amber-800">No Users Added</div>
              <div className="text-sm text-amber-700">
                Add at least one user to enable authentication. You can skip this step
                and add users later in edit mode.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
