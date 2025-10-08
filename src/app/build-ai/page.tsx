"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { AppLayout } from "@/components/AppLayout";
import { useAccount } from "@/contexts/AccountContext";
import { ScriptVariations, ScriptVariation } from "@/components/ui/ScriptVariations";
import { Creative } from "@/services/creativesService";
import { fetchVideoScenes, fetchAdDetails } from "@/services/adDetailsService";
import { VideoScene, HookVariation, VideoSceneVariation } from "@/types";

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
    video_content_link?: string;
  };
}

function BriefBuilderContent() {
  const { selectedAccountId } = useAccount();
  const searchParams = useSearchParams();
  const router = useRouter();
  const creativeId = searchParams.get('creativeId');
  
  const [selectedBrief, setSelectedBrief] = useState<BriefData | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [activeVariation, setActiveVariation] = useState('var-1');
  
  // Variable selector states
  const [briefName, setBriefName] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [avatar, setAvatar] = useState("");
  const [awarenessLevel, setAwarenessLevel] = useState("");
  const [angle, setAngle] = useState("");
  const [format, setFormat] = useState("");
  const [theme, setTheme] = useState("");
  
  const [scriptVariations, setScriptVariations] = useState<ScriptVariation[]>([
    {
      id: 'var-1',
      name: 'Version A',
      status: 'primary' as const,
      blocks: []
    }
  ]);

  // Load creative data when component mounts or creativeId changes
  useEffect(() => {
    if (creativeId) {
      const creativeData = localStorage.getItem('selectedCreative');
      if (creativeData) {
        const creative: Creative = JSON.parse(creativeData);
        populateFromCreative(creative);
        // Clear localStorage after loading
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
          // Handle v1 - Hook variations
          populateFromHookVariations(data);
        } else if (['v2', 'v3', 'v4', 'v5'].includes(data.variationType)) {
          // Handle v2-v5 - Video scene variations
          populateFromVideoVariations(data);
        }
        
        // Clear sessionStorage after loading
        sessionStorage.removeItem('briefBuilderData');
      } catch (error) {
        console.error('Error parsing brief builder data:', error);
      }
    }
  }, []);

  // Handler for v1 - Hook variations
  const populateFromHookVariations = (data: BriefBuilderData) => {
    // Set brief name
    setBriefName(data.adName || 'Hook Variation Brief');
    
    // Map AdAnalysis fields to Variable Selector
    if (data.adAnalysis) {
      setAvatar(data.adAnalysis.avatar || '');
      setAwarenessLevel(data.adAnalysis.market_awareness || '');
      setAngle(data.adAnalysis.angle || '');
      setFormat(data.adAnalysis.format || 'UGC Video');
      setTheme(data.adAnalysis.theme || '');
    }

    // For each selected hook, create a variation with original scenes but hook replaced
    const newVariations: ScriptVariation[] = (data.selectedHooks || []).map((hook, index: number) => {
      // Parse which scenes to replace from the hook
      const scenesToReplace = parseScenesToReplace(hook.replace_scenes);
      
      // Create blocks from original video scenes
      const blocks = data.videoScenes.map((scene: VideoScene, sceneIndex: number) => {
        // Check if this scene should be replaced by the hook
        const shouldReplace = scenesToReplace.includes(scene.scene);
        
        if (shouldReplace) {
          // Replace with hook data
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
          // Keep original scene
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
  };

  // Handler for v2-v5 - Video scene variations
  const populateFromVideoVariations = (data: BriefBuilderData) => {
    // Set brief name
    setBriefName(data.adName || `${data.variationType.toUpperCase()} Variation Brief`);
    
    // Map AdAnalysis fields to Variable Selector
    if (data.adAnalysis) {
      setAvatar(data.adAnalysis.avatar || '');
      setAwarenessLevel(data.adAnalysis.market_awareness || '');
      setAngle(data.adAnalysis.angle || '');
      setFormat(data.adAnalysis.format || 'UGC Video');
      setTheme(data.adAnalysis.theme || '');
    }

    // Create blocks directly from variation data
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
  };

  // Helper to parse scenes to replace (e.g., "1,2" or "1-3")
  const parseScenesToReplace = (replaceScenes: string): number[] => {
    const scenes: number[] = [];
    
    if (!replaceScenes) return scenes;
    
    const parts = replaceScenes.split(',').map(s => s.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        // Range like "1-3"
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          scenes.push(i);
        }
      } else {
        // Single number like "1"
        scenes.push(Number(part));
      }
    }
    
    return scenes;
  };

  // Helper to determine block type from variation scene
  const getBlockTypeFromVariationScene = (scene: VideoSceneVariation, index: number, totalScenes: number) => {
    // Check value_block_type from the data
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
    
    // Default pattern based on position
    if (index === 0) return 'Curiosity/Intrigue Hook';
    if (index === 1) return 'Summarized Problem';
    if (index === totalScenes - 1) return 'CTA (Call to Action)';
    return 'Primary Benefit';
  };

  const populateFromCreative = async (creative: Creative): Promise<void> => {
    // Set brief name from creative name
    setBriefName(creative.name);
    
    // Fetch ad details to get analysis data
    const adDetails = await fetchAdDetails(creative.id.toString());
    
    // Map AdAnalysis fields to Variable Selector
    if (adDetails?.analysis) {
      setAvatar(adDetails.analysis.avatar || '');
      setAwarenessLevel(adDetails.analysis.market_awareness || '');
      setAngle(adDetails.analysis.angle || '');
      setFormat(adDetails.analysis.format || (creative.ad_type === 'video' ? 'UGC Video' : 'Static Image'));
      setTheme(adDetails.analysis.theme || '');
    } else {
      // Fallback if no analysis data
      setFormat(creative.ad_type === 'video' ? 'UGC Video' : 'Static Image');
    }

    // Fetch video scenes if it's a video ad
    let scriptBlocks: ScriptBlock[] = [];
    
    if (creative.ad_type === 'video') {
      try {
        console.log('Fetching video scenes for ad:', creative.id);
        const videoScenes = await fetchVideoScenes(creative.id.toString());
        console.log('Video scenes fetched:', videoScenes);
        
        if (videoScenes && videoScenes.length > 0) {
          // Create script blocks from all video scenes
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

    // Fallback to single block if no scenes found
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
  };

  // Helper function to determine block type from scene
  const getBlockTypeFromScene = (scene: VideoScene, index: number, totalScenes: number) => {
    // First scene is usually the hook
    if (index === 0) return 'Curiosity/Intrigue Hook';
    
    // Check value_block_type from the data
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
    
    // Default pattern based on position
    if (index === 1) return 'Summarized Problem';
    if (index === totalScenes - 1) return 'CTA (Call to Action)';
    return 'Primary Benefit';
  };

  const handleGenerateBrief = () => {
    // Create brief with current variable selector values
    const newBrief = {
      id: `brief-${Date.now()}`,
      title: briefName || `${avatar || 'New Brief'} - ${angle || theme || 'Untitled'}`,
      avatar: avatar,
      awarenessLevel: awarenessLevel,
      angle: angle,
      format: format,
      theme: theme,
      scriptBlocks: []
    };

    setSelectedBrief(newBrief);
  };

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
    // Set active variation to first remaining variation
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

    // Show loading toast
    const loadingToast = toast.loading('Pushing brief to production...');

    try {
      // Prepare the payload
      const payload = {
        accountId: selectedAccountId,
        briefName: briefName,
        assignTo: assignTo,
        variableSelector: {
          avatar: avatar,
          awarenessLevel: awarenessLevel,
          angle: angle,
          format: format,
          theme: theme
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

      console.log('Pushing brief to production workflow:', payload);

      // Make POST request to webhook
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

      // Update the brief status in the variations
      setScriptVariations(prev =>
        prev.map(v => ({ ...v, status: 'ready' as const }))
      );

      // Dismiss loading toast and show success
      toast.success('Brief pushed to production successfully!', {
        id: loadingToast,
        description: 'Redirecting to workflow...',
      });
      
      // Navigate to workflow page after a short delay
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

  if (!selectedAccountId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Select an Account</h3>
            <p className="text-muted-foreground">
              Please select an ad account from the sidebar to start building briefs
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Brief Builder</h1>
              <p className="text-muted-foreground">
                Create and manage creative briefs for your campaigns
              </p>
            </div>
          </div>
        </div>

                <div className="space-y-6">
          {/* Variable Selector */}
                  <Card className="shadow-card">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-6">Variable Selector</h3>
              
              <div className="space-y-4">
                {/* Brief Name & Assign To - Two Columns */}
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

                {/* Other Variables - Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Avatar <span className="text-xs text-muted-foreground">(Audience Demographics)</span>
                    </label>
                    <Combobox
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="Enter or select avatar..."
                      className="w-full"
                      options={[
                        'Concerned Pet Parent',
                        'Health-Conscious Owner',
                        'Budget-Minded Parent',
                        'First-Time Pet Owner',
                        'Senior Pet Owner'
                      ]}
                    />
                        </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Awareness Level <span className="text-xs text-muted-foreground">(Market Awareness)</span>
                    </label>
                    <Combobox
                      value={awarenessLevel}
                      onChange={(e) => setAwarenessLevel(e.target.value)}
                      placeholder="Enter or select awareness..."
                      className="w-full"
                      options={[
                        'Unaware',
                        'Problem-Aware',
                        'Solution-Aware',
                        'Product-Aware',
                        'Most-Aware'
                      ]}
                    />
                            </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Angle <span className="text-xs text-muted-foreground">(Marketing Angle)</span>
                    </label>
                    <Combobox
                      value={angle}
                      onChange={(e) => setAngle(e.target.value)}
                      placeholder="Enter or select angle..."
                      className="w-full"
                      options={[
                        'Problem-Aware',
                        'FOMO',
                        'UGC Style',
                        'Social Proof',
                        'Authority',
                        'Scarcity',
                        'Testimonial'
                      ]}
                    />
                              </div>
                              
                              <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Format</label>
                    <Combobox
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      placeholder="Enter or select format..."
                      className="w-full"
                      options={[
                        'UGC Video',
                        'Testimonial',
                        'Animation',
                        'Static Image',
                        'Carousel',
                        'Story Ad'
                      ]}
                    />
                                </div>
                                
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Theme</label>
                    <Combobox
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      placeholder="Enter or select theme..."
                      className="w-full"
                      options={[
                        'Pet Anxiety',
                        'Pet Health',
                        'Budget Solutions',
                        'Training',
                        'Wellness',
                        'Lifestyle'
                      ]}
                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                    </Card>

          {/* Script Builder - Always Visible */}
          <div className="space-y-6">
            

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
            />

            {/* Push to Production Button at Bottom */}
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
    </AppLayout>
  );
}

export default function BriefBuilder() {
  return (
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
  );
}
