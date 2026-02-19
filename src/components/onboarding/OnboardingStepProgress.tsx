import { Progress } from '../ui/progress';

interface OnboardingStepProgressProps {
  currentStep: number;
  totalSteps?: number;
  heading?: string;
}

export default function OnboardingStepProgress({
  currentStep,
  totalSteps = 13,
  heading = 'Onboarding progress',
}: OnboardingStepProgressProps) {
  const safeTotal = Math.max(1, totalSteps);
  const safeStep = Math.min(Math.max(1, currentStep), safeTotal);
  const progressPercentage = Math.round((safeStep / safeTotal) * 100);

  return (
    <section className="px-4 pb-3 sm:px-6 sm:pb-4" aria-label="Onboarding step progress">
      <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 p-2.5 shadow-[0_8px_18px_rgba(43,140,238,0.1)] sm:p-3.5">
        <div className="pointer-events-none absolute -right-6 -top-8 h-16 w-16 rounded-full bg-[#2b8cee]/14 blur-2xl" />
        <div className="pointer-events-none absolute -left-8 -bottom-10 h-14 w-14 rounded-full bg-cyan-300/14 blur-2xl" />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
            <p className="min-w-0 flex-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:text-[10px]">
              {heading}
            </p>
            <span className="shrink-0 rounded-full border border-[#2b8cee]/20 bg-[#2b8cee]/10 px-2 py-0.5 text-[9px] font-bold text-[#1f6cc7] sm:text-[10px]">
              {progressPercentage}% complete
            </span>
          </div>

          <Progress
            value={progressPercentage}
            className="mt-2 h-1.5 bg-slate-100 ring-1 ring-[#2b8cee]/10 sm:h-2"
            indicatorClassName="bg-gradient-to-r from-[#2b8cee] via-[#3a9dff] to-cyan-400"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercentage}
            aria-label={`${progressPercentage} percent complete`}
          />

          <div className="mt-2 flex items-center gap-0.5 sm:gap-1" aria-hidden="true">
            {Array.from({ length: safeTotal }, (_, index) => {
              const stepNumber = index + 1;
              const isComplete = stepNumber <= safeStep;

              return (
                <span
                  key={stepNumber}
                  className={`h-[3px] flex-1 rounded-full transition-all duration-300 sm:h-1 ${
                    isComplete ? 'bg-[#2b8cee]' : 'bg-slate-200/90'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
