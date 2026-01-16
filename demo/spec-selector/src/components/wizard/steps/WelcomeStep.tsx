import { Wrench, Users, Building2, Sparkles } from 'lucide-react'

const USE_CASES = [
  {
    icon: Wrench,
    title: 'Solo Technician',
    description: 'Work offline, manage your own jobs, track equipment - all from your phone.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Users,
    title: 'Small Team',
    description: 'Dispatcher assigns work, technicians complete jobs, everyone stays in sync.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: Building2,
    title: 'Department',
    description: 'Full hierarchy with managers, reports, performance tracking and oversight.',
    color: 'bg-purple-100 text-purple-600',
  },
]

export default function WelcomeStep() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
          <Sparkles className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Build Your Field Service App
        </h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Configure a custom field service application in minutes. Choose your team size,
          select features, customize your workflow, and generate a ready-to-use app.
        </p>
      </div>

      {/* Use cases */}
      <div className="grid md:grid-cols-3 gap-4">
        {USE_CASES.map((useCase) => (
          <div
            key={useCase.title}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className={`w-12 h-12 rounded-xl ${useCase.color} flex items-center justify-center mb-4`}>
              <useCase.icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{useCase.title}</h3>
            <p className="text-sm text-gray-500">{useCase.description}</p>
          </div>
        ))}
      </div>

      {/* Features list */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-semibold text-gray-900 mb-4">What you'll configure:</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'Team size & available personas',
            'Work order features & capabilities',
            'Custom data fields',
            'Workflow states & transitions',
            'Sync server & deployment',
            'User accounts & permissions',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <p className="text-center text-sm text-gray-500">
        Click <strong>"Get Started"</strong> below to begin configuring your app.
      </p>
    </div>
  )
}
