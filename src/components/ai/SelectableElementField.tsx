"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useAIAgent } from '@/contexts/AIAgentContext';
import { ElementKey } from '@/types/ai';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Sparkles, Check, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectableElementFieldProps {
  elementKey: ElementKey;
  label: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  disabled?: boolean;
  placeholder?: string;
}

export const SelectableElementField = React.memo(function SelectableElementField({
  elementKey,
  label,
  subtitle,
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder,
}: SelectableElementFieldProps) {
  const { 
    selectedElement, 
    selectElement, 
    loadingTargets,
    recentlyUpdatedElement,
  } = useAIAgent();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isSelected = selectedElement === elementKey;
  const isLoading = loadingTargets.has(`element-${elementKey}`);
  const wasRecentlyUpdated = recentlyUpdatedElement === elementKey;
  
  // Auto-resize textarea (only when editing)
  useEffect(() => {
    if (isEditing) {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 200); // Max 200px
        textarea.style.height = newHeight + 'px';
      }
    }
  }, [value, isEditing]);
  
  // Update filtered options when options prop changes
  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);
  
  const handleCardClick = useCallback(() => {
    if (!isLoading && !disabled) {
      selectElement(isSelected ? null : elementKey, label);
    }
  }, [isLoading, disabled, selectElement, isSelected, elementKey, label]);
  
  const handleAskAI = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoading && !disabled) {
      selectElement(elementKey, label);
      // Focus the chat input after a short delay
      setTimeout(() => {
        const chatInput = document.querySelector('textarea[placeholder*="Ask about"]') as HTMLTextAreaElement;
        chatInput?.focus();
      }, 100);
    }
  }, [isLoading, disabled, selectElement, elementKey, label]);
  
  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoading && !disabled) {
      setIsEditing(true);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [isLoading, disabled]);
  
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Filter options based on input
    const filtered = options.filter(option =>
      option.toLowerCase().includes(newValue.toLowerCase())
    );
    setFilteredOptions(filtered);
    setShowDropdown(filtered.length > 0 && newValue.length > 0);
  }, [onChange, options]);
  
  const handleSelectOption = useCallback((option: string) => {
    onChange(option);
    setShowDropdown(false);
    setIsEditing(false);
  }, [onChange]);
  
  const handleTextareaFocus = useCallback(() => {
    if (filteredOptions.length > 0) {
      setShowDropdown(true);
    }
  }, [filteredOptions.length]);
  
  const handleTextareaBlur = useCallback(() => {
    setTimeout(() => {
      setShowDropdown(false);
      if (!value) {
        setIsEditing(false);
      }
    }, 200);
  }, [value]);
  
  // Separate trending (first 2 items) from existing items
  const trendingItems = useMemo(() => 
    filteredOptions.length > 0 ? filteredOptions.slice(0, 2) : [], 
    [filteredOptions]
  );
  const existingItems = useMemo(() => 
    filteredOptions.length > 2 ? filteredOptions.slice(2) : [], 
    [filteredOptions]
  );
  
  return (
    <Card 
      data-element-key={elementKey}
      className={cn(
        "relative overflow-visible transition-all duration-300 cursor-pointer group",
        isSelected 
          ? "border-2 border-primary bg-primary/5 shadow-md hover:border-primary hover:shadow-lg" 
          : "border border-border/50 hover:border-primary/40 hover:bg-muted/50 hover:shadow-md",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <>
          <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[1px] overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
          </div>
          <Badge 
            className="absolute top-4 right-4 z-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs animate-pulse shadow-lg"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            AI Updating...
          </Badge>
        </>
      )}
      
      {/* Success Animation */}
      {wasRecentlyUpdated && !isLoading && (
        <>
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-green-400/20 to-transparent animate-[shimmer_1s_ease-out]" />
          </div>
          <Badge 
            className="absolute top-4 right-4 z-20 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs animate-in fade-in zoom-in duration-300 shadow-lg"
          >
            <Check className="w-3 h-3 mr-1" />
            Updated!
          </Badge>
        </>
      )}
      
      <div className="p-6" onClick={handleCardClick}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "text-base font-semibold mb-1",
                isSelected ? "text-primary" : "text-foreground"
              )}>
                {label}
              </h3>
              {isSelected && (
                <Check className="w-4 h-4 text-primary flex-shrink-0 animate-in zoom-in duration-200" />
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 ml-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-muted transition-all"
              onClick={handleEditClick}
              disabled={isLoading || disabled}
              title="Edit"
            >
              <Edit3 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 hover:bg-muted transition-all",
                isSelected && "bg-primary/10"
              )}
              onClick={handleAskAI}
              disabled={isLoading || disabled}
              title="Ask AI"
            >
              <Sparkles className={cn(
                "w-3.5 h-3.5",
                isSelected ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )} />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative" ref={dropdownRef}>
          {!isEditing && value ? (
            <div 
              className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap break-words min-h-[60px] max-h-[100px] overflow-y-auto pr-2 custom-scrollbar"
            >
              {value}
            </div>
          ) : (
            <div onClick={(e) => e.stopPropagation()}>
              <textarea
                ref={textareaRef}
                value={value}
                onChange={handleTextareaChange}
                onFocus={handleTextareaFocus}
                onBlur={handleTextareaBlur}
                placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
                disabled={disabled || isLoading}
                rows={3}
                className={cn(
                  "w-full rounded-md bg-muted/30 px-3 py-2.5 text-sm text-foreground",
                  "placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
                  "min-h-[60px] max-h-[200px] leading-relaxed transition-all border-0 custom-scrollbar"
                )}
              />
              
              {/* Dropdown Options */}
              {showDropdown && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-popover border border-border/50 rounded-lg shadow-xl max-h-60 overflow-auto">
                  {/* Trending Section */}
                  {trendingItems.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30 flex items-center gap-1.5">
                        🔥 Trending
                      </div>
                      {trendingItems.map((option, index) => {
                        const cleanOption = option.replace(/^🔥\s*/, '');
                        return (
                          <div
                            key={`trending-${index}`}
                            className="px-3 py-2.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-2"
                            onClick={() => handleSelectOption(option)}
                          >
                            <span className="text-base">🔥</span>
                            <span className="text-foreground">{cleanOption}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                  
                  {/* Existing Section */}
                  {existingItems.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30 flex items-center gap-1.5 mt-1">
                        Existing
                      </div>
                      {existingItems.map((option, index) => (
                        <div
                          key={`existing-${index}`}
                          className="px-3 py-2.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors text-foreground"
                          onClick={() => handleSelectOption(option)}
                        >
                          {option}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

// Add these animations and styles to global CSS or use Tailwind plugin
// This can be added to globals.css
/*
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
*/

