"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({ message = "AI is working...", className }: LoadingOverlayProps) {
  return (
    <>
      {/* Shimmer Effect */}
      <div className={cn("absolute inset-0 overflow-hidden pointer-events-none z-10", className)}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
      </div>
      
      {/* AI Badge */}
      <Badge 
        className={cn(
          "absolute top-4 right-4 z-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white",
          "animate-pulse shadow-lg"
        )}
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        {message}
      </Badge>
    </>
  );
}

export function LoadingSpinner({ message, size = "default" }: { message?: string; size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
  };
  
  return (
    <div className="flex items-center gap-2">
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}

