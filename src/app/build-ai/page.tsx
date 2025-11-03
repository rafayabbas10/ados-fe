"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { useAccount } from "@/contexts/AccountContext";
import { AIAgentProvider, useAIAgent } from "@/contexts/AIAgentContext";
import { ScriptVariations, ScriptVariation } from "@/components/ui/ScriptVariations";
import { Creative } from "@/services/creativesService";
import { fetchVideoScenes, fetchAdDetails } from "@/services/adDetailsService";
import { fetchVariableSelectorOptions, VariableSelectorOptions } from "@/services/variableSelectorService";
import { VideoScene, HookVariation, VideoSceneVariation } from "@/types";
import { streamChat } from "@/services/aiAgentService";
import { StreamEvent, UICommand, InitializeBriefCommand, UpdateElementCommand, UpdateBlocksCommand, ShowLoadingCommand, HighlightElementCommand, StartBlockLoadingCommand, ElementKey, BriefInitializationData, UpdatedBlocksEvent } from "@/types/ai";
import {
  EmptyBriefState,
  BriefBuilderHeader,
  ChatPanel,
  ResizableLayout,
  SelectableElementField,
  LoadingOverlay,
  MediaViewerWidget,
} from "@/components/ai";

interface BriefData {
  id: string;
  title: string;
  creativeId?: number;
  avatar?: string;
  awarenessLevel?: string;
  angle?: string;
  format?: string;
  theme?: string;
  scriptBlocks?: ScriptBlock[];
}

interface ScriptBlock {
  id: string;
  type: string;
  scriptLine: string;
  audioType: string;
  sceneDescription: string;
  visualInspo: string;
  textOverlays: string[];
  order: number;
}

interface BriefBuilderData {
  adId: string;
  adName: string;
  videoScenes: VideoScene[];
  variationType: string;
  selectedHooks?: HookVariation[];
  variationBlocks?: VideoSceneVariation[];
  adAnalysis?: {
    avatar?: string;
    market_awareness?: string;
    angle?: string;
    format?: string;
    theme?: string;
    tonality?: string;
    video_content_link?: string;
  };
}

