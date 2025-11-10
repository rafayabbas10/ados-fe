"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp,
  Loader2
} from "lucide-react";

interface AnalysisStep {
  id: number;
  label: string;
  status: 'processing initiated' | 'ad analysis complete' | 'ad blocks created' | 'summary created' | 'complete';
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: 1, label: 'Processing Initiated', status: 'processing initiated' },
  { id: 2, label: 'Ad Analysis Complete', status: 'ad analysis complete' },
  { id: 3, label: 'Ad Blocks Created', status: 'ad blocks created' },
  { id: 4, label: 'Summary Created', status: 'summary created' },
  { id: 5, label: 'Complete', status: 'complete' },
];

interface AnalysisProgressStepperProps {
  currentStatus: 'processing initiated' | 'ad analysis complete' | 'ad blocks created' | 'summary created' | 'complete';
  reportId?: number;
  createdAt?: string;
}

export function AnalysisProgressStepper({ currentStatus, reportId, createdAt }: AnalysisProgressStepperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const currentStepIndex = ANALYSIS_STEPS.findIndex(step => step.status === currentStatus);
  const isComplete = currentStatus === 'complete';

  const getStepStatus = (stepIndex: number): 'complete' | 'current' | 'pending' => {
    if (stepIndex < currentStepIndex) return 'complete';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isComplete && isCollapsed) {
    return (
      <Card className="shadow-card border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">Analysis Complete</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All analysis stages completed successfully
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(false)}
              className="text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-card ${
      isComplete 
        ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20' 
        : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20'
    }`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              isComplete 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {isComplete ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
              )}
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${
                isComplete 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-blue-900 dark:text-blue-100'
              }`}>
                {isComplete ? 'Analysis Complete' : 'Analysis in Progress'}
              </h3>
              {reportId && createdAt && (
                <p className={`text-sm ${
                  isComplete 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-blue-700 dark:text-blue-300'
                }`}>
                  Report #{reportId} • Started {formatDate(createdAt)}
                </p>
              )}
            </div>
          </div>
          
          {isComplete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Progress Stepper */}
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" style={{ zIndex: 0 }} />
          <div 
            className={`absolute top-5 left-0 h-0.5 transition-all duration-500 ${
              isComplete ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ 
              width: `${(currentStepIndex / (ANALYSIS_STEPS.length - 1)) * 100}%`,
              zIndex: 1
            }} 
          />

          {/* Steps */}
          <div className="relative flex justify-between" style={{ zIndex: 2 }}>
            {ANALYSIS_STEPS.map((step, index) => {
              const status = getStepStatus(index);
              
              return (
                <div key={step.id} className="flex flex-col items-center" style={{ flex: 1 }}>
                  {/* Step Circle */}
                  <div className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300
                    ${status === 'complete' 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : status === 'current'
                      ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                    }
                  `}>
                    {status === 'complete' ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : status === 'current' ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-2 text-center max-w-[120px]">
                    <p className={`text-xs font-medium transition-colors ${
                      status === 'complete' 
                        ? 'text-green-700 dark:text-green-400' 
                        : status === 'current'
                        ? 'text-blue-700 dark:text-blue-400 font-semibold'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    {status === 'current' && (
                      <Badge 
                        variant="outline" 
                        className="mt-1 text-[10px] border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400"
                      >
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Message */}
        {!isComplete && (
          <div className="mt-6 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
              <span className="font-medium">Current Stage:</span> {ANALYSIS_STEPS[currentStepIndex].label}
              {currentStepIndex < ANALYSIS_STEPS.length - 1 && (
                <> • <span className="text-blue-600 dark:text-blue-300">Next: {ANALYSIS_STEPS[currentStepIndex + 1].label}</span></>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

