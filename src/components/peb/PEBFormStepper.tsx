import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface PEBFormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function PEBFormStepper({ steps, currentStep, onStepClick }: PEBFormStepperProps) {
  return (
    <nav aria-label="Progress" className="mb-6">
      <ol className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.id} className={cn('relative', stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : '')}>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                disabled={step.id > currentStep + 1}
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                  step.id < currentStep
                    ? 'bg-primary text-primary-foreground cursor-pointer'
                    : step.id === currentStep
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                    : 'bg-muted text-muted-foreground',
                  step.id <= currentStep + 1 && 'cursor-pointer hover:opacity-80'
                )}
              >
                {step.id < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{step.id}</span>
                )}
              </button>
              {stepIdx !== steps.length - 1 && (
                <div
                  className={cn(
                    'absolute top-4 left-8 -ml-px h-0.5 w-full sm:w-[calc(100%-2rem)]',
                    step.id < currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
            <div className="mt-2 hidden sm:block">
              <span className={cn(
                'text-xs font-medium',
                step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'
              )}>
                {step.title}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export const PEB_FORM_STEPS: Step[] = [
  { id: 1, title: 'Document Info', description: 'Exporter, Buyer & PPJK details' },
  { id: 2, title: 'Transport', description: 'Shipping & destination details' },
  { id: 3, title: 'Goods', description: 'Item declarations' },
  { id: 4, title: 'Documents', description: 'Supporting attachments' },
  { id: 5, title: 'Review', description: 'Review & submit' },
];
