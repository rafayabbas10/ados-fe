"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';
import {
  AIStatus,
  LayoutMode,
  ElementKey,
  ChatMessage,
  StreamEvent,
  FrontendContext,
  ToolCall,
  BriefInitializationData,
  ElementOption,
  UpdatedBlocksEvent,
} from '@/types/ai';
import { streamChat, generateSessionId, generateThreadId } from '@/services/aiAgentService';
import { useAccount } from './AccountContext';

// Window interface extension for custom properties
interface CustomWindow extends Window {
  __briefBuilderUICommandHandler?: (event: UpdatedBlocksEvent | StreamEvent) => void;
  __registerOptionSelectedCallback?: (callback: (value: string, element: ElementKey) => void) => void;
}

interface AIAgentContextType {
  // Ad Context
  selectedAdId: string | null;
  adName: string | null;
  setAdContext: (adId: string, adName: string) => void;
  
  // AI Session
  threadId: string;
  sessionId: string;
  aiStatus: AIStatus;
  
  // UI State
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  isStreaming: boolean;
  
  // Selection State
  selectedElement: ElementKey | null;
  selectedElementLabel: string | null;
  selectedBlocks: string[];
  selectElement: (element: ElementKey | null, label?: string) => void;
  selectBlocks: (blockIds: string[]) => void;
  toggleBlock: (blockId: string) => void;
  clearSelection: () => void;
  
  // Loading States
  loadingTargets: Set<string>;
  addLoadingTarget: (target: string) => void;
  removeLoadingTarget: (target: string) => void;
  recentlyUpdatedElement: ElementKey | null;
  triggerElementSuccess: (element: ElementKey) => void;
  
  // Chat
  messages: ChatMessage[];
  sendMessage: (message: string, context?: FrontendContext) => Promise<void>;
  
  // Element Options
  elementOptions: ElementOption[] | null;
  selectedOptionId: string | null;
  optionsElement: ElementKey | null;
  optionsMessageId: string | null;
  selectOption: (optionId: string, optionLabel: string) => void;
  clearOptions: () => void;
  
  // Initialization
  initializeAI: (adId: string, adAccountId: string, briefData?: BriefInitializationData) => Promise<void>;
  resetAI: () => void;
}

const AIAgentContext = createContext<AIAgentContextType | undefined>(undefined);

