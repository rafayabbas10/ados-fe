"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2,
  FileImage,
  Sparkles
} from "lucide-react";
import { ImageBlock } from "@/types";

interface ImageBuilderProps {
  blocks: ImageBlock[];
  onUpdateBlocks: (blocks: ImageBlock[]) => void;
  loadingTargets?: Set<string>;
  selectedBlocks?: string[];
  onToggleBlock?: (blockId: string, blockDetail?: {id: string; order: number; text: string; design_notes: string}) => void;
  recentlyUpdatedBlocks?: Set<string>;
}

// Auto-resize textarea component
const AutoResizeTextarea = ({ value, onChange, placeholder, className }: { 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; 
  placeholder?: string; 
  className?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      rows={1}
      style={{ overflow: 'hidden' }}
    />
  );
};

export function ImageBuilder({
  blocks,
  onUpdateBlocks,
  loadingTargets = new Set(),
  selectedBlocks = [],
  onToggleBlock,
  recentlyUpdatedBlocks = new Set()
}: ImageBuilderProps) {

  const handleAddBlock = () => {
    const newBlock: ImageBlock = {
      id: `block-${Date.now()}`,
      element: 'Headline',
      position: 'Top Center',
      content_type: 'Text',
      text: '',
      design_notes: '',
      order: blocks.length + 1
    };

    onUpdateBlocks([...blocks, newBlock]);
  };

  const handleUpdateBlock = (blockId: string | number, field: keyof ImageBlock, value: string) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, [field]: value } : block
    );

    onUpdateBlocks(updatedBlocks);
  };

  const handleDeleteBlock = (blockId: string | number) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId);
    onUpdateBlocks(updatedBlocks);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card bg-card border">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileImage className="w-6 h-6 text-primary" />
              <div>
                <h3 className="text-xl font-semibold text-foreground">Image Builder</h3>
                <p className="text-sm text-muted-foreground">Edit and manage your image ad elements</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs px-3 py-1">
                {blocks.length} {blocks.length === 1 ? 'Element' : 'Elements'}
              </Badge>
              <Button 
                onClick={handleAddBlock} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Element
              </Button>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[50px_140px_120px_120px_1fr_1fr_50px] gap-3 px-4 py-2.5 bg-muted/50 rounded-lg text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border border-border/50">
            <div className="flex items-center justify-center"></div>
            <div className="flex items-center">Element</div>
            <div className="flex items-center">Position</div>
            <div className="flex items-center">Type</div>
            <div className="flex items-center">Text Content</div>
            <div className="flex items-center">Design Notes</div>
            <div className="flex items-center justify-center"></div>
          </div>

          {/* Blocks Container */}
          <div className="space-y-3 mt-4">
            {blocks.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
                <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No image elements yet</p>
                <Button onClick={handleAddBlock} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Element
                </Button>
              </div>
            ) : (
              blocks.map((block, index) => {
                const blockId = block.id.toString();
                const isBlockLoading = loadingTargets.has(`block-${blockId}`);
                const isBlockSelected = selectedBlocks.includes(blockId);
                const wasRecentlyUpdated = recentlyUpdatedBlocks.has(blockId);
                
                return (
                  <div 
                    key={block.id}
                    data-block-id={block.id}
                    className={`grid grid-cols-[50px_140px_120px_120px_1fr_1fr_50px] gap-3 items-start px-4 py-3 border rounded-lg transition-all relative cursor-pointer ${
                      isBlockSelected 
                        ? 'bg-primary/5 border-primary border-2 shadow-md' 
                        : 'bg-card border-border hover:bg-muted/20 hover:border-primary/30'
                    }`}
                    onClick={() => onToggleBlock?.(blockId, {
                      id: blockId,
                      order: block.order || index + 1,
                      text: block.text,
                      design_notes: block.design_notes
                    })}
                  >
                    {/* Block Loading Animation */}
                    {isBlockLoading && (
                      <>
                        <div className="absolute inset-0 rounded-lg overflow-hidden z-10 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/15 to-transparent animate-shimmer" />
                        </div>
                        
                        <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/95 backdrop-blur-sm text-primary-foreground text-xs font-medium shadow-xl border border-primary-foreground/20">
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>AI Processing</span>
                        </div>
                      </>
                    )}
                    
                    {/* Completion Animation */}
                    {wasRecentlyUpdated && !isBlockLoading && (
                      <>
                        <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/95 backdrop-blur-sm text-primary-foreground text-xs font-medium shadow-xl border border-primary-foreground/20 animate-in fade-in slide-in-from-top-2 duration-500">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-30" />
                            <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-in zoom-in duration-300 delay-150" />
                          </svg>
                          <span>Updated</span>
                        </div>
                        
                        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-[5]">
                          <div className="absolute inset-0 border-2 border-primary/30 rounded-lg animate-ping" style={{ animationDuration: '1.5s' }} />
                        </div>
                      </>
                    )}
                    
                    {/* Element Number with Checkbox */}
                    <div className="flex flex-col items-center justify-start gap-2 pt-1">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isBlockSelected 
                          ? 'bg-primary border-primary' 
                          : 'border-muted-foreground/40 hover:border-primary'
                      }`}>
                        {isBlockSelected && (
                          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 border border-primary/20">
                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                      </div>
                    </div>

                    {/* Element Type */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <AutoResizeTextarea
                        value={block.element}
                        onChange={(e) => handleUpdateBlock(block.id, 'element', e.target.value)}
                        placeholder="Enter element..."
                        className="w-full min-h-[36px] text-xs border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors font-medium leading-snug"
                      />
                    </div>

                    {/* Position */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <AutoResizeTextarea
                        value={block.position}
                        onChange={(e) => handleUpdateBlock(block.id, 'position', e.target.value)}
                        placeholder="Enter position..."
                        className="w-full min-h-[36px] text-xs border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors leading-snug"
                      />
                    </div>

                    {/* Content Type */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <AutoResizeTextarea
                        value={block.content_type}
                        onChange={(e) => handleUpdateBlock(block.id, 'content_type', e.target.value)}
                        placeholder="Enter type..."
                        className="w-full min-h-[36px] text-xs border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors leading-snug"
                      />
                    </div>

                    {/* Text Content */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <AutoResizeTextarea
                        value={block.text}
                        onChange={(e) => handleUpdateBlock(block.id, 'text', e.target.value)}
                        placeholder="Enter text content..."
                        className="w-full min-h-[60px] text-sm border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors leading-relaxed"
                      />
                    </div>

                    {/* Design Notes */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <AutoResizeTextarea
                        value={block.design_notes}
                        onChange={(e) => handleUpdateBlock(block.id, 'design_notes', e.target.value)}
                        placeholder="Design notes..."
                        className="w-full min-h-[60px] text-sm border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors leading-relaxed"
                      />
                    </div>

                    {/* Delete Button */}
                    <div className="flex items-start justify-center pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBlock(block.id);
                        }}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

