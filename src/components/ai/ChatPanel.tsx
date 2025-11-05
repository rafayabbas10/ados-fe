"use client";

import React, { useRef, useEffect, useState } from 'react';
import { useAIAgent } from '@/contexts/AIAgentContext';
import { ChatMessage } from './ChatMessage';
import { Button } from '@/components/ui/button';
import { Send, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatPanel() {
  const {
    messages,
    sendMessage,
    isStreaming,
    selectedElement,
    selectedElementLabel,
    selectedBlocks,
    clearSelection,
    selectedAdId,
  } = useAIAgent();
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
    }
  }, [inputValue]);
  
  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;
    
    await sendMessage(inputValue.trim());
    setInputValue('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFollowUpClick = (suggestion: string) => {
    setInputValue(suggestion);
    textareaRef.current?.focus();
  };
  
  const hasSelection = selectedElement || selectedBlocks.length > 0;
  const selectionText = selectedElement
    ? `${selectedElementLabel || selectedElement} selected`
    : `${selectedBlocks.length} block${selectedBlocks.length > 1 ? 's' : ''} selected`;
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-background">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div className="space-y-2 max-w-sm">
              <p className="text-sm">
                {selectedAdId 
                  ? "AI Assistant is ready! Ask me anything about this brief."
                  : "Select an ad above to get started, or tell me which ad you'd like to work on."}
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onFollowUpClick={handleFollowUpClick}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Selection Context Bar */}
      {hasSelection && (
        <div className="border-t border-primary/20 bg-primary/10 px-4 py-2 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{selectionText}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-6 text-xs hover:bg-primary/20"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}
      
      {/* Input Area */}
      <div className="border-t border-border p-3 bg-background">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !selectedAdId
                ? "Select an ad to start..."
                : selectedElement
                ? `What would you like to change the ${selectedElementLabel} to?`
                : selectedBlocks.length > 0
                ? "How would you like to modify the selected blocks?"
                : "Ask about elements or script blocks..."
            }
            disabled={!selectedAdId || isStreaming}
            className={cn(
              "flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2",
              "text-sm placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "min-h-[40px] max-h-[100px]"
            )}
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming || !selectedAdId}
            size="icon"
            className="shrink-0 h-10 w-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