function BriefBuilderContent() {
  const { selectedAccountId } = useAccount();
  const searchParams = useSearchParams();
  const router = useRouter();
  const creativeId = searchParams.get('creativeId');
  
  const {
    selectedAdId,
    adName,
    setAdContext,
    layoutMode,
    setLayoutMode,
    initializeAI,
    resetAI,
    loadingTargets,
    addLoadingTarget,
    removeLoadingTarget,
    triggerElementSuccess,
    threadId,
    sessionId,
    selectedBlocks,
    toggleBlock,
  } = useAIAgent();
  
  const [selectedBrief, setSelectedBrief] = useState<BriefData | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [activeVariation, setActiveVariation] = useState('var-1');
  const [adThumbnail, setAdThumbnail] = useState<string>('');
  const [adFormat, setAdFormat] = useState<string>('');
  
  // Variable selector states
  const [briefName, setBriefName] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [avatar, setAvatar] = useState("");
  const [awarenessLevel, setAwarenessLevel] = useState("");
  const [angle, setAngle] = useState("");
  const [format, setFormat] = useState("");
  const [theme, setTheme] = useState("");
  const [tonality, setTonality] = useState("");
  
  // Variable selector options from webhook
  const [variableOptions, setVariableOptions] = useState<VariableSelectorOptions>({
    avatar: [],
    market_awareness: [],
    angle: [],
    format: [],
    theme: [],
    tonality: []
  });
  const [optionsLoading, setOptionsLoading] = useState(false);
  
  const [scriptVariations, setScriptVariations] = useState<ScriptVariation[]>([
    {
      id: 'var-1',
      name: 'Version A',
      status: 'primary' as const,
      blocks: []
    }
  ]);
  
  // Ref to track last updated element for loading states
  const lastUpdatedElementRef = useRef<ElementKey | null>(null);
  
  // Ref to track if we just received blocks (to prevent redundant SHOW_LOADING)
  const justReceivedBlocksRef = useRef<boolean>(false);
  
  // Track recently updated blocks for animations and badges
  const [recentlyUpdatedBlocks, setRecentlyUpdatedBlocks] = useState<Set<string>>(new Set());

  // Helper function to build brief initialization data
  const buildBriefData = useCallback((
    blocks: ScriptBlock[],
    elements?: {
      avatar?: string;
      awarenessLevel?: string;
      angle?: string;
      format?: string;
      theme?: string;
      tonality?: string;
    }
  ): BriefInitializationData => {
    return {
      elements: {
        avatar: elements?.avatar || undefined,
        awareness: elements?.awarenessLevel || undefined,
        angle: elements?.angle || undefined,
        format: elements?.format || undefined,
        theme: elements?.theme || undefined,
        tonality: elements?.tonality || undefined,
      },
      script_blocks: blocks.map(block => ({
        scene_no: block.order,
        block_type: block.type,
        script: block.scriptLine,
        visual_description: block.sceneDescription,
        text_overlay: block.textOverlays && block.textOverlays.length > 0 ? block.textOverlays[0] : undefined,
      })),
    };
  }, []);

  // Load creative data when component mounts or creativeId changes
  useEffect(() => {
    if (creativeId) {
      const creativeData = localStorage.getItem('selectedCreative');
      if (creativeData) {
        const creative: Creative = JSON.parse(creativeData);
        populateFromCreative(creative);
        localStorage.removeItem('selectedCreative');
      }
    }
  }, [creativeId]);

  // Load variation data from session storage
  useEffect(() => {
    const briefData = sessionStorage.getItem('briefBuilderData');
    if (briefData) {
      try {
        const data = JSON.parse(briefData);
        console.log('📊 Brief Builder Data:', data);
        
        if (data.variationType === 'v1') {
          populateFromHookVariations(data);
        } else if (['v2', 'v3', 'v4', 'v5'].includes(data.variationType)) {
          populateFromVideoVariations(data);
        }
        
        sessionStorage.removeItem('briefBuilderData');
      } catch (error) {
        console.error('Error parsing brief builder data:', error);
      }
    }
  }, []);

  // Fetch variable selector options when account changes
  useEffect(() => {
    const loadVariableOptions = async () => {
      if (!selectedAccountId) return;
      
      setOptionsLoading(true);
      try {
        const options = await fetchVariableSelectorOptions(selectedAccountId);
        setVariableOptions(options);
      } catch (error) {
        console.error('Error loading variable selector options:', error);
        toast.error('Failed to load dropdown options');
      } finally {
        setOptionsLoading(false);
      }
    };

    loadVariableOptions();
  }, [selectedAccountId]);

  // Handler for v1 - Hook variations
  const populateFromHookVariations = (data: BriefBuilderData) => {
    setBriefName(data.adName || 'Hook Variation Brief');
    
    if (data.adAnalysis) {
      setAvatar(data.adAnalysis.avatar || '');
      setAwarenessLevel(data.adAnalysis.market_awareness || '');
      setAngle(data.adAnalysis.angle || '');
      setFormat(data.adAnalysis.format || 'UGC Video');
      setTheme(data.adAnalysis.theme || '');
      setTonality(data.adAnalysis.tonality || '');
      setAdFormat(data.adAnalysis.format || 'UGC Video');
    }

    const newVariations: ScriptVariation[] = (data.selectedHooks || []).map((hook, index: number) => {
      const scenesToReplace = parseScenesToReplace(hook.replace_scenes);
      
      const blocks = data.videoScenes.map((scene: VideoScene, sceneIndex: number) => {
        const shouldReplace = scenesToReplace.includes(scene.scene);
        
        if (shouldReplace) {
          return {
            id: `block-${Date.now()}-${sceneIndex + 1}-hook-${hook.id}`,
            type: 'Curiosity/Intrigue Hook',
            scriptLine: hook.script || '',
            audioType: 'Creator VO',
            sceneDescription: hook.visual || '',
            visualInspo: data.adAnalysis?.video_content_link || '',
            textOverlays: hook.text_overlay ? [hook.text_overlay] : [],
            order: sceneIndex + 1
          };
        } else {
          return {
            id: `block-${Date.now()}-${sceneIndex + 1}`,
            type: getBlockTypeFromScene(scene, sceneIndex, data.videoScenes.length),
            scriptLine: scene.script || scene.description || '',
            audioType: 'Creator VO',
            sceneDescription: scene.description || scene.visual || scene.visual_elements || '',
            visualInspo: scene.screenshot_url || scene.thumbnail_url || '',
            textOverlays: scene.text_overlay ? [scene.text_overlay] : [],
            order: sceneIndex + 1
          };
        }
      });

      const status: 'primary' | 'draft' = index === 0 ? 'primary' : 'draft';
      return {
        id: `var-hook-${hook.id}`,
        name: `Hook ${hook.hook_num}`,
        status: status,
        blocks: blocks
      };
    });

    setScriptVariations(newVariations);
    setActiveVariation(newVariations[0]?.id || 'var-1');
    
    // Initialize AI with ad context and brief data
    if (data.adId && selectedAccountId && newVariations[0]?.blocks) {
      setAdContext(data.adId, data.adName);
      const briefData = buildBriefData(newVariations[0].blocks, {
        avatar: data.adAnalysis?.avatar,
        awarenessLevel: data.adAnalysis?.market_awareness,
        angle: data.adAnalysis?.angle,
        format: data.adAnalysis?.format || 'UGC Video',
        theme: data.adAnalysis?.theme,
        tonality: data.adAnalysis?.tonality,
      });
      initializeAI(data.adId, selectedAccountId, briefData);
    }
  };

  // Handler for v2-v5 - Video scene variations
  const populateFromVideoVariations = (data: BriefBuilderData) => {
    setBriefName(data.adName || `${data.variationType.toUpperCase()} Variation Brief`);
    
    if (data.adAnalysis) {
      setAvatar(data.adAnalysis.avatar || '');
      setAwarenessLevel(data.adAnalysis.market_awareness || '');
      setAngle(data.adAnalysis.angle || '');
      setFormat(data.adAnalysis.format || 'UGC Video');
      setTheme(data.adAnalysis.theme || '');
      setTonality(data.adAnalysis.tonality || '');
      setAdFormat(data.adAnalysis.format || 'UGC Video');
    }

    const variationBlocks = data.variationBlocks || [];
    const blocks = variationBlocks.map((scene, index: number) => ({
      id: `block-${Date.now()}-${index + 1}`,
      type: getBlockTypeFromVariationScene(scene, index, variationBlocks.length),
      scriptLine: scene.script || '',
      audioType: 'Creator VO',
      sceneDescription: scene.visual || '',
      visualInspo: data.adAnalysis?.video_content_link || '',
      textOverlays: scene.text_overlay ? [scene.text_overlay] : [],
      order: index + 1
    }));

    const newVariation: ScriptVariation = {
      id: `var-${data.variationType}`,
      name: `${data.variationType.toUpperCase()} - Version A`,
      status: 'primary' as const,
      blocks: blocks
    };

    setScriptVariations([newVariation]);
    setActiveVariation(newVariation.id);
    
    // Initialize AI with ad context and brief data
    if (data.adId && selectedAccountId && newVariation.blocks) {
      setAdContext(data.adId, data.adName);
      const briefData = buildBriefData(newVariation.blocks, {
        avatar: data.adAnalysis?.avatar,
        awarenessLevel: data.adAnalysis?.market_awareness,
        angle: data.adAnalysis?.angle,
        format: data.adAnalysis?.format || 'UGC Video',
        theme: data.adAnalysis?.theme,
        tonality: data.adAnalysis?.tonality,
      });
      initializeAI(data.adId, selectedAccountId, briefData);
    }
  };

  // Helper to parse scenes to replace
  const parseScenesToReplace = (replaceScenes: string): number[] => {
    const scenes: number[] = [];
    if (!replaceScenes) return scenes;
    
    const parts = replaceScenes.split(',').map(s => s.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          scenes.push(i);
        }
      } else {
        scenes.push(Number(part));
      }
    }
    
    return scenes;
  };

  // Helper to determine block type from variation scene
  const getBlockTypeFromVariationScene = (scene: VideoSceneVariation, index: number, totalScenes: number) => {
    if (scene.value_block_type) {
      const typeMap: Record<string, string> = {
        'hook': 'Curiosity/Intrigue Hook',
        'problem': 'Summarized Problem',
        'solution': 'Primary Benefit',
        'benefit': 'Primary Benefit',
        'social_proof': 'Credibility',
        'cta': 'CTA (Call to Action)',
        'empathy': 'Empathy',
        'after': 'After',
      };
      return typeMap[scene.value_block_type.toLowerCase()] || 'Curiosity/Intrigue Hook';
    }
    
    if (index === 0) return 'Curiosity/Intrigue Hook';
    if (index === 1) return 'Summarized Problem';
    if (index === totalScenes - 1) return 'CTA (Call to Action)';
    return 'Primary Benefit';
  };

  const populateFromCreative = async (creative: Creative): Promise<void> => {
    setBriefName(creative.name);
    setAdThumbnail(creative.ad_type === 'video' ? creative.ad_video_link : creative.link);
    setAdFormat(creative.ad_type === 'video' ? 'UGC Video' : 'Static Image');
    
    const adDetails = await fetchAdDetails(creative.id.toString());
    
    // Capture element values for brief initialization
    const elements = {
      avatar: '',
      awarenessLevel: '',
      angle: '',
      format: creative.ad_type === 'video' ? 'UGC Video' : 'Static Image',
      theme: '',
      tonality: '',
    };
    
    if (adDetails?.analysis) {
      elements.avatar = adDetails.analysis.avatar || '';
      elements.awarenessLevel = adDetails.analysis.market_awareness || '';
      elements.angle = adDetails.analysis.angle || '';
      elements.format = adDetails.analysis.format || (creative.ad_type === 'video' ? 'UGC Video' : 'Static Image');
      elements.theme = adDetails.analysis.theme || '';
      elements.tonality = adDetails.analysis.tonality || '';
      
      setAvatar(elements.avatar);
      setAwarenessLevel(elements.awarenessLevel);
      setAngle(elements.angle);
      setFormat(elements.format);
      setTheme(elements.theme);
      setTonality(elements.tonality);
    } else {
      setFormat(elements.format);
    }

    let scriptBlocks: ScriptBlock[] = [];
    
    if (creative.ad_type === 'video') {
      try {
        const videoScenes = await fetchVideoScenes(creative.id.toString());
        
        if (videoScenes && videoScenes.length > 0) {
          scriptBlocks = videoScenes.map((scene, index: number) => ({
            id: `block-${Date.now()}-${index + 1}`,
            type: getBlockTypeFromScene(scene, index, videoScenes.length),
            scriptLine: scene.script || scene.description || '',
            audioType: 'Creator VO',
            sceneDescription: scene.description || scene.visual || scene.visual_elements || '',
            visualInspo: scene.thumbnail_url || scene.screenshot_url || creative.ad_video_link,
            textOverlays: scene.text_overlay ? [scene.text_overlay] : [],
            order: index + 1
          }));
        }
      } catch (error) {
        console.error('Error fetching video scenes:', error);
      }
    }

    if (scriptBlocks.length === 0) {
      scriptBlocks = [{
        id: `block-${Date.now()}-1`,
        type: 'Curiosity/Intrigue Hook',
        scriptLine: creative.hook.split('\n')[0],
        audioType: 'Creator VO',
        sceneDescription: creative.hook.split('\n-')[1]?.trim() || '',
        visualInspo: creative.ad_video_link,
        textOverlays: [],
        order: 1
      }];
    }

    const newBrief = {
      id: `brief-${Date.now()}`,
      title: briefName || creative.name,
      creativeId: creative.id,
      avatar: avatar,
      awarenessLevel: awarenessLevel,
      angle: angle,
      format: format,
      theme: theme,
      scriptBlocks: scriptBlocks
    };

    setSelectedBrief(newBrief);
    
    const initialVariation = {
      id: 'var-1',
      name: 'Version A',
      status: 'primary' as const,
      blocks: scriptBlocks
    };
    
    setScriptVariations([initialVariation]);
    setActiveVariation(initialVariation.id);
    
    // Initialize AI with ad context and brief data
    if (selectedAccountId && scriptBlocks.length > 0) {
      setAdContext(creative.id.toString(), creative.name);
      const briefData = buildBriefData(scriptBlocks, elements);
      initializeAI(creative.id.toString(), selectedAccountId, briefData);
    }
  };

  // Helper function to determine block type from scene
  const getBlockTypeFromScene = (scene: VideoScene, index: number, totalScenes: number) => {
    if (index === 0) return 'Curiosity/Intrigue Hook';
    
    if (scene.value_block_type) {
      const typeMap: Record<string, string> = {
        'hook': 'Curiosity/Intrigue Hook',
        'problem': 'Summarized Problem',
        'solution': 'Primary Benefit',
        'benefit': 'Primary Benefit',
        'social_proof': 'Credibility',
        'cta': 'CTA (Call to Action)',
        'empathy': 'Empathy',
        'after': 'After',
      };
      return typeMap[scene.value_block_type.toLowerCase()] || 'Curiosity/Intrigue Hook';
    }
    
    if (index === 1) return 'Summarized Problem';
    if (index === totalScenes - 1) return 'CTA (Call to Action)';
    return 'Primary Benefit';
  };

  // Handle ad selection from empty state
  const handleAdSelect = async (ad: Creative) => {
    setLayoutMode('full');
    await populateFromCreative(ad);
  };

  // Handle UI commands from AI streaming
  const handleUICommand = useCallback((command: UICommand) => {
    console.log('🎨 UI Command:', command);
    
    switch (command.command) {
      case 'INITIALIZE_BRIEF':
        const initCmd = command as InitializeBriefCommand;
        console.log('📋 INITIALIZE_BRIEF command received', initCmd.data);
        
        // Detect which elements changed for highlighting
        const changedElements: ElementKey[] = [];
        if (initCmd.data.elements) {
          console.log('🔍 Comparing elements:');
          console.log('  Avatar:', initCmd.data.elements.avatar, 'vs', avatar);
          console.log('  Awareness:', initCmd.data.elements.market_awareness, 'vs', awarenessLevel);
          console.log('  Angle:', initCmd.data.elements.angle, 'vs', angle);
          console.log('  Format:', initCmd.data.elements.format, 'vs', format);
          console.log('  Theme:', initCmd.data.elements.theme, 'vs', theme);
          console.log('  Tonality:', initCmd.data.elements.tonality, 'vs', tonality);
          
          if (initCmd.data.elements.avatar && initCmd.data.elements.avatar !== avatar) {
            changedElements.push('avatar');
          }
          if (initCmd.data.elements.market_awareness && initCmd.data.elements.market_awareness !== awarenessLevel) {
            changedElements.push('market_awareness');
          }
          if (initCmd.data.elements.angle && initCmd.data.elements.angle !== angle) {
            changedElements.push('angle');
          }
          if (initCmd.data.elements.format && initCmd.data.elements.format !== format) {
            changedElements.push('format');
          }
          if (initCmd.data.elements.theme && initCmd.data.elements.theme !== theme) {
            changedElements.push('theme');
          }
          if (initCmd.data.elements.tonality && initCmd.data.elements.tonality !== tonality) {
            changedElements.push('tonality');
          }
          
          console.log('✨ Changed elements:', changedElements);
          
          // Update elements
          console.log('💾 Updating state with new values...');
          setAvatar(initCmd.data.elements.avatar || '');
          setAwarenessLevel(initCmd.data.elements.market_awareness || '');
          setAngle(initCmd.data.elements.angle || '');
          setFormat(initCmd.data.elements.format || '');
          setTheme(initCmd.data.elements.theme || '');
          setTonality(initCmd.data.elements.tonality || '');
          
          // Trigger highlight animations on changed elements
          changedElements.forEach(elementKey => {
            setTimeout(() => {
              const element = document.querySelector(`[data-element-key="${elementKey}"]`);
              console.log(`🎯 Looking for element [data-element-key="${elementKey}"]`, element);
              if (element) {
                console.log(`✨ Adding pulse animation to ${elementKey}`);
                element.classList.add('animate-pulse-selection');
                setTimeout(() => {
                  element.classList.remove('animate-pulse-selection');
                  console.log(`✅ Removed pulse animation from ${elementKey}`);
                }, 2000);
              } else {
                console.warn(`⚠️ Element not found: ${elementKey}`);
              }
            }, 100);
          });
          
          // Show toast notification for primary changed element
          if (changedElements.length > 0) {
            const elementLabels: Record<ElementKey, string> = {
              avatar: 'Avatar',
              market_awareness: 'Awareness Level',
              angle: 'Angle',
              format: 'Format',
              theme: 'Theme',
              tonality: 'Tonality'
            };
            const primaryElement = changedElements[0];
            console.log(`🔔 Showing toast for ${elementLabels[primaryElement]}`);
            toast.success(`Updated ${elementLabels[primaryElement]}`, {
              description: 'Script has been regenerated to match the new settings',
              duration: 3000,
            });
          } else {
            console.log('ℹ️ No changed elements detected, skipping visual feedback');
          }
        }
        
        // Update script blocks
        if (initCmd.data.script_builder?.variations?.[0]?.blocks) {
          const blocks = initCmd.data.script_builder.variations[0].blocks.map((block, index) => ({
            id: block.id,
            type: block.type,
            scriptLine: block.scriptLine || '',
            audioType: block.audio || 'Creator VO',
            sceneDescription: block.visual || '',
            visualInspo: '',
            textOverlays: block.textOverlay ? [block.textOverlay] : [],
            order: block.scene || index + 1
          }));
          
          setScriptVariations([{
            id: 'var-1',
            name: initCmd.data.script_builder.variations[0].name || 'Version A',
            status: 'primary',
            blocks: blocks
          }]);
          
          // Trigger flash animation on script builder
          setTimeout(() => {
            const scriptCard = document.getElementById('script-builder-card');
            if (scriptCard) {
              scriptCard.classList.add('animate-pulse-selection');
              setTimeout(() => {
                scriptCard.classList.remove('animate-pulse-selection');
              }, 2000);
            }
          }, 100);
        }
        break;
        
      case 'UPDATE_ELEMENT':
        const updateCmd = command as UpdateElementCommand;
        
        // Element may already be updated from option selection
        // Only update if value is different (redundant command from backend)
        console.log('📝 UPDATE_ELEMENT received (may be redundant after option selection)');
        
        // Check if element was already updated by user selection
        let currentValue = '';
        switch (updateCmd.data.element) {
          case 'avatar': currentValue = avatar; break;
          case 'market_awareness': currentValue = awarenessLevel; break;
          case 'angle': currentValue = angle; break;
          case 'format': currentValue = format; break;
          case 'theme': currentValue = theme; break;
          case 'tonality': currentValue = tonality; break;
        }
        
        // Only update if different
        if (currentValue !== updateCmd.data.value) {
          switch (updateCmd.data.element) {
            case 'avatar':
              setAvatar(updateCmd.data.value);
              break;
            case 'market_awareness':
              setAwarenessLevel(updateCmd.data.value);
              break;
            case 'angle':
              setAngle(updateCmd.data.value);
              break;
            case 'format':
              setFormat(updateCmd.data.value);
              break;
            case 'theme':
              setTheme(updateCmd.data.value);
              break;
            case 'tonality':
              setTonality(updateCmd.data.value);
              break;
          }
          
          // Remove loading and show success
          removeLoadingTarget(`element-${updateCmd.data.element}`);
          triggerElementSuccess(updateCmd.data.element);
        }
        break;
        
      case 'UPDATE_BLOCKS':
        const blocksCmd = command as UpdateBlocksCommand;
        
        // Mark that we just received blocks (to prevent SHOW_LOADING from adding loading after)
        justReceivedBlocksRef.current = true;
        setTimeout(() => {
          justReceivedBlocksRef.current = false;
        }, 500);
        
        // Collect block IDs to remove loading from (to avoid setState during render)
        const blockIdsToRemoveLoading: string[] = [];
        const updatedBlockIds: string[] = [];
        
        // Update blocks in current variation - match by order/scene, not ID
        setScriptVariations(prev => {
          const updated = [...prev];
          const activeVar = updated.find(v => v.id === activeVariation);
          if (activeVar) {
            blocksCmd.data.blocks.forEach(updatedBlock => {
              // Match by order or scene number (backend sends different IDs)
              const order = updatedBlock.order || updatedBlock.scene || 0;
              const blockIndex = activeVar.blocks.findIndex(b => b.order === order);
              
              if (blockIndex !== -1) {
                const existingBlock = activeVar.blocks[blockIndex];
                
                // Collect block ID for loading removal and tracking
                blockIdsToRemoveLoading.push(existingBlock.id);
                updatedBlockIds.push(existingBlock.id);
                
                // Update block data (keep frontend ID, update content)
                activeVar.blocks[blockIndex] = {
                  ...existingBlock,
                  ...(updatedBlock.scriptLine && { scriptLine: updatedBlock.scriptLine }),
                  ...(updatedBlock.audio && { audioType: updatedBlock.audio }),
                  ...(updatedBlock.visual && { sceneDescription: updatedBlock.visual }),
                  ...(updatedBlock.textOverlay && { textOverlays: [updatedBlock.textOverlay] }),
                  ...(updatedBlock.type && { type: updatedBlock.type }),
                };
              }
            });
          }
          return updated;
        });
        
        // Remove loading states and add to recently updated (with stars animation)
        setTimeout(() => {
          removeLoadingTarget('script_builder');
          blockIdsToRemoveLoading.forEach(blockId => {
            removeLoadingTarget(`block-${blockId}`);
          });
          
          // Mark blocks as recently updated for badges and animation
          setRecentlyUpdatedBlocks(new Set(updatedBlockIds));
          
          // Clear recently updated after 5 seconds
          setTimeout(() => {
            setRecentlyUpdatedBlocks(new Set());
          }, 5000);
        }, 0);
        
        // Clear the last updated element reference
        if (lastUpdatedElementRef.current) {
          lastUpdatedElementRef.current = null;
        }
        break;
        
      case 'SHOW_LOADING':
        const loadingCmd = command as ShowLoadingCommand;
        
        // Ignore SHOW_LOADING if we just received blocks (prevents indefinite loading)
        if (justReceivedBlocksRef.current && loadingCmd.data.target === 'script_builder') {
          console.log('⏭️ Ignoring redundant SHOW_LOADING (blocks already received)');
          break;
        }
        
        // Add loading for script_builder as individual block loaders
        if (loadingCmd.data.target === 'script_builder') {
          const activeVar = scriptVariations.find(v => v.id === activeVariation);
          if (activeVar && activeVar.blocks.length > 0) {
            activeVar.blocks.forEach(block => {
              addLoadingTarget(`block-${block.id}`);
            });
          }
        } else {
          addLoadingTarget(loadingCmd.data.target);
        }
        
        // Don't add element loading - element is updated before this command
        break;
        
      case 'HIGHLIGHT_ELEMENT':
        const highlightCmd = command as HighlightElementCommand;
        // Keep element loading active (it's already loading from initial request)
        // This command just confirms that options are being prepared
        console.log('✨ Highlighting element:', highlightCmd.data.element);
        break;
        
      case 'START_BLOCK_LOADING':
        // Triggered when regenerate_script tool starts
        console.log('🔄 Starting block loading (regenerate_script started)');
        const activeVar2 = scriptVariations.find(v => v.id === activeVariation);
        if (activeVar2 && activeVar2.blocks.length > 0) {
          activeVar2.blocks.forEach(block => {
            addLoadingTarget(`block-${block.id}`);
          });
        }
        break;
    }
  }, [
    activeVariation, 
    scriptVariations,
    addLoadingTarget, 
    removeLoadingTarget,
    triggerElementSuccess,
    avatar, 
    awarenessLevel, 
    angle, 
    format, 
    theme, 
    tonality
  ]);

  // Set up AI streaming event handler - use ref to avoid recreating
  const handleUICommandRef = useRef(handleUICommand);
  useEffect(() => {
    handleUICommandRef.current = handleUICommand;
  }, [handleUICommand]);
  
  useEffect(() => {
    // This will be called by the context's streaming handler
    const handleStreamEvent = (event: StreamEvent) => {
      console.log('🎯 UI Command received in page:', event);
      if (event.type === 'ui_command') {
        event.commands.forEach(cmd => {
          console.log('🎨 Executing UI command:', cmd.command);
          handleUICommandRef.current(cmd);
        });
      }
    };
    
    // Callback for when user selects an option (update element immediately)
    const handleOptionSelected = (optionValue: string, element: ElementKey) => {
      console.log('✅ Option selected, updating element immediately:', element, optionValue);
      
      // Update element value on UI immediately
      switch (element) {
        case 'avatar':
          setAvatar(optionValue);
          break;
        case 'market_awareness':
          setAwarenessLevel(optionValue);
          break;
        case 'angle':
          setAngle(optionValue);
          break;
        case 'format':
          setFormat(optionValue);
          break;
        case 'theme':
          setTheme(optionValue);
          break;
        case 'tonality':
          setTonality(optionValue);
          break;
      }
      
      // Remove loading from element and show success
      removeLoadingTarget(`element-${element}`);
      triggerElementSuccess(element);
      
      // Don't add block loading here - wait for regenerate_script tool to start
    };
    
    // Store handlers in window for context to call
    interface CustomWindow extends Window {
      __briefBuilderUICommandHandler?: (event: UpdatedBlocksEvent | StreamEvent) => void;
      __registerOptionSelectedCallback?: (callback: (value: string, element: ElementKey) => void) => void;
    }
    const customWindow = window as unknown as CustomWindow;
    customWindow.__briefBuilderUICommandHandler = handleStreamEvent;
    if (customWindow.__registerOptionSelectedCallback) {
      customWindow.__registerOptionSelectedCallback(handleOptionSelected);
    }
    console.log('✅ UI command handler registered');
    
    return () => {
      delete customWindow.__briefBuilderUICommandHandler;
      console.log('🗑️ UI command handler unregistered');
    };
  }, [
    scriptVariations, 
    activeVariation, 
    addLoadingTarget, 
    removeLoadingTarget, 
    triggerElementSuccess,
    setAvatar,
    setAwarenessLevel,
    setAngle,
    setFormat,
    setTheme,
    setTonality
  ]);

  const generateNamingConvention = () => {
    const parts = [avatar, angle, format, theme].filter(Boolean);
    return parts.join('_').replace(/\s+/g, '_') || `Brief_${Date.now()}`;
  };

  // Script Variations Handlers
  const handleUpdateVariation = (variationId: string, blocks: ScriptBlock[]) => {
    setScriptVariations(prev => 
      prev.map(variation =>
        variation.id === variationId ? { ...variation, blocks } : variation
      )
    );
  };

  const handleDeleteVariation = (variationId: string) => {
    if (scriptVariations.length <= 1) {
      alert('You must have at least one variation');
      return;
    }
    setScriptVariations(prev => prev.filter(v => v.id !== variationId));
    const remaining = scriptVariations.filter(v => v.id !== variationId);
    if (remaining.length > 0) {
      setActiveVariation(remaining[0].id);
    }
  };

  const handleCloneVariation = (variationId: string) => {
    const variationToClone = scriptVariations.find(v => v.id === variationId);
    if (!variationToClone) return;
    
    const newVariation: ScriptVariation = {
      ...variationToClone,
      id: `var-${Date.now()}`,
      name: `${variationToClone.name} Copy`,
      status: 'draft' as const,
      blocks: variationToClone.blocks.map(block => ({ ...block, id: `block-${Date.now()}-${Math.random()}` }))
    };
    
    setScriptVariations(prev => [...prev, newVariation]);
    setActiveVariation(newVariation.id);
  };

  const handleSetPrimary = (variationId: string) => {
    setScriptVariations(prev =>
      prev.map(variation => ({
        ...variation,
        status: variation.id === variationId ? 'primary' as const : 'draft' as const
      }))
    );
  };

  const handlePushToProduction = async (variationId: string) => {
    if (!selectedAccountId) {
      toast.error('Please select an ad account first');
      return;
    }

    const loadingToast = toast.loading('Pushing brief to production...');

    try {
      const payload = {
        accountId: selectedAccountId,
        briefName: briefName,
        assignTo: assignTo,
        variableSelector: {
          avatar: avatar,
          awarenessLevel: awarenessLevel,
          angle: angle,
          format: format,
          theme: theme,
          tonality: tonality
        },
        scriptBuilder: {
          variations: scriptVariations.map(variation => ({
            id: variation.id,
            name: variation.name,
            status: variation.status,
            blocks: variation.blocks.map(block => ({
              id: block.id,
              type: block.type,
              scriptLine: block.scriptLine,
              audioType: block.audioType,
              sceneDescription: block.sceneDescription,
              visualInspo: block.visualInspo,
              textOverlays: block.textOverlays,
              order: block.order
            }))
          }))
        },
        selectedBrief: selectedBrief
      };

      const response = await fetch('https://n8n.srv931040.hstgr.cloud/webhook/3b8017b9-1358-4dd6-8c59-7267e79307a0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to push brief: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Brief pushed successfully:', result);

      setScriptVariations(prev =>
        prev.map(v => ({ ...v, status: 'ready' as const }))
      );

      toast.success('Brief pushed to production successfully!', {
        id: loadingToast,
        description: 'Redirecting to workflow...',
      });
      
      setTimeout(() => {
        router.push('/workflow');
      }, 1000);
    } catch (error) {
      console.error('Error pushing brief to production:', error);
      toast.error('Failed to push brief to production', {
        id: loadingToast,
        description: 'Please try again.',
      });
    }
  };

  const handleAddVariation = () => {
    const newVariation: ScriptVariation = {
      id: `var-${Date.now()}`,
      name: `Version ${String.fromCharCode(65 + scriptVariations.length)}`,
      status: 'draft' as const,
      blocks: []
    };
    
    setScriptVariations(prev => [...prev, newVariation]);
    setActiveVariation(newVariation.id);
  };

  const handleReset = () => {
    resetAI();
    setBriefName('');
    setAssignTo('');
    setAvatar('');
    setAwarenessLevel('');
    setAngle('');
    setFormat('');
    setTheme('');
    setTonality('');
    setScriptVariations([{
      id: 'var-1',
      name: 'Version A',
      status: 'primary',
      blocks: []
    }]);
    setActiveVariation('var-1');
    setSelectedBrief(null);
  };

  // Show empty state if no ad is selected
  if (layoutMode === 'empty' && !selectedAdId) {
    return (
      <AppLayout>
        <EmptyBriefState onAdSelect={handleAdSelect} />
      </AppLayout>
    );
  }

  // Show full layout
  return (
    <AppLayout>
      <div className="h-screen flex flex-col">
        {/* Sticky Header */}
        <BriefBuilderHeader
          adFormat={adFormat}
          accountId={selectedAccountId}
          onReset={handleReset}
        />
        
        {/* Resizable Content Area */}
        <div className="flex-1 overflow-hidden">
          <ResizableLayout
            leftPanel={<ChatPanel />}
            rightPanel={
              <div className="h-full overflow-y-auto p-6 bg-muted/30">
                <div className="w-full max-w-6xl mx-auto space-y-6">
                  {/* Brief Details Section */}
                  <Card className="shadow-card relative">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-foreground mb-6">Brief Details</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Brief Name</label>
                          <Input
                            value={briefName}
                            onChange={(e) => setBriefName(e.target.value)}
                            placeholder="Enter brief name..."
                            className="w-full"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">Assign To</label>
                          <Input
                            value={assignTo}
                            onChange={(e) => setAssignTo(e.target.value)}
                            placeholder="Enter assignee name..."
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Elements Card */}
                  <Card className="shadow-card relative">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-foreground mb-6">Elements</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SelectableElementField
                          elementKey="avatar"
                          label="Avatar"
                          subtitle="Audience Demographics"
                          value={avatar}
                          onChange={setAvatar}
                          options={variableOptions.avatar}
                          disabled={optionsLoading}
                          placeholder={optionsLoading ? "Loading options..." : "Enter or select avatar..."}
                        />
                        
                        <SelectableElementField
                          elementKey="market_awareness"
                          label="Awareness Level"
                          subtitle="Market Awareness"
                          value={awarenessLevel}
                          onChange={setAwarenessLevel}
                          options={variableOptions.market_awareness}
                          disabled={optionsLoading}
                          placeholder={optionsLoading ? "Loading options..." : "Enter or select awareness..."}
                        />
                        
                        <SelectableElementField
                          elementKey="angle"
                          label="Angle"
                          subtitle="Marketing Angle"
                          value={angle}
                          onChange={setAngle}
                          options={variableOptions.angle}
                          disabled={optionsLoading}
                          placeholder={optionsLoading ? "Loading options..." : "Enter or select angle..."}
                        />
                        
                        <SelectableElementField
                          elementKey="format"
                          label="Format"
                          value={format}
                          onChange={setFormat}
                          options={variableOptions.format}
                          disabled={optionsLoading}
                          placeholder={optionsLoading ? "Loading options..." : "Enter or select format..."}
                        />
                        
                        <SelectableElementField
                          elementKey="theme"
                          label="Theme"
                          value={theme}
                          onChange={setTheme}
                          options={variableOptions.theme}
                          disabled={optionsLoading}
                          placeholder={optionsLoading ? "Loading options..." : "Enter or select theme..."}
                        />
                        
                        <SelectableElementField
                          elementKey="tonality"
                          label="Tonality"
                          value={tonality}
                          onChange={setTonality}
                          options={variableOptions.tonality}
                          disabled={optionsLoading}
                          placeholder={optionsLoading ? "Loading options..." : "Enter or select tonality..."}
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Script Builder - with loading overlay */}
                  <div id="script-builder-card" className="space-y-6 relative">
                    {loadingTargets.has('script_builder') && (
                      <LoadingOverlay message="🤖 AI is regenerating your script..." />
                    )}
                    
                    <ScriptVariations
                      variations={scriptVariations}
                      onUpdateVariation={handleUpdateVariation}
                      onDeleteVariation={handleDeleteVariation}
                      onCloneVariation={handleCloneVariation}
                      onSetPrimary={handleSetPrimary}
                      onPushToProduction={handlePushToProduction}
                      onAddVariation={handleAddVariation}
                      showMetadata={showMetadata}
                      setShowMetadata={setShowMetadata}
                      generateNamingConvention={generateNamingConvention}
                      activeVariation={activeVariation}
                      onActiveVariationChange={setActiveVariation}
                      loadingTargets={loadingTargets}
                      selectedBlocks={selectedBlocks}
                      onToggleBlock={toggleBlock}
                      recentlyUpdatedBlocks={recentlyUpdatedBlocks}
                    />

                    {/* Push to Production Button */}
                    <div className="flex justify-center pt-4">
                      <Button 
                        className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
                        onClick={() => handlePushToProduction(activeVariation)}
                      >
                        <Send className="w-5 h-5 mr-2" />
                        Push Brief to Production Workflow
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>
      
      {/* Floating Media Viewer Widget */}
      {adThumbnail && (
        <MediaViewerWidget
          mediaUrl={adThumbnail}
          mediaType={adFormat?.toLowerCase().includes('video') ? 'video' : 'image'}
          adName={adName || undefined}
        />
      )}
    </AppLayout>
  );
}

export default function BriefBuilder() {
  return (
    <AIAgentProvider>
      <Suspense fallback={
        <AppLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading brief builder...</p>
            </div>
          </div>
        </AppLayout>
      }>
        <BriefBuilderContent />
      </Suspense>
    </AIAgentProvider>
  );
}
