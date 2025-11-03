"use client";

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaViewerWidgetProps {
  mediaUrl: string;
  mediaType: 'video' | 'image';
  adName?: string;
}

export function MediaViewerWidget({ mediaUrl, mediaType, adName }: MediaViewerWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!mediaUrl) return null;

  return (
    <div
      className={cn(
        "fixed z-40 bg-card border-2 border-border shadow-2xl rounded-lg overflow-hidden transition-all duration-300",
        isExpanded ? "w-[320px] h-[500px]" : "w-[280px] h-[40px]"
      )}
      style={{ bottom: '16px', right: '32px' }}
    >
      {/* Header Bar */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0"></div>
          <span className="font-semibold text-xs text-foreground truncate">Original Ad</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>

      {/* Media Content */}
      {isExpanded && (
        <div className="bg-black flex items-center justify-center h-[calc(100%-40px)] p-2">
          {mediaType === 'video' ? (
            <video
              src={mediaUrl}
              controls
              className="w-full h-full object-contain rounded"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={mediaUrl}
              alt={adName || "Original Ad"}
              className="w-full h-full object-contain rounded"
            />
          )}
        </div>
      )}
    </div>
  );
}

