'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CheckCircle, Circle, Clock } from 'lucide-react'

interface Step {
  id: string
  title: string
  description: string
  status: 'completed' | 'current' | 'pending'
}

interface ProgressStepsProps {
  steps: Step[]
  className?: string
}

export function ProgressSteps({ steps, className }: ProgressStepsProps) {
  return (
    <Card className={cn('card-editorial', className)}>
      <CardContent className="p-6">
        <nav aria-label="Progress">
          <ol role="list" className="space-y-6">
            {steps.map((step, stepIdx) => (
              <li key={step.id}>
                <div className="flex items-start">
                  {/* 단계 아이콘 */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative">
                    {step.status === 'completed' && (
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-primary-foreground" />
                      </div>
                    )}
                    {step.status === 'current' && (
                      <div className="w-10 h-10 border-2 border-primary bg-background rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                      </div>
                    )}
                    {step.status === 'pending' && (
                      <div className="w-10 h-10 border-2 border-muted bg-background rounded-full flex items-center justify-center">
                        <Circle className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* 연결선 */}
                    {stepIdx !== steps.length - 1 && (
                      <div
                        className={cn(
                          'absolute top-10 left-1/2 -ml-px w-0.5 h-6',
                          step.status === 'completed'
                            ? 'bg-primary'
                            : 'bg-muted'
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </div>

                  {/* 단계 내용 */}
                  <div className="ml-6 min-w-0 flex-1">
                    <h3
                      className={cn(
                        'text-lg font-semibold leading-6',
                        step.status === 'completed' && 'text-primary',
                        step.status === 'current' && 'text-foreground',
                        step.status === 'pending' && 'text-muted-foreground'
                      )}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={cn(
                        'mt-1 text-sm',
                        step.status === 'current' && 'text-foreground',
                        step.status !== 'current' && 'text-muted-foreground'
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </CardContent>
    </Card>
  )
}

interface SimpleProgressProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  className?: string
}

export function SimpleProgress({ currentStep, totalSteps, stepLabels, className }: SimpleProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <Card className={cn('card-editorial', className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 진행률 표시 */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              진행률
            </span>
            <span className="text-sm text-muted-foreground">
              {currentStep}/{totalSteps} 단계
            </span>
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 단계 라벨들 */}
          <div className="flex justify-between text-xs text-muted-foreground">
            {stepLabels.map((label, index) => (
              <span
                key={index}
                className={cn(
                  'transition-colors',
                  index < currentStep && 'text-primary font-medium',
                  index === currentStep - 1 && 'text-foreground font-semibold'
                )}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProgressSteps