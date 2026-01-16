import { Check } from 'lucide-react'

interface Step {
  id: string
  title: string
}

interface WizardProgressProps {
  steps: Step[]
  currentStep: number
  completedSteps: Set<number>
  onStepClick: (index: number) => void
  isEditMode?: boolean
}

export default function WizardProgress({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  isEditMode = false
}: WizardProgressProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className={`flex items-center ${isEditMode ? 'justify-start gap-2 min-w-max' : 'justify-center'}`}>
        {/* Edit mode: horizontal scrollable tabs */}
        {isEditMode ? (
          <div className="flex items-center gap-2 pb-1">
            {steps.map((step, index) => {
              const isCurrent = index === currentStep

              return (
                <button
                  key={step.id}
                  onClick={() => onStepClick(index)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
                    ${isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer'
                    }
                  `}
                >
                  {step.title}
                </button>
              )
            })}
          </div>
        ) : (
          /* Wizard mode: numbered circles with connectors */
          <div className="flex items-center">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.has(index)
              const isCurrent = index === currentStep
              const isClickable = isCompleted || isCurrent

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => onStepClick(index)}
                    disabled={!isClickable}
                    className={`
                      w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium
                      transition-all duration-200 flex-shrink-0
                      ${isCompleted
                        ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                        : isCurrent
                          ? 'bg-blue-600 text-white ring-2 sm:ring-4 ring-blue-100'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }
                    `}
                    title={step.title}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </button>

                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`w-4 sm:w-8 h-0.5 mx-0.5 sm:mx-1 ${
                        completedSteps.has(index) ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
