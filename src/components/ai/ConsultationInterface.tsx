"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAIAgent } from '@/contexts/AIAgentContext';
import { ChatMessage } from './ChatMessage';
import { AdSelectorModal } from './AdSelectorModal';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, Zap, Target, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Creative } from '@/services/creativesService';
import { StreamEvent, UICommand } from '@/types/ai';

interface ConsultationInterfaceProps {
  onAdSelect: (ad: Creative) => void;
  adSelectorTrigger?: number;
}

export function ConsultationInterface({ onAdSelect, adSelectorTrigger }: ConsultationInterfaceProps) {
  const {
    messages,
    sendMessage,
    isStreaming,
  } = useAIAgent();
  
  const [inputValue, setInputValue] = useState('');
  const [showAdSelector, setShowAdSelector] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevTriggerRef = useRef(adSelectorTrigger);
  
  // Debug: Log showAdSelector state changes
  useEffect(() => {
    console.log('🔔 showAdSelector state changed to:', showAdSelector);
  }, [showAdSelector]);
  
  // Debug: Log every render
  console.log('🔄 ConsultationInterface render - showAdSelector:', showAdSelector, 'trigger:', adSelectorTrigger);
  
  // Watch for trigger changes to open modal
  useEffect(() => {
    if (adSelectorTrigger !== undefined && adSelectorTrigger !== prevTriggerRef.current && adSelectorTrigger > 0) {
      console.log('🎯 Ad selector trigger changed from', prevTriggerRef.current, 'to', adSelectorTrigger);
      console.log('✅ Opening ad selector modal (trigger-based)');
      setShowAdSelector(true);
      prevTriggerRef.current = adSelectorTrigger;
    }
  }, [adSelectorTrigger]);
  
  // Handle modal open/close
  const handleOpenModal = useCallback(() => {
    console.log('👆 User manually opened ad selector');
    setShowAdSelector(true);
  }, []);
  
  const handleCloseModal = useCallback(() => {
    console.log('🚪 User closed ad selector modal');
    setShowAdSelector(false);
  }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const userScrolledRef = useRef(false);
  
  // Check if user is near bottom of scroll
  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 100; // pixels from bottom
    const position = container.scrollHeight - container.scrollTop - container.clientHeight;
    return position < threshold;
  };
  
  // Check if user is EXACTLY at bottom (stricter check for auto-scroll)
  const isAtBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 10; // Very small threshold - essentially at bottom
    const position = container.scrollHeight - container.scrollTop - container.clientHeight;
    return position < threshold;
  };
  
  // Handle scroll events to detect if user scrolled up
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const isBottom = isNearBottom();
    setShowScrollButton(!isBottom);
    
    // If user scrolled to bottom, mark as not manually scrolled
    if (isBottom) {
      userScrolledRef.current = false;
    } else {
      userScrolledRef.current = true;
    }
  };
  
  // Scroll to bottom function
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    // Reset the scroll state so future messages auto-scroll
    userScrolledRef.current = false;
    setShowScrollButton(false);
  };
  
  // Auto-scroll only when user is at bottom
  useEffect(() => {
    // Special case: Always scroll for the first message
    if (messages.length === 1) {
      scrollToBottom('auto');
      userScrolledRef.current = false;
      setShowScrollButton(false);
      return;
    }
    
    // For all subsequent messages, don't auto-scroll during streaming
    // Just show the scroll button if user is not at the bottom
    if (!isNearBottom()) {
      setShowScrollButton(true);
    }
  }, [messages]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);
  
  // Note: UI command handling (SHOW_AD_SELECTOR) is done by page.tsx
  // which passes the showAdSelector state down as a prop
  
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
  
  const quickPrompts = [
    { icon: Sparkles, text: "What makes a great hook?", color: "text-purple-500" },
    { icon: Target, text: "How do I improve my ad angles?", color: "text-blue-500" },
    { icon: Zap, text: "Best practices for UGC videos", color: "text-yellow-500" },
  ];
  
  // Show messages view if there are messages
  if (messages.length > 0) {
    return (
      <>
        <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-background via-background to-muted/10">
          {/* Messages Area - Scrollable */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          >
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onFollowUpClick={handleFollowUpClick}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Scroll to Bottom Button - Positioned absolutely over messages area */}
          {showScrollButton && (
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 animate-in fade-in slide-in-from-top-2">
              <Button
                onClick={() => scrollToBottom('smooth')}
                size="sm"
                className="rounded-full shadow-lg bg-background border-2 border-border hover:bg-accent h-10 w-10 p-0"
              >
                <ArrowDown className="w-4 h-4 text-foreground" />
              </Button>
            </div>
          )}
          
          {/* Input Area - Fixed at Bottom */}
          <div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur-md py-4">
            <div className="max-w-3xl mx-auto px-6">
              <div className="relative flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about ad strategies, creative frameworks, or request to edit an ad..."
                    disabled={isStreaming}
                    rows={1}
                    className={cn(
                      "w-full resize-none rounded-xl border border-input bg-background px-4 py-3",
                      "text-base placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent",
                      "max-h-[120px]"
                    )}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isStreaming}
                  size="lg"
                  className="h-12 px-5 rounded-xl bg-primary hover:bg-primary/90 transition-all"
                >
                  {isStreaming ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground">
                  Press Enter to send • Shift + Enter for new line
                </p>
                <Button
                  onClick={handleOpenModal}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  📁 Select Ad to Edit
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <AdSelectorModal
          isOpen={showAdSelector}
          onClose={handleCloseModal}
          onSelect={onAdSelect}
        />
      </>
    );
  }
  
  // Show beautiful landing view when no messages
  return (
    <>
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6 overflow-auto">
        <div className="w-full max-w-4xl mx-auto space-y-8 py-12">
          {/* Header */}
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Creative Strategist AI</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Build something <span className="text-primary">Brilliant</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get strategic advice on your ad creatives. Refine angles, optimize hooks, and craft winning briefs by chatting with AI.
            </p>
          </div>
          
          {/* Main Input */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-card/80 backdrop-blur-sm border-2 border-border rounded-2xl shadow-2xl">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the Creative Strategist to help you optimize your ads..."
                  disabled={isStreaming}
                  rows={1}
                  className={cn(
                    "w-full resize-none bg-transparent px-6 py-5 pr-16",
                    "text-lg placeholder:text-muted-foreground",
                    "focus:outline-none",
                    "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                  )}
                />
                <div className="flex items-center justify-between px-6 pb-4 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleOpenModal}
                      variant="ghost"
                      size="sm"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      📁 Select Ad to Edit
                    </Button>
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isStreaming}
                    size="lg"
                    className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
                  >
                    {isStreaming ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Prompts */}
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <p className="text-sm text-center text-muted-foreground">Quick starts:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputValue(prompt.text);
                    textareaRef.current?.focus();
                  }}
                  className={cn(
                    "group relative p-4 rounded-xl border-2 border-border bg-card/50 backdrop-blur-sm",
                    "hover:border-primary/50 hover:bg-card transition-all duration-300",
                    "text-left"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <prompt.icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", prompt.color)} />
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      {prompt.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Features */}
          <div className="pt-8 animate-in fade-in duration-700 delay-300">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Strategic Consultation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Brief Refinement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Performance Insights</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <AdSelectorModal
        isOpen={showAdSelector}
        onClose={handleCloseModal}
        onSelect={onAdSelect}
      />
    </>
  );
}

