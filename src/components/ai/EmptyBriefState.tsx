"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { AdSelector } from './AdSelector';
import { ChatPanel } from './ChatPanel';
import { Creative } from '@/services/creativesService';

interface EmptyBriefStateProps {
  onAdSelect: (ad: Creative) => void;
}

export function EmptyBriefState({ onAdSelect }: EmptyBriefStateProps) {
  return (
    <div className="h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Brief Builder AI Assistant</h1>
          <p className="text-muted-foreground">Select an ad to get started with AI-powered brief building</p>
        </div>
        
        {/* Ad Selector */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Select an Ad</h2>
          <AdSelector onSelect={onAdSelect} />
        </Card>
        
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or chat with AI</span>
          </div>
        </div>
        
        {/* Chat Interface */}
        <Card className="h-[400px] flex flex-col overflow-hidden">
          <ChatPanel />
        </Card>
        
        {/* Helper Text */}
        <p className="text-center text-sm text-muted-foreground">
          You can also type an ad ID in the chat to start working on it
        </p>
      </div>
    </div>
  );
}

