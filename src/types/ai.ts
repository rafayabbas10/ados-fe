// AI Agent types and interfaces

export type ElementKey = 
  | 'avatar' 
  | 'market_awareness' 
  | 'angle' 
  | 'format' 
  | 'theme' 
  | 'tonality';

export type AIStatus = 
  | 'idle' 
  | 'initializing' 
  | 'ready' 
  | 'streaming' 
  | 'error';

export type LayoutMode = 
  | 'empty' 
  | 'full' 
  | 'chat-minimized';

// Streaming Event Types
export interface ToolCallEvent {
  type: 'tool_call';
  tool: string;
  status: 'started' | 'completed';
  message?: string;
}

export interface UICommandEvent {
  type: 'ui_command';
  commands: UICommand[];
}

export interface MessageEvent {
  type: 'message';
  content: string;
}

export interface CompleteEvent {
  type: 'complete';
  followup_suggestions?: string[];
}

export interface ErrorEvent {
  type: 'error';
  error: string;
}

export interface ElementOption {
  id: string;
  label: string;
  value: string;
}

export interface ElementOptionsEvent {
  type: 'elementOptions';
  element: ElementKey;
  options: ElementOption[];
}

export interface UpdatedBlocksEvent {
  type: 'updatedBlocks';
  blocks: Array<{
    id: string;
    scene?: number;
    order?: number;
    type?: string;
    scriptLine?: string;
    visual?: string;
    textOverlay?: string;
    audio?: string;
    timestamp?: string;
    shot_type?: string;
  }>;
  selective?: boolean;  // If true, only update specified blocks
}

export type StreamEvent = 
  | ToolCallEvent 
  | UICommandEvent 
  | MessageEvent 
  | CompleteEvent 
  | ErrorEvent
  | ElementOptionsEvent
  | UpdatedBlocksEvent;

// UI Commands
export type UICommand =
  | InitializeBriefCommand
  | ShowAdMediaCommand
  | ShowOptionsCommand
  | UpdateElementCommand
  | UpdateBlocksCommand
  | ShowLoadingCommand
  | HighlightElementCommand
  | HighlightBlocksCommand
  | StartBlockLoadingCommand;

export interface StartBlockLoadingCommand {
  command: 'START_BLOCK_LOADING';
  data: Record<string, never>;
}

export interface InitializeBriefCommand {
  command: 'INITIALIZE_BRIEF';
  data: {
    elements: {
      avatar?: string;
      market_awareness?: string;
      angle?: string;
      format?: string;
      theme?: string;
      tonality?: string;
    };
    script_builder: {
      variations: Array<{
        name: string;
        blocks: Array<{
          id: string;
          scene?: number;
          type: string;
          scriptLine?: string;
          audio?: string;
          visual?: string;
          textOverlay?: string;
        }>;
      }>;
    };
  };
}

export interface ShowAdMediaCommand {
  command: 'SHOW_AD_MEDIA';
  data: {
    ad_type: 'video' | 'image';
    ad_video_link?: string;
    ad_link?: string;
    ad_name: string;
  };
}

export interface ShowOptionsCommand {
  command: 'SHOW_OPTIONS';
  data: {
    element: ElementKey;
    options: string[];
  };
}

export interface UpdateElementCommand {
  command: 'UPDATE_ELEMENT';
  data: {
    element: ElementKey;
    value: string;
  };
}

export interface UpdateBlocksCommand {
  command: 'UPDATE_BLOCKS';
  data: {
    blocks: Array<{
      id: string;
      scene?: number;
      order?: number;
      type?: string;
      scriptLine?: string;
      audio?: string;
      visual?: string;
      textOverlay?: string;
    }>;
    selective?: boolean;  // If true, only update specified blocks
  };
}

export interface ShowLoadingCommand {
  command: 'SHOW_LOADING';
  data: {
    target: string;
    updated_element?: ElementKey;
    message?: string;
  };
}

export interface HighlightElementCommand {
  command: 'HIGHLIGHT_ELEMENT';
  data: {
    element: ElementKey;
  };
}

export interface HighlightBlocksCommand {
  command: 'HIGHLIGHT_BLOCKS';
  data: {
    block_ids: string[];
  };
}

// Chat Message Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  followUpSuggestions?: string[];
  isStreaming?: boolean;
  selectedElement?: {
    key: ElementKey;
    label: string;
  };
}

export interface ToolCall {
  id: string;
  tool: string;
  status: 'started' | 'completed';
  message?: string;
  timestamp: Date;
}

// Brief Initialization Data
export interface BriefInitializationData {
  elements?: {
    avatar?: string;
    awareness?: string;
    angle?: string;
    format?: string;
    theme?: string;
    tonality?: string;
  };
  script_blocks?: Array<{
    scene_no: number;
    block_type: string;
    script: string;
    visual_description: string;
    text_overlay?: string;
  }>;
}

// API Request/Response Types
export interface ChatRequest {
  message: string;
  thread_id: string;
  session_id: string;
  audit_ad_id?: string | number;
  ad_account_id?: string;
  frontend_context?: {
    selected_element?: ElementKey;
    selected_blocks?: Array<{
      scene_number: number;
      script: string;
      visual: string;
    }>;
  };
  brief_data?: BriefInitializationData;
  stream: boolean;
}

export interface AIConfig {
  apiBaseUrl: string;
  streamTimeout: number;
  retryAttempts: number;
}

// Frontend Context Type
export interface FrontendContext {
  selected_element?: ElementKey;
  selected_blocks?: Array<{
    scene_number: number;
    script: string;
    visual: string;
  }>;
}

