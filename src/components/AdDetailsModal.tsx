"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import { Area, AreaChart, XAxis, YAxis, Tooltip } from "recharts";
import { 
  X,
  Video,
  Lightbulb,
  Brain,
  Eye,
  FileText,
  ExternalLink,
  TrendingUp,
  Target,
  Users,
  MousePointer,
  MessageCircle,
  ChevronRight,
  Sparkles,
  DollarSign
} from "lucide-react";
import { Ad, VideoScene, AIVariationsResponse, HookVariation, VideoSceneVariation, InstructionVariation, ImageBlocksResponse, ImageVariationsResponse } from "@/types";
import { fetchAdDetails, fetchVideoScenes, fetchAIVariations, fetchImageBlocks, fetchImageVariations } from "@/services/adDetailsService";

interface AdDetailsModalProps {
  adId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Component for handling image loading with fallback
const SceneImage = ({ 
  src, 
  alt, 
  className,
  onError 
}: { 
  src: string; 
  alt: string; 
  className?: string;
  onError?: () => void;
}) => {
  const [useNextImage, setUseNextImage] = useState(true);
  const [imgError, setImgError] = useState(false);

  const handleNextImageError = () => {
    setUseNextImage(false);
    onError?.();
  };

  if (imgError) {
    return (
      <div className={`bg-muted rounded aspect-video flex items-center justify-center ${className}`}>
        <Video className="h-6 w-6 text-muted-foreground" />
        <span className="ml-2 text-xs text-muted-foreground">Image unavailable</span>
      </div>
    );
  }

  if (useNextImage) {
    return (
      <Image 
        src={src} 
        alt={alt}
        width={400}
        height={225}
        className={className}
        onError={handleNextImageError}
        unoptimized={true}
      />
    );
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className={className}
      onError={() => {
        setImgError(true);
        onError?.();
      }}
    />
  );
};

export function AdDetailsModal({ adId, isOpen, onClose }: AdDetailsModalProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [videoScenes, setVideoScenes] = useState<VideoScene[]>([]);
  const [imageBlocks, setImageBlocks] = useState<ImageBlocksResponse[]>([]);
  const [imageVariations, setImageVariations] = useState<ImageVariationsResponse[]>([]);
  const [variations, setVariations] = useState<AIVariationsResponse | null>(null);
  const [activeVariation, setActiveVariation] = useState<string>("v1");
  const [loading, setLoading] = useState(true);
  const [selectedHooks, setSelectedHooks] = useState<Set<number>>(new Set());
  const [regeneratingVariation, setRegeneratingVariation] = useState<string | null>(null);

  // Helper function to detect if ad is an image ad
  const isImageAd = (ad: Ad | null) => {
    if (!ad) return false;
    const mediaUrl = ad.analysis?.video_content_link || ad.video_url;
    if (!mediaUrl || typeof mediaUrl !== 'string') return false;
    
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const lowerUrl = mediaUrl.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('fbcdn.net');
  };

  // Handler for hook checkbox toggle
  const handleHookToggle = (hookId: number) => {
    setSelectedHooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hookId)) {
        newSet.delete(hookId);
      } else {
        newSet.add(hookId);
      }
      return newSet;
    });
  };

  // Handler to select/deselect all hooks
  const handleSelectAllHooks = () => {
    if (!variations?.v1) return;
    
    if (selectedHooks.size === variations.v1.length) {
      setSelectedHooks(new Set());
    } else {
      const allHookIds = new Set(variations.v1.map(hook => hook.id));
      setSelectedHooks(allHookIds);
    }
  };

  // Update active variation when variations are loaded
  useEffect(() => {
    if (variations && Object.keys(variations).length > 0) {
      const firstVariationKey = Object.keys(variations)[0];
      setActiveVariation(firstVariationKey);
    }
  }, [variations]);

  useEffect(() => {
    const loadAdDetails = async () => {
      if (!adId) return;
      
      const decodedAdId = decodeURIComponent(adId);
      
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [adData, scenes, adVariations, imgBlocks, imgVariations] = await Promise.all([
          fetchAdDetails(decodedAdId),
          fetchVideoScenes(decodedAdId),
          fetchAIVariations(decodedAdId),
          fetchImageBlocks(decodedAdId),
          fetchImageVariations(decodedAdId)
        ]);
        
        setAd(adData);
        setVideoScenes(scenes);
        setImageBlocks(imgBlocks);
        setImageVariations(imgVariations);
        
        // Handle variations structure
        if (Array.isArray(adVariations) && adVariations.length > 0) {
          const mergedVariations: AIVariationsResponse = {};
          
          adVariations.forEach((variationGroup) => {
            Object.keys(variationGroup).forEach(key => {
              if (variationGroup[key]) {
                mergedVariations[key] = variationGroup[key] as HookVariation[] | VideoSceneVariation[] | InstructionVariation[];
              }
            });
          });
          
          setVariations(mergedVariations);
        } else {
          setVariations(null);
        }
      } catch (error) {
        console.error("❌ Error loading ad details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen && adId) {
      loadAdDetails();
    }
  }, [adId, isOpen]);

  // Function to regenerate a specific variation
  const handleRegenerateVariation = async (variationKey: string) => {
    setRegeneratingVariation(variationKey);
    
    const loadingToast = toast.loading(`Regenerating ${variationKey.toUpperCase()}...`, {
      description: "This may take a few moments"
    });
    
    try {
      const response = await fetch("https://n8n.srv931040.hstgr.cloud/webhook/1b50edb5-2278-4b49-9fc3-c3480e74adfd", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variation_number: variationKey,
          ad_details: {
            ad_id: adId,
            ad_name: ad?.ad_name || ad?.creative_name,
            analysis: ad?.analysis,
            video_scenes: videoScenes,
            performance: ad?.performance,
            video_metrics: ad?.video_metrics
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data && Array.isArray(data) && data.length > 0) {
        const mergedVariations: AIVariationsResponse = { ...variations };
        mergedVariations[variationKey] = data as HookVariation[] | VideoSceneVariation[] | InstructionVariation[];
        
        setVariations(mergedVariations);
        
        toast.dismiss(loadingToast);
        toast.success(`Successfully regenerated ${variationKey.toUpperCase()}!`, {
          description: `${data.length} scenes have been generated`
        });
      } else {
        throw new Error('Invalid response format from webhook');
      }
    } catch (error) {
      console.error("✨ Regenerate error:", error);
      
      toast.dismiss(loadingToast);
      toast.error('Failed to regenerate variation', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setRegeneratingVariation(null);
    }
  };

  // Function to generate a specific variation for the first time
  const handleGenerateSingleVariation = async (variationKey: string) => {
    setRegeneratingVariation(variationKey);
    
    const loadingToast = toast.loading(`Generating ${variationKey.toUpperCase()}...`, {
      description: "This may take a few moments"
    });
    
    try {
      const requestBody = {
        variation_number: variationKey,
        ad_details: {
          ad_id: adId,
          ad_name: ad?.ad_name || ad?.creative_name,
          analysis: ad?.analysis,
          video_scenes: videoScenes,
          performance: ad?.performance,
          video_metrics: ad?.video_metrics
        }
      };
      
      const response = await fetch("https://n8n.srv931040.hstgr.cloud/webhook/generate-variation", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data && Array.isArray(data) && data.length > 0) {
        const mergedVariations: AIVariationsResponse = variations ? { ...variations } : {};
        mergedVariations[variationKey] = data as HookVariation[] | VideoSceneVariation[] | InstructionVariation[];
        
        setVariations(mergedVariations);
        
        toast.dismiss(loadingToast);
        toast.success(`Successfully generated ${variationKey.toUpperCase()}!`, {
          description: `${data.length} scenes have been generated`
        });
      } else {
        throw new Error('Invalid response format from webhook');
      }
    } catch (error) {
      console.error("✨ Generate variation error:", error);
      
      toast.dismiss(loadingToast);
      toast.error('Failed to generate variation', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setRegeneratingVariation(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  // Helper function to check if a scene has been changed in v2 compared to original
  const isSceneChanged = (v2Scene: VideoSceneVariation, originalScenes: VideoScene[]) => {
    const originalScene = originalScenes.find(s => s.scene === v2Scene.scene);
    if (!originalScene) return true;
    
    const scriptChanged = originalScene.script !== v2Scene.script;
    const visualChanged = originalScene.visual !== v2Scene.visual;
    const textOverlayChanged = originalScene.text_overlay !== v2Scene.text_overlay;
    
    return scriptChanged || visualChanged || textOverlayChanged;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[50vw] h-[80vh] p-0 gap-0 overflow-hidden [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>{ad?.creative_name || 'Ad Details'}</DialogTitle>
        </VisuallyHidden>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading ad details...</p>
            </div>
          </div>
        ) : !ad ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Ad not found</h3>
            </div>
          </div>
        ) : (
          <div className="flex h-full">
            {/* Left Side - Video */}
            <div className="w-[320px] border-r bg-muted/10 flex flex-col">
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold">Original Creative</h3>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Video/Image Player */}
                <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden mb-3 flex-shrink-0">
                  {(() => {
                    const mediaUrl = ad.analysis?.video_content_link || ad.video_url;
                    
                    if (!mediaUrl) {
                      return (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-white">
                            <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs opacity-75">Media not available</p>
                          </div>
                        </div>
                      );
                    }

                    const isImage = (() => {
                      if (!mediaUrl || typeof mediaUrl !== 'string') return false;
                      const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
                      const lowerUrl = mediaUrl.toLowerCase();
                      return imageExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('fbcdn.net');
                    })();

                    const isVideo = (() => {
                      if (!mediaUrl || typeof mediaUrl !== 'string') return false;
                      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
                      const lowerUrl = mediaUrl.toLowerCase();
                      return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('supabase.co');
                    })();

                    if (isImage) {
                      return (
                        <img
                          src={mediaUrl as string}
                          alt={ad.creative_name || ad.ad_name || `Ad #${ad.id}`}
                          className="w-full h-full object-contain"
                        />
                      );
                    } else if (isVideo) {
                      return (
                        <video
                          controls
                          className="w-full h-full object-contain"
                          poster={ad.analysis?.breakdown_sheet_link || ad.thumbnail_url || ""}
                        >
                          <source src={mediaUrl as string} type="video/mp4" />
                          <source src={mediaUrl as string} type="video/webm" />
                          Your browser does not support the video tag.
                        </video>
                      );
                    }

                    return null;
                  })()}
                </div>
                
                {/* View on Facebook Button */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  size="sm"
                  onClick={() => ad.ad_link && window.open(ad.ad_link, '_blank')}
                  disabled={!ad.ad_link}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View on Facebook
                </Button>
              </div>
            </div>

            {/* Right Side - Tabs */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b flex-shrink-0">
                <h2 className="text-lg font-bold text-foreground">{ad.creative_name || `Video #${ad.id}`}</h2>
                <p className="text-xs text-muted-foreground">Video Creative Analysis • {variations ? Object.keys(variations).length : 0} variations</p>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                <Tabs defaultValue="scenes" className="h-full flex flex-col relative">
                <TabsList className="grid w-full grid-cols-4 mx-4 mt-2 flex-shrink-0">
                  <TabsTrigger value="scenes" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Scenes
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="text-xs">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Insights
                  </TabsTrigger>
                  <TabsTrigger value="variations" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    AI Variations
                  </TabsTrigger>
                </TabsList>

                {/* Scenes Tab */}
                <TabsContent value="scenes" className="absolute inset-0 top-12 overflow-y-scroll px-4 py-4 data-[state=inactive]:hidden">
                    {isImageAd(ad) && imageBlocks.length > 0 ? (
                      <div className="space-y-4">
                        <h3 className="text-base font-semibold">Image Blocks ({imageBlocks[0]?.data?.length || 0})</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {imageBlocks[0]?.data?.map((block) => (
                            <Card key={block.id} className="border border-primary/20">
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm font-semibold">{block.element}</CardTitle>
                                  <Badge variant="outline" className="text-xs">{block.content_type}</Badge>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="text-xs text-muted-foreground">Position: {block.position}</div>
                                {block.text && (
                                  <div className="text-sm">
                                    <span className="font-medium text-muted-foreground">Content:</span>
                                    <div className="mt-1 p-2 bg-muted rounded text-foreground font-medium">&quot;{block.text}&quot;</div>
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  <span className="font-medium">Design Notes:</span> {block.design_notes}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : videoScenes.length > 0 ? (
                      <div className="space-y-3">
                        <h3 className="text-base font-semibold">Video Scene Breakdown ({videoScenes.length} scenes)</h3>
                        <div className="space-y-2">
                          {[...videoScenes]
                            .sort((a, b) => a.scene - b.scene)
                            .map((scene) => (
                              <Card key={scene.id} className="border border-primary/50">
                                <CardHeader className="p-2 pb-1 bg-primary/5">
                                  <div className="flex items-center justify-between">
                                    <Badge className="bg-primary text-primary-foreground text-xs">
                                      Block {scene.scene}
                                    </Badge>
                                    <span className="text-xs font-mono text-muted-foreground">
                                      {scene.timestamp}
                                    </span>
                                  </div>
                                </CardHeader>
                                
                                <CardContent className="p-2 space-y-2">
                                  {scene.screenshot_url && (
                                    <div className="rounded overflow-hidden w-full h-24">
                                      <SceneImage 
                                        src={scene.screenshot_url} 
                                        alt={`Scene ${scene.scene}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  
                                  <div>
                                    <h4 className="font-semibold text-[10px] text-muted-foreground uppercase mb-0.5">Script</h4>
                                    <p className="text-xs text-foreground leading-tight">{scene.script}</p>
                                  </div>
                                  
                                  {scene.visual && (
                                    <div>
                                      <h4 className="font-semibold text-[10px] text-muted-foreground uppercase mb-0.5">Visual</h4>
                                      <p className="text-xs text-foreground leading-tight">{scene.visual}</p>
                                    </div>
                                  )}
                                  
                                  {scene.text_overlay && (
                                    <div>
                                      <h4 className="font-semibold text-[10px] text-muted-foreground uppercase mb-0.5">Text Overlay</h4>
                                      <div className="bg-muted/50 p-1 rounded text-[10px] font-mono leading-tight">
                                        {scene.text_overlay}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No scenes available</p>
                      </div>
                    )}
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="absolute inset-0 top-12 overflow-y-scroll px-4 py-4 data-[state=inactive]:hidden">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold mb-3">Performance Metrics</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">SPEND</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrency(ad.performance?.spend || 0)}
                        </p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">ROAS</p>
                        <p className="text-2xl font-bold text-accent">
                          {ad.performance?.roas ? `${ad.performance.roas.toFixed(1)}x` : 'N/A'}
                        </p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">VIEWS</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatNumber(ad.video_metrics?.total_video_views || 0)}
                        </p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground mb-1">CTR</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatPercentage(ad.performance?.ctr || 0)}
                        </p>
                      </Card>
                    </div>
                  </div>

                  {ad.video_metrics && (
                    <div>
                      <h3 className="text-base font-semibold mb-3">Video Retention</h3>
                      <Card className="p-4">
                        <div className="h-[200px] w-full">
                          <AreaChart
                            width={500}
                            height={200}
                            data={[
                              { point: "0%", retention: 100, viewers: ad.video_metrics?.total_video_views || 0 },
                              { point: "25%", retention: ad.video_metrics.total_video_views > 0 ? (ad.video_metrics.retention_25 / ad.video_metrics.total_video_views) * 100 : 0 },
                              { point: "50%", retention: ad.video_metrics.total_video_views > 0 ? (ad.video_metrics.retention_50 / ad.video_metrics.total_video_views) * 100 : 0 },
                              { point: "75%", retention: ad.video_metrics.total_video_views > 0 ? (ad.video_metrics.retention_75 / ad.video_metrics.total_video_views) * 100 : 0 },
                              { point: "95%", retention: ad.video_metrics.total_video_views > 0 ? (ad.video_metrics.retention_95 / ad.video_metrics.total_video_views) * 100 : 0 },
                              { point: "100%", retention: ad.video_metrics.total_video_views > 0 ? (ad.video_metrics.retention_100 / ad.video_metrics.total_video_views) * 100 : 0 },
                            ]}
                          >
                            <defs>
                              <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="point" />
                            <YAxis tickFormatter={(value) => `${Math.round(value)}%`} domain={[0, 100]} />
                            <Tooltip />
                            <Area type="monotone" dataKey="retention" stroke="hsl(var(--primary))" fill="url(#retentionGradient)" strokeWidth={3} />
                          </AreaChart>
                        </div>
                      </Card>
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-semibold mb-3">Engagement Metrics</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="p-4 text-center">
                        <MousePointer className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">Thumbstop</p>
                        <Badge variant="secondary" className="text-lg font-semibold">
                          {formatPercentage(ad.video_metrics?.thumbstop_rate || 0)}
                        </Badge>
                      </Card>
                      <Card className="p-4 text-center">
                        <Eye className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">Hold Rate</p>
                        <Badge variant="secondary" className="text-lg font-semibold">
                          {formatPercentage(ad.video_metrics?.hold_rate || 0)}
                        </Badge>
                      </Card>
                      <Card className="p-4 text-center">
                        <MousePointer className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-1">CTR</p>
                        <Badge variant="default" className="text-lg font-semibold">
                          {formatPercentage(ad.performance?.ctr || 0)}
                        </Badge>
                      </Card>
                    </div>
                  </div>
                  </div>
                </TabsContent>

                {/* Creative Insights Tab */}
                <TabsContent value="insights" className="absolute inset-0 top-12 overflow-y-scroll px-4 py-4 data-[state=inactive]:hidden">
                  {ad.analysis ? (
                    <div className="space-y-4">
                      {/* Translation/Script */}
                      {ad.analysis.translation && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Full Video Script
                          </h4>
                          <div className="p-4 bg-muted/20 rounded-lg">
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{ad.analysis.translation}</p>
                          </div>
                        </div>
                      )}

                      {/* Hook Analysis */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Hook Analysis
                          </h4>
                          <div className="space-y-3">
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                              <p className="text-sm font-medium text-primary mb-2">Hook Headline</p>
                              <p className="text-sm text-foreground leading-relaxed font-medium">{ad.analysis.hook_headline}</p>
                            </div>
                            {ad.analysis.hook_reason && (
                              <div className="p-4 bg-muted/20 rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Why This Hook Works</p>
                                <p className="text-sm text-foreground leading-relaxed">{ad.analysis.hook_reason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Target Audience
                          </h4>
                          <div className="space-y-3">
                            {ad.analysis.market_awareness && (
                              <div className="p-4 bg-muted/20 rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Market Awareness Level</p>
                                <Badge variant="secondary" className="text-sm">{ad.analysis.market_awareness}</Badge>
                              </div>
                            )}
                            {ad.analysis.avatar && (
                              <div className="p-4 bg-muted/20 rounded-lg">
                                <p className="text-sm font-medium text-muted-foreground mb-2">Audience Demographics</p>
                                <p className="text-sm text-foreground leading-relaxed">{ad.analysis.avatar}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Psychological Triggers */}
                      {ad.analysis.psychological_triggers && ad.analysis.psychological_triggers.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" />
                            Psychological Triggers
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {ad.analysis.psychological_triggers.map((trigger, index) => (
                              <div key={index} className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                                <p className="text-sm text-foreground leading-relaxed">{trigger}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pain Points */}
                      {ad.analysis.pain_points && ad.analysis.pain_points.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Target className="h-5 w-5 text-destructive" />
                            Pain Points Addressed
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {ad.analysis.pain_points.map((point, index) => (
                              <div key={index} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                <p className="text-sm text-foreground leading-relaxed">{point}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Lightbulb className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No insights available</p>
                    </div>
                  )}
                </TabsContent>

                {/* AI Variations Tab */}
                <TabsContent value="variations" className="absolute inset-0 top-12 overflow-y-scroll px-4 py-4 data-[state=inactive]:hidden">
                  <Tabs value={activeVariation} onValueChange={setActiveVariation} className="h-full flex flex-col relative">
                    <TabsList className="grid w-full gap-1 grid-cols-7 flex-shrink-0">
                      {['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7'].map((versionKey) => (
                        <TabsTrigger key={versionKey} value={versionKey} className="text-xs">
                          {versionKey.toUpperCase()}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {/* V1 - Hook Replacement */}
                    <TabsContent value="v1" className="absolute inset-0 top-10 overflow-y-scroll data-[state=inactive]:hidden">
                      {variations?.v1 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">V1 - Hook Replacement</h3>
                              <p className="text-sm text-muted-foreground">Alternative hook variations</p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAllHooks}
                              >
                                {selectedHooks.size === variations.v1.length ? 'Deselect All' : 'Select All'}
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleRegenerateVariation('v1')}
                                disabled={regeneratingVariation === 'v1'}
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                {regeneratingVariation === 'v1' ? 'Regenerating...' : 'Regenerate'}
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            {regeneratingVariation === 'v1' ? (
                              Array.from({ length: 4 }).map((_, index) => (
                                <div key={`skeleton-${index}`} className="p-4 rounded-lg border-2 border-muted">
                                  <Skeleton className="h-20 w-full" />
                                </div>
                              ))
                            ) : (
                              variations.v1.map((hook) => {
                                const isSelected = selectedHooks.has(hook.id);
                                return (
                                  <div 
                                    key={hook.id} 
                                    onClick={() => handleHookToggle(hook.id)}
                                    className={`
                                      relative p-4 rounded-lg cursor-pointer transition-all
                                      ${isSelected 
                                        ? 'bg-primary/20 border-2 border-primary' 
                                        : 'bg-primary/5 border-2 border-primary/20 hover:border-primary/40'
                                      }
                                    `}
                                  >
                                    <div className="absolute top-3 right-3">
                                      <div className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                                        ${isSelected ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30'}
                                      `}>
                                        {isSelected && (
                                          <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="mr-8 space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">
                                          Hook {hook.hook_num}
                                        </Badge>
                                      </div>
                                      
                                      <div>
                                        <h5 className="font-semibold text-xs text-muted-foreground uppercase mb-1">Script</h5>
                                        <p className="text-sm text-foreground">{hook.script}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                          <Sparkles className="h-12 w-12 text-muted-foreground" />
                          <h3 className="text-lg font-semibold">V1 - Hook Replacement</h3>
                          <Button 
                            onClick={() => handleGenerateSingleVariation('v1')}
                            disabled={regeneratingVariation === 'v1'}
                          >
                            <Sparkles className="h-5 w-5 mr-2" />
                            {regeneratingVariation === 'v1' ? 'Generating...' : 'Generate Variation'}
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    {/* V2-V7 placeholders */}
                    {['v2', 'v3', 'v4', 'v5', 'v6', 'v7'].map((versionKey) => (
                      <TabsContent key={versionKey} value={versionKey} className="absolute inset-0 top-10 overflow-y-scroll data-[state=inactive]:hidden">
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                          <Sparkles className="h-12 w-12 text-muted-foreground" />
                          <h3 className="text-lg font-semibold">{versionKey.toUpperCase()} - Variation</h3>
                          <Button 
                            onClick={() => handleGenerateSingleVariation(versionKey)}
                            disabled={regeneratingVariation === versionKey}
                          >
                            <Sparkles className="h-5 w-5 mr-2" />
                            {regeneratingVariation === versionKey ? 'Generating...' : 'Generate Variation'}
                          </Button>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </TabsContent>
              </Tabs>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

