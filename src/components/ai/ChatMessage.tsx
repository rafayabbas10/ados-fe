"use client";

import React from 'react';
import { ChatMessage as ChatMessageType } from '@/types/ai';
import { useAIAgent } from '@/contexts/AIAgentContext';
import { OptionsSelector } from './OptionsSelector';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  onFollowUpClick?: (suggestion: string) => void;
}

export function ChatMessage({ message, onFollowUpClick }: ChatMessageProps) {
  if (message.role === 'user') {
    return <UserMessage message={message} />;
  }
  
  return <AIMessage message={message} onFollowUpClick={onFollowUpClick} />;
}

function UserMessage({ message }: { message: ChatMessageType }) {
  const hasSelectedElement = message.selectedElement;
  
  return (
    <div className="flex justify-end items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col items-end gap-1.5 max-w-[80%]">
        {/* Selected Element Badge */}
        {hasSelectedElement && (
          <Badge 
            variant="secondary" 
            className="bg-primary/10 text-primary border border-primary/20 text-[10px] px-2 py-0.5 font-medium"
          >
            {message.selectedElement!.label}
          </Badge>
        )}
        
        {/* Message Bubble */}
        <div className="rounded-2xl bg-primary text-primary-foreground px-4 py-2.5">
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
      
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold shrink-0">
        U
      </div>
    </div>
  );
}

function AIMessage({ message, onFollowUpClick }: ChatMessageProps) {
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;
  const {
    elementOptions,
    selectedOptionId,
    optionsElement,
    optionsMessageId,
    selectOption,
  } = useAIAgent();
  
  // Check if this message has options
  const hasOptions = optionsMessageId === message.id && elementOptions && elementOptions.length > 0;
  
  return (
    <div className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
        AI
      </div>
      <div className="flex-1 max-w-[85%] space-y-2">
        {/* Tool Calls Section */}
        {hasToolCalls && (
          <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
            <Accordion type="single" collapsible defaultValue="tool-calls">
              <AccordionItem value="tool-calls" className="border-0">
                <AccordionTrigger className="px-3 py-2 hover:bg-muted/50 text-xs font-medium">
                  🔧 Tool Calls ({message.toolCalls!.length})
                </AccordionTrigger>
                <AccordionContent className="px-3 py-2 space-y-1 border-t">
                  {message.toolCalls!.map((toolCall) => (
                    <div key={toolCall.id} className="flex items-center gap-2 text-xs">
                      {toolCall.status === 'started' ? (
                        <Loader2 className="w-3 h-3 animate-spin text-yellow-600" />
                      ) : (
                        <span className="text-green-600">✓</span>
                      )}
                      <Badge
                        variant={toolCall.status === 'started' ? 'secondary' : 'outline'}
                        className={
                          toolCall.status === 'started'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-green-50 text-green-700 border-green-200'
                        }
                      >
                        {toolCall.message || toolCall.tool}
                      </Badge>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
        
        {/* Message Content */}
        <div className="rounded-2xl bg-muted px-4 py-3">
          {message.isStreaming && !message.content ? (
            <TypingIndicator />
          ) : (
            <div className="text-sm text-foreground whitespace-pre-wrap break-words">
              {message.content}
              {message.isStreaming && <span className="animate-pulse">▊</span>}
            </div>
          )}
        </div>
        
        {/* Element Options */}
        {hasOptions && !message.isStreaming && (
          <OptionsSelector
            options={elementOptions!}
            selectedOptionId={selectedOptionId}
            onSelectOption={selectOption}
            elementLabel={optionsElement ? optionsElement.replace('_', ' ') : undefined}
          />
        )}
        
        {/* Follow-up Suggestions */}
        {message.followUpSuggestions && message.followUpSuggestions.length > 0 && !message.isStreaming && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground font-medium">💡 You might also want to:</p>
            <div className="flex flex-wrap gap-2">
              {message.followUpSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs h-7"
                  onClick={() => onFollowUpClick?.(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

