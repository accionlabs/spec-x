import { useState, useEffect, ReactNode } from 'react'
import { ExternalLink, Receipt, X } from 'lucide-react'
import WizardProgress from './WizardProgress'
import WizardNavigation from './WizardNavigation'
import SpecPreview from '../SpecPreview'
import type { SpecState } from '../../App'

export interface WizardStep {
  id: string
  title: string
  subtitle: string
  component: ReactNode
  isOptional?: boolean
  canSkip?: boolean
  validate?: () => boolean
  // Hide this step in edit mode (e.g., welcome, review)
  hideInEditMode?: boolean
}

interface Ontology {
  personas: any[]
  pricing: any
  dataModel: { entities: any[] }
  workflows: Record<string, any>
  authentication: { tiers: any[]; addons: any[] }
}

interface WizardContainerProps {
  steps: WizardStep[]
  onComplete: () => void
  onStepChange?: (stepIndex: number) => void
  spec: SpecState
  ontology: Ontology
  // Edit mode props
  isEditMode?: boolean
  configName?: string
  onLaunchApp?: () => void
  onStartOver?: () => void
  initialStep?: number
}

export default function WizardContainer({
  steps,
  onComplete,
  onStepChange,
  spec,
  ontology,
  isEditMode = false,
  configName,
  onLaunchApp,
  onStartOver,
  initialStep = 0
}: WizardContainerProps) {
  // In edit mode, filter out steps marked as hideInEditMode
  const visibleSteps = isEditMode
    ? steps.filter(s => !s.hideInEditMode)
    : steps

  const [currentStep, setCurrentStep] = useState(initialStep)
  // In edit mode, all steps are considered "completed" for navigation purposes
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    isEditMode ? new Set(visibleSteps.map((_, i) => i)) : new Set()
  )
  // Mobile BOM sheet state
  const [showMobileBOM, setShowMobileBOM] = useState(false)

  // Update completed steps when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      setCompletedSteps(new Set(visibleSteps.map((_, i) => i)))
    }
  }, [isEditMode, visibleSteps.length])

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === visibleSteps.length - 1
  const currentStepConfig = visibleSteps[currentStep]

  const canProceed = () => {
    if (currentStepConfig?.validate) {
      return currentStepConfig.validate()
    }
    return true
  }

  const handleNext = () => {
    if (!canProceed()) return

    setCompletedSteps(prev => new Set([...prev, currentStep]))

    if (isLastStep) {
      onComplete()
    } else {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      onStepChange?.(nextStep)
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      onStepChange?.(prevStep)
    }
  }

  const handleSkip = () => {
    if (currentStepConfig?.canSkip && !isLastStep) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      onStepChange?.(nextStep)
    }
  }

  const handleStepClick = (stepIndex: number) => {
    // In edit mode, all steps are accessible
    // In wizard mode, only completed steps or current step
    if (isEditMode || completedSteps.has(stepIndex) || stepIndex === currentStep) {
      setCurrentStep(stepIndex)
      onStepChange?.(stepIndex)
    }
  }

  const getNextLabel = () => {
    if (isEditMode) {
      if (isLastStep) return 'Save Changes'
      return 'Next'
    }
    if (currentStep === 0) return 'Get Started'
    if (isLastStep) return 'Generate App'
    return 'Continue'
  }

  if (!currentStepConfig) {
    return null
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Fixed Header Area */}
      <div className="flex-shrink-0">
        {/* Edit mode header with config name and actions */}
        {isEditMode && configName && (
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div>
              <h1 className="font-bold text-gray-900">{configName}</h1>
              <p className="text-sm text-gray-500">Edit Configuration</p>
            </div>
            <div className="flex items-center gap-3">
              {onStartOver && (
                <button
                  onClick={onStartOver}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                >
                  Start Over
                </button>
              )}
              {onLaunchApp && (
                <button
                  onClick={onLaunchApp}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Launch App
                </button>
              )}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <WizardProgress
            steps={visibleSteps.map(s => ({ id: s.id, title: s.title }))}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
            isEditMode={isEditMode}
          />
        </div>
      </div>

      {/* Scrollable Middle Area with Sidebar */}
      <div className="flex-1 flex overflow-hidden bg-gray-50">
        {/* Left side: step content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Step header - fixed within content area */}
          <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-4 sm:py-6">
            <div className="max-w-3xl">
              <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">
                {isEditMode ? currentStepConfig.title : `Step ${currentStep + 1} of ${visibleSteps.length}`}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {isEditMode ? currentStepConfig.subtitle : currentStepConfig.title}
              </h1>
              {!isEditMode && (
                <p className="text-sm sm:text-base text-gray-500 mt-1">
                  {currentStepConfig.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Step content - scrollable */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-8">
            <div className="max-w-3xl">
              {currentStepConfig.component}
            </div>
          </div>
        </div>

        {/* Right side: Bill of Materials sidebar - hidden on mobile/tablet */}
        <div className="w-80 xl:w-96 border-l border-gray-200 bg-gray-50 overflow-y-auto p-4 xl:p-6 hidden lg:block flex-shrink-0">
          <SpecPreview spec={spec} ontology={ontology} />
        </div>
      </div>

      {/* Fixed Footer Area */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-3xl">
          <WizardNavigation
            onBack={handleBack}
            onNext={handleNext}
            onSkip={currentStepConfig.canSkip ? handleSkip : undefined}
            showBack={!isFirstStep}
            nextLabel={getNextLabel()}
            canProceed={canProceed()}
          />
        </div>
      </div>

      {/* Mobile BOM Floating Button - only visible on mobile/tablet */}
      <button
        onClick={() => setShowMobileBOM(true)}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-40"
        aria-label="View Bill of Materials"
      >
        <Receipt className="w-6 h-6" />
      </button>

      {/* Mobile BOM Sheet */}
      {showMobileBOM && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileBOM(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Bill of Materials</h2>
              <button
                onClick={() => setShowMobileBOM(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <SpecPreview spec={spec} ontology={ontology} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
