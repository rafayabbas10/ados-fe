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
  GripVertical,
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
  onActiveVariationChange
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
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-foreground mb-1">Script Builder</h3>
            <p className="text-sm text-muted-foreground">Build modular ad scripts with AI-assisted blocks</p>
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

          {/* Script Blocks Table */}
          {variations.map((variation) => (
            activeVariation === variation.id && (
              <div key={variation.id} className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-muted/50 rounded-lg text-xs font-medium text-muted-foreground">
                  <div className="col-span-1"></div>
                  <div className="col-span-1">Scene</div>
                  <div className="col-span-2">Script Line</div>
                  <div className="col-span-1">Audio</div>
                  <div className="col-span-2">Visual Description</div>
                  <div className="col-span-2">Storyboard</div>
                  <div className="col-span-2">Text Overlay</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Table Rows */}
                <div className="space-y-2">
                  {variation.blocks.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
                      <p className="text-muted-foreground mb-4">No script blocks yet</p>
                      <Button onClick={() => handleAddBlock(variation.id)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Block
                      </Button>
                    </div>
                  ) : (
                    variation.blocks.map((block, index) => (
                      <div key={block.id} className="grid grid-cols-12 gap-3 items-start p-3 bg-card border rounded-lg hover:bg-muted/30 transition-colors min-h-[60px]">
                        {/* Drag Handle */}
                        <div className="col-span-1 flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move -ml-3" />
                        </div>

                        {/* Scene Number */}
                        <div className="col-span-1 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {index + 1}
                            </span>
                          </div>
                        </div>

                        {/* Script Line */}
                        <div className="col-span-2">
                          <AutoResizeTextarea
                            value={block.scriptLine}
                            onChange={(e) => handleUpdateBlock(variation.id, block.id, 'scriptLine', e.target.value)}
                            placeholder="Enter script line..."
                            className="w-full min-h-[36px] text-sm border-0 bg-transparent hover:bg-muted focus:bg-muted rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          />
                        </div>

                        {/* Audio */}
                        <div className="col-span-1">
                          <Select
                            value={block.audioType}
                            onValueChange={(value) => handleUpdateBlock(variation.id, block.id, 'audioType', value)}
                          >
                            <SelectTrigger className="h-9 text-sm border-0 bg-transparent hover:bg-muted">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {audioTypes.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Visual Description */}
                        <div className="col-span-2">
                          <AutoResizeTextarea
                            value={block.sceneDescription}
                            onChange={(e) => handleUpdateBlock(variation.id, block.id, 'sceneDescription', e.target.value)}
                            placeholder="Describe the visual..."
                            className="w-full min-h-[36px] text-sm border-0 bg-transparent hover:bg-muted focus:bg-muted rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          />
                        </div>

                        {/* Storyboard */}
                        <div className="col-span-2">
                          {block.visualInspo ? (
                            <div className="flex items-center gap-2">
                              <a 
                                href={block.visualInspo} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="relative w-20 h-14 rounded overflow-hidden bg-muted flex-shrink-0 hover:opacity-80 transition-opacity"
                              >
                                <img 
                                  src={block.visualInspo} 
                                  alt="Storyboard thumbnail"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </a>
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground truncate">
                                  {block.visualInspo.length > 30 
                                    ? `...${block.visualInspo.slice(-30)}` 
                                    : block.visualInspo}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                  onClick={() => handleUpdateBlock(variation.id, block.id, 'visualInspo', '')}
                                  title="Remove"
                                >
                                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 text-xs w-full"
                              onClick={() => {
                                const url = prompt('Enter image/video URL:');
                                if (url) {
                                  handleUpdateBlock(variation.id, block.id, 'visualInspo', url);
                                }
                              }}
                            >
                              <Film className="w-3 h-3 mr-1" />
                              Pick Clip
                            </Button>
                          )}
                        </div>

                        {/* Text Overlay */}
                        <div className="col-span-2">
                          <AutoResizeTextarea
                            value={block.textOverlays.join(', ')}
                            onChange={(e) => handleUpdateTextOverlay(variation.id, block.id, e.target.value)}
                            placeholder="Text overlays..."
                            className="w-full min-h-[36px] text-sm border-0 bg-transparent hover:bg-muted focus:bg-muted rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          />
                        </div>

                        {/* Delete */}
                        <div className="col-span-1 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBlock(variation.id, block.id)}
                            className="h-9 w-9 p-0 hover:bg-red-500/10 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
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
