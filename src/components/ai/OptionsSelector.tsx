"use client";

import { ElementOption } from "@/types/ai";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionsSelectorProps {
  options: ElementOption[];
  selectedOptionId: string | null;
  onSelectOption: (optionId: string, optionLabel: string) => void;
  elementLabel?: string;
}

export function OptionsSelector({
  options,
  selectedOptionId,
  onSelectOption,
  elementLabel,
}: OptionsSelectorProps) {
  if (!options || options.length === 0) return null;

  return (
    <div className="space-y-3">
      {elementLabel && (
        <div className="text-sm font-medium text-muted-foreground">
          Select {elementLabel} option:
        </div>
      )}
      <div className="grid gap-3">
        {options.map((option, index) => {
          const isSelected = option.id === selectedOptionId;
          const isDisabled = selectedOptionId !== null && !isSelected;

          return (
            <Card
              key={option.id}
              className={cn(
                "p-4 cursor-pointer transition-all duration-200 relative",
                "hover:shadow-md border-2",
                isSelected && "border-primary bg-primary/5 shadow-md",
                !isSelected && !isDisabled && "border-border hover:border-primary/50",
                isDisabled && "opacity-40 cursor-not-allowed border-border"
              )}
              onClick={() => {
                if (!isDisabled) {
                  onSelectOption(option.id, option.label);
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border"
                  )}
                >
                  {isSelected ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* <div
                    className={cn(
                      "font-semibold text-sm mb-2",
                      isSelected && "text-primary"
                    )}
                  >
                    {option.label}
                  </div> */}
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {option.value}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

