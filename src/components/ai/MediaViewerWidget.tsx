"use client";

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MediaViewerWidgetProps {
  mediaUrl: string;
  mediaType: 'video' | 'image';
  adName?: string;
}

export function MediaViewerWidget({ mediaUrl, mediaType, adName }: MediaViewerWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    console.log('📺 MediaViewerWidget:', { mediaUrl, mediaType, adName });
    setHasError(false); // Reset error state when URL changes
    setRetryCount(0); // Reset retry count
  }, [mediaUrl, mediaType, adName]);

  if (!mediaUrl) return null;
  
  // Try adding cache buster if we've had errors
  const imageUrlWithRetry = retryCount > 0 ? `${mediaUrl}?retry=${retryCount}` : mediaUrl;

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
          {hasError ? (
            <div className="flex flex-col items-center justify-center gap-3 text-white p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <p className="text-xs">Failed to load {mediaType}</p>
              <a 
                href={mediaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline break-all"
              >
                Open in new tab
              </a>
            </div>
          ) : mediaType === 'video' ? (
            <video
              src={mediaUrl}
              controls
              className="w-full h-full object-contain rounded"
              preload="metadata"
              onError={(e) => {
                console.error('❌ Video load error:', e);
                setHasError(true);
              }}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              key={imageUrlWithRetry} // Force reload on retry
              src={imageUrlWithRetry}
              alt={adName || "Original Ad"}
              className="w-full h-full object-contain rounded"
              crossOrigin="anonymous"
              onError={(e) => {
                console.error('❌ Image load error (attempt ' + (retryCount + 1) + '):', {
                  url: imageUrlWithRetry,
                  originalUrl: mediaUrl,
                  error: e,
                  target: e.target as HTMLImageElement
                });
                
                // Try once more without crossOrigin
                if (retryCount === 0) {
                  console.log('🔄 Retrying without crossOrigin...');
                  setRetryCount(1);
                } else {
                  console.error('❌ All retry attempts failed');
                  setHasError(true);
                }
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', imageUrlWithRetry);
                if (retryCount > 0) {
                  console.log('✅ Loaded after retry attempt:', retryCount);
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

