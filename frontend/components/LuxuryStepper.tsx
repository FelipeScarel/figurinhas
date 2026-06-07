"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface LuxuryStepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export default function LuxuryStepper({
  steps,
  currentStep,
  className,
}: LuxuryStepperProps) {
  return (
    <div className={cn("flex items-center justify-center gap-0", className)}>
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;
        const isLast = i === steps.length - 1;

        return (
          <div key={step.label} className="flex items-center">
            {/* Step Circle + Label */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                    isCompleted &&
                      "bg-gold-500 border-gold-500 text-graphite-900 shadow-lg shadow-gold-500/20",
                    isCurrent &&
                      "bg-gold-500/10 border-gold-500 text-gold-400 shadow-lg shadow-gold-500/10",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-graphite-800 border-graphite-700 text-graphite-500"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  "mt-2 text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors duration-500",
                  isCurrent && "text-gold-400",
                  isCompleted && "text-graphite-400",
                  !isCompleted && !isCurrent && "text-graphite-600"
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="text-[9px] text-graphite-600 mt-0.5">
                  {step.description}
                </span>
              )}
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 mx-3 sm:mx-5 mt-[-20px]">
                <div
                  className={cn(
                    "h-[1px] w-10 sm:w-16 lg:w-24 transition-all duration-500",
                    isCompleted ? "bg-gold-500/50" : "bg-graphite-800"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
