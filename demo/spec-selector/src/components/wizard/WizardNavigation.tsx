import { ArrowLeft, ArrowRight, SkipForward } from 'lucide-react'

interface WizardNavigationProps {
  onBack: () => void
  onNext: () => void
  onSkip?: () => void
  showBack: boolean
  nextLabel: string
  canProceed: boolean
}

export default function WizardNavigation({
  onBack,
  onNext,
  onSkip,
  showBack,
  nextLabel,
  canProceed
}: WizardNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Back button */}
      <div>
        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
      </div>

      {/* Right side buttons */}
      <div className="flex items-center gap-3">
        {/* Skip button */}
        {onSkip && (
          <button
            onClick={onSkip}
            className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Skip
            <SkipForward className="w-4 h-4" />
          </button>
        )}

        {/* Next/Continue/Generate button */}
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`
            flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all
            ${canProceed
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {nextLabel}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
