"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  Copy, 
  Send, 
  Edit3,
  Film
} from "lucide-react";

export interface ScriptBlock {
  id: string;
  type: string;
  scriptLine: string;
  audioType: string;
  sceneDescription: string;
  visualInspo: string;
  textOverlays: string[];
  order: number;
}

export interface ScriptVariation {
  id: string;
  name: string;
  status: 'primary' | 'draft' | 'ready';
  blocks: ScriptBlock[];
}

interface ScriptVariationsProps {
  variations: ScriptVariation[];
  onUpdateVariation: (variationId: string, blocks: ScriptBlock[]) => void;
  onDeleteVariation: (variationId: string) => void;
  onCloneVariation: (variationId: string) => void;
  onSetPrimary: (variationId: string) => void;
  onPushToProduction: (variationId: string) => void;
  onAddVariation: () => void;
  showMetadata: boolean;
  setShowMetadata: (show: boolean) => void;
  generateNamingConvention: () => string;
  activeVariation?: string;
  onActiveVariationChange?: (variationId: string) => void;
  loadingTargets?: Set<string>;
  selectedBlocks?: string[];
  onToggleBlock?: (blockId: string, blockDetail?: {id: string; order: number; scriptLine: string; sceneDescription: string}) => void;
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

export function ScriptVariations({
  variations,
  onUpdateVariation,
  onDeleteVariation,
  onCloneVariation,
  onSetPrimary,
  onPushToProduction,
  onAddVariation,
  showMetadata,
  setShowMetadata,
  generateNamingConvention,
  activeVariation: externalActiveVariation,
  onActiveVariationChange,
  loadingTargets = new Set(),
  selectedBlocks = [],
  onToggleBlock,
  recentlyUpdatedBlocks = new Set()
}: ScriptVariationsProps) {
  const [internalActiveVariation, setInternalActiveVariation] = useState(variations[0]?.id || '');
  
  const activeVariation = externalActiveVariation !== undefined ? externalActiveVariation : internalActiveVariation;
  const setActiveVariation = onActiveVariationChange || setInternalActiveVariation;

  const blockTypes = [
    { value: 'Curiosity/Intrigue Hook', label: 'Curiosity', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
    { value: 'Summarized Problem', label: 'Empathy', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
    { value: 'Primary Benefit', label: 'Discover', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    { value: 'Credibility', label: 'After', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
    { value: 'CTA (Call to Action)', label: 'CTA', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
    { value: 'Empathy', label: 'Empathy', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
    { value: 'After', label: 'After', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
    { value: 'Closer', label: 'Closer', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' }
  ];

  const audioTypes = [
    'Creator VO',
    'Messaging',
    'Message + VO',
    'Product visual moment'
  ];

  const getBlockTypeColor = (type: string) => {
    const blockType = blockTypes.find(bt => bt.value === type);
    return blockType?.color || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  };

  const getBlockTypeLabel = (type: string) => {
    const blockType = blockTypes.find(bt => bt.value === type);
    return blockType?.label || type;
  };

  const handleAddBlock = (variationId: string) => {
    const variation = variations.find(v => v.id === variationId);
    if (!variation) return;

    const newBlock: ScriptBlock = {
      id: `block-${Date.now()}`,
      type: 'Curiosity/Intrigue Hook',
      scriptLine: '',
      audioType: 'Creator VO',
      sceneDescription: '',
      visualInspo: '',
      textOverlays: [],
      order: variation.blocks.length + 1
    };

    onUpdateVariation(variationId, [...variation.blocks, newBlock]);
  };

  const handleUpdateBlock = (variationId: string, blockId: string, field: keyof ScriptBlock, value: string | string[]) => {
    const variation = variations.find(v => v.id === variationId);
    if (!variation) return;

    const updatedBlocks = variation.blocks.map(block =>
      block.id === blockId ? { ...block, [field]: value } : block
    );

    onUpdateVariation(variationId, updatedBlocks);
  };

  const handleDeleteBlock = (variationId: string, blockId: string) => {
    const variation = variations.find(v => v.id === variationId);
    if (!variation) return;

    const updatedBlocks = variation.blocks.filter(block => block.id !== blockId);
    onUpdateVariation(variationId, updatedBlocks);
  };

  const handleUpdateTextOverlay = (variationId: string, blockId: string, value: string) => {
    const variation = variations.find(v => v.id === variationId);
    if (!variation) return;

    const updatedBlocks = variation.blocks.map(block =>
      block.id === blockId 
        ? { ...block, textOverlays: value ? value.split(',').map(s => s.trim()) : [] }
        : block
    );

    onUpdateVariation(variationId, updatedBlocks);
  };

  const getStatusColor = (status: ScriptVariation['status']) => {
    switch (status) {
      case 'primary': return 'bg-green-500 text-white';
      case 'ready': return 'bg-blue-500 text-white';
      case 'draft': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card bg-card border">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-1">Script Builder</h3>
              <p className="text-sm text-muted-foreground">Build modular ad scripts with AI-assisted blocks</p>
            </div>
            <Button
              onClick={() => onPushToProduction(activeVariation)}
              size="sm"
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Push to Production
            </Button>
          </div>

          {/* Tabs and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {variations.map((variation) => (
                <Button
                  key={variation.id}
                  variant={activeVariation === variation.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveVariation(variation.id)}
                  className={`gap-2 ${activeVariation === variation.id ? 'bg-primary' : ''}`}
                >
                  {variation.name}
                  <Badge className={`${getStatusColor(variation.status)} text-xs px-2 py-0 border-0`}>
                    {variation.status === 'primary' ? 'Primary' : variation.status}
                  </Badge>
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={onAddVariation}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Variation
              </Button>
            </div>

            <div className="flex gap-2">
              {variations.find(v => v.id === activeVariation)?.status !== 'primary' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSetPrimary(activeVariation)}
                >
                  Set as Primary
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCloneVariation(activeVariation)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Clone
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const variation = variations.find(v => v.id === activeVariation);
                  if (variation) {
                    const newName = prompt('Enter new name:', variation.name);
                    if (newName) {
                      // This would need a new handler, for now we'll use a placeholder
                      console.log('Rename to:', newName);
                    }
                  }
                }}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Rename
              </Button>
            </div>
          </div>

          {/* Script Blocks */}
          {variations.map((variation) => (
            activeVariation === variation.id && (
              <div key={variation.id} className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-[50px_120px_1fr_140px_1fr_90px_1fr_50px] gap-3 px-4 py-2.5 bg-muted/50 rounded-lg text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border border-border/50">
                  <div className="flex items-center justify-center"></div>
                  <div className="flex items-center">Block Type</div>
                  <div className="flex items-center">Script Line</div>
                  <div className="flex items-center">Audio</div>
                  <div className="flex items-center">Visual Description</div>
                  <div className="flex items-center">Storyboard</div>
                  <div className="flex items-center">Text Overlays</div>
                  <div className="flex items-center justify-center"></div>
                </div>

                {/* Blocks Container */}
                <div className="space-y-3">
                  {variation.blocks.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
                      <p className="text-muted-foreground mb-4">No script blocks yet</p>
                      <Button onClick={() => handleAddBlock(variation.id)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Block
                      </Button>
                    </div>
                  ) : (
                    variation.blocks.map((block, index) => {
                      const isBlockLoading = loadingTargets.has(`block-${block.id}`);
                      const isBlockSelected = selectedBlocks.includes(block.id);
                      const wasRecentlyUpdated = recentlyUpdatedBlocks.has(block.id);
                      return (
                      <div 
                        key={block.id}
                        data-block-id={block.id}
                        className={`grid grid-cols-[50px_120px_1fr_140px_1fr_90px_1fr_50px] gap-3 items-start px-4 py-3 border rounded-lg transition-all relative cursor-pointer ${
                          isBlockSelected 
                            ? 'bg-primary/5 border-primary border-2 shadow-md' 
                            : 'bg-card border-border hover:bg-muted/20 hover:border-primary/30'
                        }`}
                        onClick={() => onToggleBlock?.(block.id, {
                          id: block.id,
                          order: block.order,
                          scriptLine: block.scriptLine,
                          sceneDescription: block.sceneDescription
                        })}
                      >
                        {/* Block Loading Animation */}
                        {isBlockLoading && (
                          <>
                            {/* Animated Border Glow */}
                            <div className="absolute inset-0 rounded-lg overflow-hidden z-10 pointer-events-none">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/15 to-transparent animate-shimmer" />
                            </div>
                            
                            {/* Modern Loading Badge */}
                            <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/95 backdrop-blur-sm text-primary-foreground text-xs font-medium shadow-xl border border-primary-foreground/20">
                              {/* Animated Spinner */}
                              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>AI Processing</span>
                            </div>
                            
                            {/* Pulsing Particles */}
                            {[...Array(4)].map((_, i) => {
                              const positions = ['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'];
                              const delay = i * 200;
                              
                              return (
                                <div
                                  key={i}
                                  className={`absolute ${positions[i]} z-10 pointer-events-none`}
                                  style={{
                                    animation: `particlePulse 1.5s ease-in-out ${delay}ms infinite`,
                                  }}
                                >
                                  <div className="w-2 h-2 rounded-full bg-primary/60 shadow-lg" />
                                </div>
                              );
                            })}
                          </>
                        )}
                        
                        {/* Completion Animation */}
                        {wasRecentlyUpdated && !isBlockLoading && (
                          <>
                            {/* Success Badge */}
                            <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/95 backdrop-blur-sm text-primary-foreground text-xs font-medium shadow-xl border border-primary-foreground/20 animate-in fade-in slide-in-from-top-2 duration-500">
                              {/* Checkmark with Circle */}
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-30" />
                                <path d="M8 12.5l2.5 2.5 5.5-5.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-in zoom-in duration-300 delay-150" />
                              </svg>
                              <span>Updated</span>
                            </div>
                            
                            {/* Elegant Sparkles from Edges */}
                            {[...Array(8)].map((_, i) => {
                              const edgePositions = [
                                'top-0 left-[10%]',
                                'top-0 right-[10%]',
                                'bottom-0 left-[10%]',
                                'bottom-0 right-[10%]',
                                'top-[30%] left-0',
                                'top-[30%] right-0',
                                'bottom-[30%] left-0',
                                'bottom-[30%] right-0',
                              ];
                              const delay = i * 80;
                              
                              return (
                                <div
                                  key={i}
                                  className={`absolute ${edgePositions[i]} z-10 pointer-events-none`}
                                  style={{
                                    animation: `sparkleFlow${i % 4} 1.8s ease-out ${delay}ms forwards`,
                                  }}
                                >
                                  {/* Diamond Sparkle */}
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                                    <path 
                                      d="M12 2 L16 12 L12 22 L8 12 Z" 
                                      fill="hsl(var(--primary))"
                                      opacity="0.7"
                                    />
                                    <path 
                                      d="M2 12 L12 8 L22 12 L12 16 Z" 
                                      fill="hsl(var(--primary))"
                                      opacity="0.5"
                                    />
                                  </svg>
                                </div>
                              );
                            })}
                            
                            {/* Ripple Effect */}
                            <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-[5]">
                              <div className="absolute inset-0 border-2 border-primary/30 rounded-lg animate-ping" style={{ animationDuration: '1.5s' }} />
                            </div>
                            
                            {/* Subtle Glow */}
                            <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-[4]">
                              <div className="absolute inset-0 bg-primary/8" style={{ animation: 'fadeOut 2s forwards' }} />
                            </div>
                          </>
                        )}
                        
                        {/* Scene Number with Checkbox */}
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

                        {/* Block Type */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={block.type}
                            onValueChange={(value) => handleUpdateBlock(variation.id, block.id, 'type', value)}
                          >
                            <SelectTrigger className={`h-auto min-h-[36px] py-1.5 px-2 text-xs border ${getBlockTypeColor(block.type)} font-medium`}>
                              <SelectValue>
                                <span className="whitespace-normal text-left break-words leading-snug">
                                  {getBlockTypeLabel(block.type)}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="w-[200px]">
                              {blockTypes.map(type => (
                                <SelectItem key={type.value} value={type.value} className="py-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${type.color}`}>
                                    {type.label}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Script Line */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <AutoResizeTextarea
                            value={block.scriptLine}
                            onChange={(e) => handleUpdateBlock(variation.id, block.id, 'scriptLine', e.target.value)}
                            placeholder="Enter script line..."
                            className="w-full min-h-[60px] text-sm border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors leading-relaxed"
                          />
                        </div>

                        {/* Audio Type */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={block.audioType}
                            onValueChange={(value) => handleUpdateBlock(variation.id, block.id, 'audioType', value)}
                          >
                            <SelectTrigger className="h-9 text-xs border-0 bg-transparent hover:bg-muted/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {audioTypes.map(type => (
                                <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Visual Description */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <AutoResizeTextarea
                            value={block.sceneDescription}
                            onChange={(e) => handleUpdateBlock(variation.id, block.id, 'sceneDescription', e.target.value)}
                            placeholder="Describe visual..."
                            className="w-full min-h-[60px] text-sm border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors leading-relaxed"
                          />
                        </div>

                        {/* Storyboard - 9:16 Aspect Ratio */}
                        <div className="flex items-start justify-center" onClick={(e) => e.stopPropagation()}>
                          {block.visualInspo ? (
                            <div className="relative group">
                              <a 
                                href={block.visualInspo} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block w-[50px] h-[90px] rounded-md overflow-hidden bg-muted hover:opacity-90 transition-opacity border border-border shadow-sm"
                                title="View storyboard"
                              >
                                <img 
                                  src={block.visualInspo} 
                                  alt="Storyboard"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </a>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full bg-red-500/90 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                onClick={() => handleUpdateBlock(variation.id, block.id, 'visualInspo', '')}
                                title="Remove"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-[90px] w-[50px] p-1 text-xs border-dashed border-2 hover:bg-primary/5 hover:border-primary flex flex-col items-center justify-center gap-1"
                              onClick={() => {
                                const url = prompt('Enter image/video URL:');
                                if (url) {
                                  handleUpdateBlock(variation.id, block.id, 'visualInspo', url);
                                }
                              }}
                              title="Add storyboard"
                            >
                              <Film className="w-4 h-4" />
                              <span className="text-[9px] leading-tight text-center">Add</span>
                            </Button>
                          )}
                        </div>

                        {/* Text Overlays */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <AutoResizeTextarea
                            value={block.textOverlays.join(', ')}
                            onChange={(e) => handleUpdateTextOverlay(variation.id, block.id, e.target.value)}
                            placeholder="Text overlays..."
                            className="w-full min-h-[60px] text-sm border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors leading-relaxed"
                          />
                        </div>

                        {/* Delete Button */}
                        <div className="flex items-start justify-center pt-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBlock(variation.id, block.id)}
                            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                            title="Delete block"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>

                {/* Add Block Button */}
                {variation.blocks.length > 0 && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => handleAddBlock(variation.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Block
                    </Button>
                  </div>
                )}
              </div>
            )
          ))}
        </div>
      </Card>
    </div>
  );
}
