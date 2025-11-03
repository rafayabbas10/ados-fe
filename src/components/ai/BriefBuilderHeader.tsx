"use client";

import React, { useState } from 'react';
import { useAIAgent } from '@/contexts/AIAgentContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronDown, Settings, RotateCcw, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BriefBuilderHeaderProps {
  adFormat?: string;
  accountId?: string;
  onChangeAd?: () => void;
  onReset?: () => void;
}

type StatusConfig = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  className: string;
  spin?: boolean;
};

export function BriefBuilderHeader({
  adFormat,
  accountId,
  onChangeAd,
  onReset,
}: BriefBuilderHeaderProps) {
  const { selectedAdId, adName, aiStatus } = useAIAgent();
  const [showResetDialog, setShowResetDialog] = useState(false);
  
  const statusConfig: Record<string, StatusConfig> = {
    idle: {
      icon: AlertCircle,
      label: 'Not Connected',
      className: 'bg-gray-50 text-gray-700 border-gray-200',
    },
    initializing: {
      icon: Loader2,
      label: 'Initializing...',
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      spin: true,
    },
    ready: {
      icon: CheckCircle2,
      label: 'AI Ready',
      className: 'bg-green-50 text-green-700 border-green-200',
    },
    streaming: {
      icon: Loader2,
      label: 'Processing...',
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      spin: true,
    },
    error: {
      icon: XCircle,
      label: 'Error',
      className: 'bg-red-50 text-red-700 border-red-200',
    },
  };
  
  const config = statusConfig[aiStatus];
  const StatusIcon = config.icon;
  
  const handleReset = () => {
    setShowResetDialog(false);
    onReset?.();
  };
  
  return (
    <>
      <div className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Left: Ad Info */}
            <div className="flex items-center gap-4">
              {/* Ad Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedAdId ? `Ad #${selectedAdId}` : 'No Ad Selected'}
                    {adName && <span className="text-muted-foreground">: {adName}</span>}
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {accountId && <span>Account: {accountId}</span>}
                  {adFormat && (
                    <>
                      <span>•</span>
                      <span>Format: {adFormat}</span>
                    </>
                  )}
                  <span>•</span>
                  <Badge variant="outline" className={cn('text-xs', config.className)}>
                    <StatusIcon className={cn('w-3 h-3 mr-1', config.spin && 'animate-spin')} />
                    {config.label}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {onChangeAd && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onChangeAd}
                  className="h-9"
                >
                  Change Ad
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowResetDialog(true)}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Brief
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Brief Builder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all current data and reset the AI assistant. You&apos;ll need to select an ad again to start over.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