export function AIAgentProvider({ children }: { children: ReactNode }) {
  const { selectedAccountId } = useAccount();
  
  // Ad Context
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [adName, setAdName] = useState<string | null>(null);
  
  // AI Session
  const [threadId] = useState(generateThreadId());
  const [sessionId] = useState(generateSessionId());
  const [aiStatus, setAIStatus] = useState<AIStatus>('idle');
  
  // UI State
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('empty');
  const [isStreaming, setIsStreaming] = useState(false);
  
  // Selection State
  const [selectedElement, setSelectedElement] = useState<ElementKey | null>(null);
  const [selectedElementLabel, setSelectedElementLabel] = useState<string | null>(null);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [selectedBlockDetails, setSelectedBlockDetails] = useState<Array<{id: string; order: number; scriptLine?: string; sceneDescription?: string; text?: string; design_notes?: string}>>([]);
  
  // Loading States
  const [loadingTargets, setLoadingTargets] = useState<Set<string>>(new Set());
  
  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const currentStreamingMessageRef = useRef<ChatMessage | null>(null);
  const sendMessageRef = useRef<((message: string, context?: FrontendContext) => Promise<void>) | null>(null);
  const addLoadingTargetRef = useRef<((target: string) => void) | null>(null);
  const onOptionSelectedCallbackRef = useRef<((value: string, element: ElementKey) => void) | null>(null);
  
  // Element Options
  const [elementOptions, setElementOptions] = useState<ElementOption[] | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [optionsElement, setOptionsElement] = useState<ElementKey | null>(null);
  const [optionsMessageId, setOptionsMessageId] = useState<string | null>(null);
  const [recentlyUpdatedElement, setRecentlyUpdatedElement] = useState<ElementKey | null>(null);
  
  // Set ad context
  const setAdContext = useCallback((adId: string, name: string) => {
    setSelectedAdId(adId);
    setAdName(name);
  }, []);
  
  // Selection handlers
  const selectElement = useCallback((element: ElementKey | null, label?: string) => {
    setSelectedElement(element);
    setSelectedElementLabel(label || null);
    // Clear block selection when selecting element
    if (element) {
      setSelectedBlocks([]);
    }
  }, []);
  
  const selectBlocks = useCallback((blockIds: string[], blockDetails?: Array<{id: string; order: number; scriptLine?: string; sceneDescription?: string; text?: string; design_notes?: string}>) => {
    setSelectedBlocks(blockIds);
    setSelectedBlockDetails(blockDetails || []);
    // Clear element selection when selecting blocks
    if (blockIds.length > 0) {
      setSelectedElement(null);
      setSelectedElementLabel(null);
    }
  }, []);
  
  const toggleBlock = useCallback((blockId: string, blockDetail?: {id: string; order: number; scriptLine?: string; sceneDescription?: string; text?: string; design_notes?: string}) => {
    setSelectedBlocks(prev => {
      if (prev.includes(blockId)) {
        return prev.filter(id => id !== blockId);
      } else {
        return [...prev, blockId];
      }
    });
    
    // Update block details
    setSelectedBlockDetails(prev => {
      if (prev.some(b => b.id === blockId)) {
        return prev.filter(b => b.id !== blockId);
      } else if (blockDetail) {
        return [...prev, blockDetail];
      }
      return prev;
    });
    
    // Clear element selection
    setSelectedElement(null);
    setSelectedElementLabel(null);
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedElement(null);
    setSelectedElementLabel(null);
    setSelectedBlocks([]);
    setSelectedBlockDetails([]);
  }, []);
  
  // Element options handlers
  const selectOption = useCallback((optionId: string, optionLabel: string) => {
    setSelectedOptionId(optionId);
    // Find option number (1-indexed)
    const option = elementOptions?.find(opt => opt.id === optionId);
    if (option && optionsElement && elementOptions) {
      const optionNumber = elementOptions.indexOf(option) + 1;
      const message = `Option ${optionNumber} - ${optionLabel}`;
      
      // Signal page component to update element value and remove loading immediately
      if (onOptionSelectedCallbackRef.current) {
        onOptionSelectedCallbackRef.current(option.value, optionsElement);
      }
      
      // Use ref to avoid circular dependency
      setTimeout(() => {
        sendMessageRef.current?.(message);
      }, 0);
    }
  }, [elementOptions, optionsElement]);
  
  const clearOptions = useCallback(() => {
    setElementOptions(null);
    setSelectedOptionId(null);
    setOptionsElement(null);
    setOptionsMessageId(null);
  }, []);
  
  // Loading state handlers
  const addLoadingTarget = useCallback((target: string) => {
    setLoadingTargets(prev => new Set(prev).add(target));
  }, []);
  
  const removeLoadingTarget = useCallback((target: string) => {
    setLoadingTargets(prev => {
      const newSet = new Set(prev);
      newSet.delete(target);
      return newSet;
    });
  }, []);
  
  const triggerElementSuccess = useCallback((element: ElementKey) => {
    setRecentlyUpdatedElement(element);
    setTimeout(() => {
      setRecentlyUpdatedElement(null);
    }, 2000);
  }, []);
  
  // Handle streaming events
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    console.log('📨 Stream event:', event);
    
    // Ensure we have a streaming message for non-ui_command events
    if (event.type !== 'ui_command' && !currentStreamingMessageRef.current) {
      console.warn('No streaming message ref, creating one');
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'ai',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        toolCalls: [],
      };
      setMessages(prev => [...prev, newMessage]);
      currentStreamingMessageRef.current = newMessage;
    }
    
    switch (event.type) {
      case 'tool_call':
        // Add tool call to current streaming message
        if (currentStreamingMessageRef.current) {
          const toolCall: ToolCall = {
            id: `${event.tool}-${Date.now()}`,
            tool: event.tool,
            status: event.status,
            message: event.message,
            timestamp: new Date(),
          };
          
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.role === 'ai') {
              lastMessage.toolCalls = lastMessage.toolCalls || [];
              // Update existing tool call or add new one
              const existingIndex = lastMessage.toolCalls.findIndex(tc => tc.tool === event.tool);
              if (existingIndex !== -1) {
                lastMessage.toolCalls[existingIndex] = toolCall;
              } else {
                lastMessage.toolCalls.push(toolCall);
              }
            }
            return updated;
          });
          
          // If regenerate_script or regenerate_image starts, signal page to add block loading
          const isRegenerateTool = event.tool === 'regenerate_script' || event.tool === 'regenerate_image';
          
          if (isRegenerateTool && event.status === 'started') {
            const customWindow = window as unknown as CustomWindow;
            if (typeof window !== 'undefined' && customWindow.__briefBuilderUICommandHandler) {
              customWindow.__briefBuilderUICommandHandler({
                type: 'ui_command' as const,
                commands: [{
                  command: 'START_BLOCK_LOADING' as const,
                  data: {}
                }]
              });
            }
          }
          
          // If regenerate tool completes/fails, stop loading (failsafe if UPDATE_BLOCKS not sent)
          const eventStatus = event.status;
          if (isRegenerateTool && (eventStatus === 'completed' || eventStatus === 'failed')) {
            const customWindow = window as unknown as CustomWindow;
            if (typeof window !== 'undefined' && customWindow.__briefBuilderUICommandHandler) {
              // Delay slightly to ensure UPDATE_BLOCKS is processed first if it's coming
              setTimeout(() => {
                if (customWindow.__briefBuilderUICommandHandler) {
                  customWindow.__briefBuilderUICommandHandler({
                    type: 'ui_command' as const,
                    commands: [{
                      command: 'STOP_BLOCK_LOADING' as const,
                      data: {}
                    }]
                  });
                }
              }, 1000);
            }
          }
        }
        break;
        
      case 'message':
        // Append content to current streaming message
        if (currentStreamingMessageRef.current) {
          currentStreamingMessageRef.current.content += event.content;
          const newContent = currentStreamingMessageRef.current.content;
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.role === 'ai') {
              lastMessage.content = newContent;
            }
            return updated;
          });
        }
        break;
        
      case 'complete':
        // Finalize streaming message
        if (currentStreamingMessageRef.current) {
          setMessages(prev => {
            const updated = [...prev];
            const lastMessage = updated[updated.length - 1];
            if (lastMessage && lastMessage.role === 'ai') {
              lastMessage.isStreaming = false;
              lastMessage.followUpSuggestions = event.followup_suggestions;
            }
            return updated;
          });
          currentStreamingMessageRef.current = null;
        }
        setIsStreaming(false);
        setAIStatus('ready');
        break;
        
      case 'error':
        console.error('❌ AI error:', event.error);
        // Add error message
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'ai',
          content: `Error: ${event.error}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsStreaming(false);
        setAIStatus('error');
        currentStreamingMessageRef.current = null;
        break;
        
      case 'ui_command':
        // UI commands are handled by the page component via callback
        // Call global handler if available
        const customWindow1 = window as unknown as CustomWindow;
        if (typeof window !== 'undefined' && customWindow1.__briefBuilderUICommandHandler) {
          customWindow1.__briefBuilderUICommandHandler(event);
        }
        break;
        
      case 'elementOptions':
        console.log('📋 Element options received:', event);
        setElementOptions(event.options);
        setOptionsElement(event.element);
        setSelectedOptionId(null); // Reset selection
        // Store the message ID that triggered these options
        if (currentStreamingMessageRef.current) {
          setOptionsMessageId(currentStreamingMessageRef.current.id);
        }
        // Keep loading overlay active - user needs to select an option
        // Loading will be removed when user selects an option and element is updated
        break;
        
      case 'updatedBlocks':
        console.log('📦 Updated blocks received:', event);
        // Forward to page component's UI command handler
        const customWindow2 = window as unknown as CustomWindow;
        if (typeof window !== 'undefined' && customWindow2.__briefBuilderUICommandHandler) {
          // Convert updatedBlocks event to UPDATE_BLOCKS command format
          const updateBlocksEvent = {
            type: 'ui_command' as const,
            commands: [{
              command: 'UPDATE_BLOCKS' as const,
              data: {
                blocks: (event as UpdatedBlocksEvent).blocks,
                selective: (event as UpdatedBlocksEvent).selective || false
              }
            }]
          };
          customWindow2.__briefBuilderUICommandHandler(updateBlocksEvent);
        }
        break;
    }
  }, [removeLoadingTarget]);
  
  // Send message to AI
  const sendMessage = useCallback(async (message: string, context?: FrontendContext) => {
    // Allow sending messages in consultation mode (without selectedAdId)
    if (isStreaming) return;
    
    // Capture selected element info before clearing
    const elementInfo = selectedElement && selectedElementLabel ? {
      key: selectedElement,
      label: selectedElementLabel,
    } : undefined;
    
    // Add user message with selected element info
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      selectedElement: elementInfo,
    };
    setMessages(prev => [...prev, userMessage]);
    
    // If an element was selected, add loading overlay and clear selection
    if (selectedElement) {
      addLoadingTarget(`element-${selectedElement}`);
      clearSelection();
    }
    
    // If blocks were selected, add loading to those specific blocks and clear selection
    if (selectedBlocks.length > 0) {
      selectedBlocks.forEach(blockId => {
        addLoadingTarget(`block-${blockId}`);
      });
      clearSelection();
    }
    
    // Create AI message placeholder
    const aiMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'ai',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      toolCalls: [],
    };
    setMessages(prev => [...prev, aiMessage]);
    currentStreamingMessageRef.current = aiMessage;
    
    setIsStreaming(true);
    setAIStatus('streaming');
    
    try {
      // Build frontend context
      const frontendContext: FrontendContext = context || {};
      if (!context) {
        if (selectedElement !== null) {
          frontendContext.selected_element = selectedElement || undefined;
        }
        if (selectedBlocks.length > 0 && selectedBlockDetails.length > 0) {
          // Send detailed block info instead of just IDs
          frontendContext.selected_blocks = selectedBlockDetails.map(block => ({
            scene_number: block.order,
            script: block.scriptLine || '',
            visual: block.sceneDescription || ''
          }));
        }
      }
      
      await streamChat(
        {
          message,
          thread_id: threadId,
          session_id: sessionId,
          // Only include audit_ad_id if an ad is selected (consultation mode doesn't require it)
          ...(selectedAdId && { audit_ad_id: selectedAdId }),
          // Only include ad_account_id if an account is selected
          ...(selectedAccountId && { ad_account_id: selectedAccountId }),
          frontend_context: Object.keys(frontendContext).length > 0 ? frontendContext : undefined,
          stream: true,
        },
        handleStreamEvent
      );
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update last message with error
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage && lastMessage.role === 'ai') {
          lastMessage.content = error instanceof Error 
            ? `Sorry, there was an error: ${error.message}`
            : 'Sorry, there was an unexpected error.';
          lastMessage.isStreaming = false;
        }
        return updated;
      });
      
      setIsStreaming(false);
      setAIStatus('error');
      currentStreamingMessageRef.current = null;
    }
  }, [
    selectedAdId,
    isStreaming,
    selectedElement,
    selectedElementLabel,
    selectedBlocks,
    selectedBlockDetails,
    threadId,
    sessionId,
    selectedAccountId,
    handleStreamEvent,
    addLoadingTarget,
    clearSelection,
  ]);
  
  // Update refs for callbacks (after all callbacks are defined)
  useEffect(() => {
    sendMessageRef.current = sendMessage;
    addLoadingTargetRef.current = addLoadingTarget;
  }, [sendMessage, addLoadingTarget]);
  
  // Allow page to register callback for option selection
  useEffect(() => {
    const customWindow = window as unknown as CustomWindow;
    if (typeof window !== 'undefined') {
      customWindow.__registerOptionSelectedCallback = (callback: (value: string, element: ElementKey) => void) => {
        onOptionSelectedCallbackRef.current = callback;
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete customWindow.__registerOptionSelectedCallback;
      }
    };
  }, []);
  
  // Initialize AI with ad
  const initializeAI = useCallback(async (adId: string, adAccountId: string, briefData?: BriefInitializationData) => {
    setAIStatus('initializing');
    setLayoutMode('full');
    
    // Add initial AI message
    const initialMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'ai',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      toolCalls: [],
    };
    setMessages([initialMessage]);
    currentStreamingMessageRef.current = initialMessage;
    
    setIsStreaming(true);
    
    try {
      await streamChat(
        {
          message: `Initialize brief for ad ${adId}`,
          thread_id: threadId,
          session_id: sessionId,
          audit_ad_id: adId,
          ad_account_id: adAccountId,
          brief_data: briefData,
          stream: true,
        },
        handleStreamEvent
      );
      
      setAIStatus('ready');
    } catch (error) {
      console.error('Error initializing AI:', error);
      setAIStatus('error');
      
      // Update message with error
      setMessages(prev => {
        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];
        if (lastMessage && lastMessage.role === 'ai') {
          lastMessage.content = 'Failed to initialize. You can continue manually.';
          lastMessage.isStreaming = false;
        }
        return updated;
      });
      
      currentStreamingMessageRef.current = null;
    } finally {
      setIsStreaming(false);
    }
  }, [threadId, sessionId, handleStreamEvent]);
  
  // Reset AI state
  const resetAI = useCallback(() => {
    setSelectedAdId(null);
    setAdName(null);
    setAIStatus('idle');
    setLayoutMode('empty');
    setIsStreaming(false);
    setSelectedElement(null);
    setSelectedElementLabel(null);
    setSelectedBlocks([]);
    setSelectedBlockDetails([]);
    setLoadingTargets(new Set());
    setMessages([]);
    currentStreamingMessageRef.current = null;
  }, []);
  
  return (
    <AIAgentContext.Provider
      value={{
        selectedAdId,
        adName,
        setAdContext,
        threadId,
        sessionId,
        aiStatus,
        layoutMode,
        setLayoutMode,
        isStreaming,
        selectedElement,
        selectedElementLabel,
        selectedBlocks,
        selectElement,
        selectBlocks,
        toggleBlock,
        clearSelection,
        loadingTargets,
        addLoadingTarget,
        removeLoadingTarget,
        recentlyUpdatedElement,
        triggerElementSuccess,
        messages,
        sendMessage,
        elementOptions,
        selectedOptionId,
        optionsElement,
        optionsMessageId,
        selectOption,
        clearOptions,
        initializeAI,
        resetAI,
      }}
    >
      {children}
    </AIAgentContext.Provider>
  );
}

export function useAIAgent() {
  const context = useContext(AIAgentContext);
  if (context === undefined) {
    throw new Error('useAIAgent must be used within an AIAgentProvider');
  }
  return context;
}

