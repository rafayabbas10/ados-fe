// AI Agent Service - Handles streaming communication with AI backend

import { ChatRequest, StreamEvent, AIConfig } from '@/types/ai';

const DEFAULT_CONFIG: AIConfig = {
  // apiBaseUrl: process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000/api/v1',
  apiBaseUrl: process.env.NEXT_PUBLIC_AI_API_URL || 'https://creative-strategist-agent.onrender.com/api/v1',
  streamTimeout: 180000, // 3 minutes - AI operations can take time
  retryAttempts: 3,
};

/**
 * Stream chat messages to the AI Agent backend
 * @param payload Chat request payload
 * @param onEvent Callback for each streaming event
 * @param config Optional configuration override
 */
export async function streamChat(
  payload: ChatRequest,
  onEvent: (event: StreamEvent) => void,
  config: Partial<AIConfig> = {}
): Promise<void> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const controller = new AbortController();
  
  // Set timeout
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, finalConfig.streamTimeout);

  try {
    const response = await fetch(`${finalConfig.apiBaseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AI Agent API error: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            clearTimeout(timeoutId);
            return;
          }

          try {
            const event = JSON.parse(data) as StreamEvent;
            onEvent(event);
          } catch (parseError) {
            console.error('Error parsing event:', parseError, 'Data:', data);
          }
        }
      }
    }
    
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('AI Agent request timed out');
      }
      throw error;
    }
    throw new Error('Unknown error during AI Agent streaming');
  }
}

/**
 * Test connection to AI Agent backend
 */
export async function testAIConnection(config: Partial<AIConfig> = {}): Promise<boolean> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const response = await fetch(`${finalConfig.apiBaseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('AI Agent connection test failed:', error);
    return false;
  }
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique thread ID
 */
export function generateThreadId(): string {
  return `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

