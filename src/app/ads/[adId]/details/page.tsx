"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Area, AreaChart, XAxis, YAxis, Tooltip } from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { 
  ArrowLeft,
  Download,
  Share2,
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
  Sparkles
} from "lucide-react";
import { Ad, VideoScene, AIVariationsResponse, HookVariation, VideoSceneVariation, InstructionVariation, ImageBlocksResponse, ImageVariationsResponse } from "@/types";
import { fetchAdDetails, fetchVideoScenes, fetchAIVariations, fetchImageBlocks, fetchImageVariations } from "@/services/adDetailsService";

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
        unoptimized={true} // Disable optimization to avoid 500 errors
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

export default function AdDetails() {
  const params = useParams();
  const router = useRouter();
  const adId = params.adId as string;
  
  const [ad, setAd] = useState<Ad | null>(null);
  const [videoScenes, setVideoScenes] = useState<VideoScene[]>([]);
  const [imageBlocks, setImageBlocks] = useState<ImageBlocksResponse[]>([]);
  const [imageVariations, setImageVariations] = useState<ImageVariationsResponse[]>([]);
  const [variations, setVariations] = useState<AIVariationsResponse | null>(null);
  const [activeVariation, setActiveVariation] = useState<string>("v1");
  const [loading, setLoading] = useState(true);
  const [selectedHooks, setSelectedHooks] = useState<Set<number>>(new Set());

  // Handler to select/deselect all hooks
  const handleSelectAllHooks = () => {
    if (!variations?.v1) return;
    
    if (selectedHooks.size === variations.v1.length) {
      // If all selected, deselect all
      setSelectedHooks(new Set());
    } else {
      // Otherwise, select all
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
        
        console.log("📊 Ad Data:", adData);
        console.log("📊 Video Scenes:", scenes);
        console.log("📊 AI Variations:", adVariations);
        console.log("📊 AI Variations Type:", typeof adVariations);
        console.log("📊 AI Variations Array?:", Array.isArray(adVariations));
        console.log("📊 Image Blocks:", imgBlocks);
        console.log("📊 Image Variations:", imgVariations);
        
        setAd(adData);
        setVideoScenes(scenes);
        setImageBlocks(imgBlocks);
        setImageVariations(imgVariations);
        
        // Handle the new variations structure - it's an array of objects with v1, v2, etc.
        console.log("🔍 DEBUG: adVariations received:", adVariations);
        console.log("🔍 DEBUG: adVariations type:", typeof adVariations);
        console.log("🔍 DEBUG: adVariations is array:", Array.isArray(adVariations));
        console.log("🔍 DEBUG: adVariations length:", adVariations?.length);
        
        if (Array.isArray(adVariations) && adVariations.length > 0) {
          console.log("📊 Processing variations array:", adVariations);
          
          // The webhook returns an array of variation objects, we need to merge them
          const mergedVariations: AIVariationsResponse = {};
          
          adVariations.forEach((variationGroup, index) => {
            console.log(`📊 Processing variation group ${index}:`, variationGroup);
            console.log(`📊 Variation group keys:`, Object.keys(variationGroup));
            Object.keys(variationGroup).forEach(key => {
              if (variationGroup[key]) {
                mergedVariations[key] = variationGroup[key] as HookVariation[] | VideoSceneVariation[] | InstructionVariation[];
                console.log(`📊 Added ${key} with ${Array.isArray(variationGroup[key]) ? variationGroup[key].length : 'non-array'} items`);
              }
            });
          });
          
          console.log("📊 Final merged variations:", mergedVariations);
          console.log("📊 Available variation keys:", Object.keys(mergedVariations));
          console.log("📊 Setting variations state...");
          setVariations(mergedVariations);
          console.log("📊 Variations state set successfully");
        } else {
          console.log("📊 No variations data received from webhook");
          console.log("📊 Setting variations to null");
          setVariations(null);
        }
      } catch (error) {
        console.error("❌ Error loading ad details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadAdDetails();
  }, [adId]);

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

  // Handler to push v1 (selected hooks) to brief builder
  const handlePushHooksToBriefBuilder = () => {
    if (!variations?.v1 || selectedHooks.size === 0) {
      alert('Please select at least one hook to push to Brief Builder');
      return;
    }

    const selectedHookData = variations.v1.filter(hook => selectedHooks.has(hook.id));
    
    // Store the data in sessionStorage for Brief Builder to pick up
    const briefData = {
      adId: adId,
      adName: ad?.ad_name || ad?.creative_name,
      videoScenes: videoScenes,
      variationType: 'v1',
      selectedHooks: selectedHookData,
      adAnalysis: ad?.analysis
    };
    
    sessionStorage.setItem('briefBuilderData', JSON.stringify(briefData));
    
    // Navigate to Brief Builder
    router.push('/build-ai');
  };

  // Handler to push v2-v5 variations to brief builder
  const handlePushVariationToBriefBuilder = (variationKey: string) => {
    const variationData = variations?.[variationKey];
    if (!variationData) {
      alert('No variation data available');
      return;
    }

    // Store the data in sessionStorage for Brief Builder to pick up
    const briefData = {
      adId: adId,
      adName: ad?.ad_name || ad?.creative_name,
      videoScenes: videoScenes,
      variationType: variationKey,
      variationBlocks: variationData,
      adAnalysis: ad?.analysis
    };
    
    sessionStorage.setItem('briefBuilderData', JSON.stringify(briefData));
    
    // Navigate to Brief Builder
    router.push('/build-ai');
  };

  // Helper function to detect if ad is an image ad
  const isImageAd = (ad: Ad | null) => {
    if (!ad) return false;
    const mediaUrl = ad.analysis?.video_content_link || ad.video_url;
    if (!mediaUrl || typeof mediaUrl !== 'string') return false;
    
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const lowerUrl = mediaUrl.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('fbcdn.net');
  };

  // Test function to manually call the webhook
  const testAIVariationsWebhook = async () => {
    console.log("🧪 Testing AI Variations webhook manually...");
    try {
      const response = await fetch("https://n8n.srv931040.hstgr.cloud/webhook/9e9f944c-6bc0-45e7-9518-709490b2a167?ad_id=1", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log("🧪 Test response status:", response.status);
      const data = await response.json();
      console.log("🧪 Test response data:", data);
      console.log("🧪 Data structure:", {
        hasVariations: !!data.variations,
        variationsIsArray: Array.isArray(data.variations),
        variationsLength: data.variations?.length,
        firstVariationKeys: data.variations?.[0] ? Object.keys(data.variations[0]) : 'No first variation'
      });
      
      // Process the data the same way as in the main function
      if (data && data.variations && Array.isArray(data.variations)) {
        const mergedVariations: AIVariationsResponse = {};
        data.variations.forEach((variationGroup: Record<string, unknown>, index: number) => {
          console.log(`🧪 Processing variation group ${index}:`, Object.keys(variationGroup));
          Object.keys(variationGroup).forEach(key => {
            if (variationGroup[key]) {
              mergedVariations[key] = variationGroup[key] as HookVariation[] | VideoSceneVariation[] | InstructionVariation[];
            }
          });
        });
        console.log("🧪 Final merged variations keys:", Object.keys(mergedVariations));
        setVariations(mergedVariations);
      }
    } catch (error) {
      console.error("🧪 Test error:", error);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading ad details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!ad) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Ad not found</h3>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{ad.creative_name || `Video #${ad.id}`}</h1>
              <p className="text-muted-foreground">Video Creative Analysis • {variations ? Object.keys(variations).length : 0} variations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={testAIVariationsWebhook}>
              <Brain className="h-4 w-4" />
              Test AI Webhook
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video Player */}
          <div className="lg:col-span-1">
            <Card className="shadow-card border rounded-lg sticky top-20">
              <CardHeader className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Original Creative</span>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-4">
                  {/* Media Player - Video or Image */}
                  <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
                    {(() => {
                      // Check multiple possible sources for media content
                      const mediaUrl = ad.analysis?.video_content_link || ad.video_url;
                      
                      if (!mediaUrl) {
                        return (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-white">
                              <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm opacity-75">Media not available</p>
                            </div>
                          </div>
                        );
                      }

                      // Detect if it's an image
                      const isImage = (() => {
                        if (!mediaUrl || typeof mediaUrl !== 'string') return false;
                        const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
                        const lowerUrl = mediaUrl.toLowerCase();
                        return imageExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('fbcdn.net');
                      })();

                      // Detect if it's a video
                      const isVideo = (() => {
                        if (!mediaUrl || typeof mediaUrl !== 'string') return false;
                        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
                        const lowerUrl = mediaUrl.toLowerCase();
                        return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('supabase.co');
                      })();

                      if (isImage) {
                        return (
                          <div className="relative w-full h-full">
                            <img
                              src={mediaUrl as string}
                              alt={ad.creative_name || ad.ad_name || `Ad #${ad.id}`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                console.error("Failed to load image:", mediaUrl);
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="flex items-center justify-center h-full">
                                      <div class="text-center text-white">
                                        <svg class="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                        </svg>
                                        <p class="text-sm opacity-75">Image failed to load</p>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                            />
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-blue-500 text-white text-xs">
                                IMAGE AD
                              </Badge>
                            </div>
                          </div>
                        );
                      } else if (isVideo) {
                        return (
                          <div className="relative w-full h-full">
                            <video
                              controls
                              className="w-full h-full object-contain"
                              poster={ad.analysis?.breakdown_sheet_link || ad.thumbnail_url || ""}
                              onError={(e) => {
                                console.error("Failed to load video:", mediaUrl);
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="flex items-center justify-center h-full">
                                      <div class="text-center text-white">
                                        <svg class="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                        </svg>
                                        <p class="text-sm opacity-75">Video failed to load</p>
                                      </div>
                                    </div>
                                  `;
                                }
                              }}
                            >
                              <source src={mediaUrl as string} type="video/mp4" />
                              <source src={mediaUrl as string} type="video/webm" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="absolute top-2 left-2">
                              <Badge className="bg-red-500 text-white text-xs">
                                VIDEO AD
                              </Badge>
                            </div>
                          </div>
                        );
                      } else {
                        // Unknown format, try to render as video first, then fallback
                        return (
                          <div className="relative w-full h-full">
                            <video
                              controls
                              className="w-full h-full object-contain"
                              poster={ad.analysis?.breakdown_sheet_link || ad.thumbnail_url || ""}
                              onError={(e) => {
                                console.error("Failed to load media as video, trying as image:", mediaUrl);
                                // Try as image
                                const img = document.createElement('img');
                                img.src = mediaUrl;
                                img.className = 'w-full h-full object-contain';
                                img.alt = ad.creative_name || ad.ad_name || `Ad #${ad.id}`;
                                img.onload = () => {
                                  if (e.currentTarget.parentElement) {
                                    e.currentTarget.parentElement.innerHTML = '';
                                    e.currentTarget.parentElement.appendChild(img);
                                  }
                                };
                                img.onerror = () => {
                                  if (e.currentTarget.parentElement) {
                                    e.currentTarget.parentElement.innerHTML = `
                                      <div class="flex items-center justify-center h-full">
                                        <div class="text-center text-white">
                                          <svg class="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                          </svg>
                                          <p class="text-sm opacity-75">Media format not supported</p>
                                        </div>
                                      </div>
                                    `;
                                  }
                                };
                              }}
                            >
                              <source src={mediaUrl as string} type="video/mp4" />
                              <source src={mediaUrl as string} type="video/webm" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        );
                      }
                    })()}
                  </div>
                  
                  {/* View on Facebook Button */}
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => ad.ad_link && window.open(ad.ad_link, '_blank')}
                    disabled={!ad.ad_link}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Facebook
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Metrics */}
            <Card className="shadow-card border rounded-lg">
              <CardHeader className="px-6 py-4">
                <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">SPEND</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatCurrency(ad.performance?.spend || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ROAS</p>
                    <p className="text-2xl font-bold text-accent">
                      {ad.performance?.roas ? `${ad.performance.roas.toFixed(1)}x` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">VIEWS</p>
                    <p className="text-2xl font-bold text-foreground">
                      {formatNumber(ad.video_metrics?.total_video_views || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">CTR</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPercentage(ad.performance?.ctr || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Retention Chart */}
            {ad.video_metrics && (
              <Card className="shadow-card border rounded-lg">
                <CardHeader className="px-6 py-4">
                  <CardTitle className="text-lg font-semibold">Video Retention</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="h-[200px] w-full">
                    <AreaChart
                      width={500}
                      height={200}
                      data={[
                        { 
                          point: "0%", 
                          retention: 100,
                          viewers: ad.video_metrics?.total_video_views || 0,
                          percentage: "100.0%"
                        },
                        { 
                          point: "25%", 
                          retention: ad.video_metrics.total_video_views > 0 ? (ad.video_metrics.retention_25 / ad.video_metrics.total_video_views) * 100 : 0,
                          viewers: ad.video_metrics?.retention_25 || 0,
                          percentage: ad.video_metrics.total_video_views > 0 ? `${((ad.video_metrics.retention_25 / ad.video_metrics.total_video_views) * 100).toFixed(1)}%` : "0%"
                        },
                        { 
                          point: "50%", 
                          retention: ad.video_metrics.total_video_views > 0 ? (ad.video_metrics.retention_50 / ad.video_metrics.total_video_views) * 100 : 0,
                          viewers: ad.video_metrics?.retention_50 || 0,
                          percentage: ad.video_metrics.total_video_views > 0 ? `${((ad.video_metrics.retention_50 / ad.video_metrics.total_video_views) * 100).toFixed(1)}%` : "0%"
                        },
                        { 
                          point: "75%", 
                          retention: ad.video_metrics.total_video_views > 0 ? (ad.video_metrics.retention_75 / ad.video_metrics.total_video_views) * 100 : 0,
                          viewers: ad.video_metrics?.retention_75 || 0,
                          percentage: ad.video_metrics.total_video_views > 0 ? `${((ad.video_metrics.retention_75 / ad.video_metrics.total_video_views) * 100).toFixed(1)}%` : "0%"
                        },
                        { 
                          point: "95%", 
                          retention: ad.video_metrics.total_video_views > 0 ? (ad.video_metrics.retention_95 / ad.video_metrics.total_video_views) * 100 : 0,
                          viewers: ad.video_metrics?.retention_95 || 0,
                          percentage: ad.video_metrics.total_video_views > 0 ? `${((ad.video_metrics.retention_95 / ad.video_metrics.total_video_views) * 100).toFixed(1)}%` : "0%"
                        },
                        { 
                          point: "100%", 
                          retention: ad.video_metrics.total_video_views > 0 ? (ad.video_metrics.retention_100 / ad.video_metrics.total_video_views) * 100 : 0,
                          viewers: ad.video_metrics?.retention_100 || 0,
                          percentage: ad.video_metrics.total_video_views > 0 ? `${((ad.video_metrics.retention_100 / ad.video_metrics.total_video_views) * 100).toFixed(1)}%` : "0%"
                        },
                      ]}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <defs>
                        <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                        </linearGradient>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="hsl(var(--primary))" floodOpacity="0.3"/>
                        </filter>
                      </defs>
                      <XAxis 
                        dataKey="point"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        tickMargin={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => `${Math.round(value)}%`}
                        tickMargin={10}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                                <p className="text-sm font-medium text-foreground mb-1">
                                  Video Progress: {label}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium text-primary">{formatNumber(data.viewers)}</span> viewers ({data.percentage})
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="retention"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#retentionGradient)"
                        strokeWidth={3}
                        filter="url(#shadow)"
                        dot={{ 
                          fill: "hsl(var(--primary))", 
                          strokeWidth: 2, 
                          stroke: "hsl(var(--background))",
                          r: 4
                        }}
                        activeDot={{ 
                          r: 6, 
                          fill: "hsl(var(--primary))", 
                          stroke: "hsl(var(--background))",
                          strokeWidth: 2,
                          filter: "url(#shadow)"
                        }}
                      />
                    </AreaChart>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Engagement Metrics */}
            <Card className="shadow-card border rounded-lg">
              <CardHeader className="px-6 py-4">
                <CardTitle className="text-lg font-semibold">Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MousePointer className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Thumbstop Rate</p>
                    <Badge variant="secondary" className="text-lg font-semibold">
                      {formatPercentage(ad.video_metrics?.thumbstop_rate || 0)}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Hold Rate</p>
                    <Badge variant="secondary" className="text-lg font-semibold">
                      {formatPercentage(ad.video_metrics?.hold_rate || 0)}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <MousePointer className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Click-through Rate</p>
                    <Badge variant="default" className="text-lg font-semibold">
                      {formatPercentage(ad.performance?.ctr || 0)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Accordion Sections */}
        <Accordion type="multiple" defaultValue={["video-breakdown", "image-breakdown", "creative-insights", "image-ai-variations"]} className="space-y-4">
          {/* Video Scene Breakdown */}
          {videoScenes.length > 0 && (
            <AccordionItem value="video-breakdown" className="shadow-card border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Video Scene Breakdown ({videoScenes.length} scenes)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <div className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory">
                  {/* Horizontal Scrollable Timeline - Carousel Style */}
                  <div className="px-6 pb-6 pt-2">
                    <div className="flex gap-3 py-2">
                      {[...videoScenes]
                        .sort((a, b) => a.scene - b.scene)
                        .map((scene, index) => (
                        <div key={scene.id} className="relative flex-shrink-0">
                          {/* Connecting Line */}
                          {index < videoScenes.length - 1 && (
                            <div className="absolute top-[80px] left-full w-3 h-[2px] bg-primary z-0" />
                          )}
                          
                          {/* Scene Block - More Compact */}
                          <Card className="w-[280px] border border-primary/50 relative z-10 hover:border-primary transition-colors snap-start flex flex-col h-[480px]">
                            <CardHeader className="p-2 pb-1 bg-primary/5">
                              <div className="flex items-center justify-between">
                                <Badge className="bg-primary text-primary-foreground text-xs px-2 py-0.5">
                                  Block {scene.scene}
                                </Badge>
                                <span className="text-xs font-mono text-muted-foreground">
                                  {scene.timestamp}
                                </span>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="p-2 space-y-2 overflow-y-auto flex-1 flex flex-col">
                              {/* Screenshot */}
                              {scene.screenshot_url ? (
                                <div className="rounded overflow-hidden aspect-video flex-shrink-0">
                                  <SceneImage 
                                    src={scene.screenshot_url} 
                                    alt={`Scene ${scene.scene}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="bg-muted rounded aspect-video flex items-center justify-center flex-shrink-0">
                                  <Video className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              
                              {/* Script */}
                              <div className="flex-shrink-0">
                                <h4 className="font-semibold text-[10px] text-muted-foreground uppercase mb-0.5">Script</h4>
                                <p className="text-xs text-foreground line-clamp-3 leading-tight">{scene.script}</p>
                              </div>
                              
                              {/* Visual Description */}
                              {scene.visual && (
                                <div className="flex-shrink-0">
                                  <h4 className="font-semibold text-[10px] text-muted-foreground uppercase mb-0.5">Visual</h4>
                                  <p className="text-xs text-foreground line-clamp-2 leading-tight">{scene.visual}</p>
                                </div>
                              )}
                              
                              {/* Text Overlay */}
                              {scene.text_overlay && (
                                <div className="flex-shrink-0">
                                  <h4 className="font-semibold text-[10px] text-muted-foreground uppercase mb-0.5">Text Overlay</h4>
                                  <div className="bg-muted/50 p-1.5 rounded text-[10px] font-mono line-clamp-2 leading-tight">
                                    {scene.text_overlay}
                                  </div>
                                </div>
                              )}
                              
                              {/* Shot Type */}
                              {scene.shot_type && (
                                <div className="flex-shrink-0">
                                  <h4 className="font-semibold text-[10px] text-muted-foreground uppercase mb-0.5">Shot Type</h4>
                                  <p className="text-[10px] text-muted-foreground italic leading-tight">{scene.shot_type}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Image Blocks - Simple Grid */}
          {isImageAd(ad) && imageBlocks.length > 0 && (
            <AccordionItem value="image-breakdown" className="shadow-card border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Image Blocks ({imageBlocks[0]?.data?.length || 0})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imageBlocks[0]?.data?.map((block) => (
                    <Card key={block.id} className="border border-primary/20 hover:border-primary/40 transition-colors">
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
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Creative Insights & Analysis */}
          {ad.analysis && (
            <AccordionItem value="creative-insights" className="shadow-card border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Creative Insights & Analysis</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-8">
                  {/* Translation/Script */}
                  {ad.analysis.translation && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Full Video Script
                      </h4>
                      <div className="p-4 bg-muted/20 rounded-lg">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{ad.analysis.translation}</p>
                      </div>
                    </div>
                  )}

                  {/* Hook Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Hook Analysis
                      </h4>
                      <div className="space-y-4">
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
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Target Audience
                      </h4>
                      <div className="space-y-4">
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
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Psychological Triggers
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-destructive" />
                        Pain Points Addressed
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ad.analysis.pain_points.map((point, index) => (
                          <div key={index} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-foreground leading-relaxed">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Converting Phrases */}
                  {ad.analysis.converting_phrases && ad.analysis.converting_phrases.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-secondary" />
                        High-Converting Phrases
                      </h4>
                      <div className="space-y-3">
                        {ad.analysis.converting_phrases.map((phrase, index) => (
                          <div key={index} className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
                            <p className="text-sm text-foreground leading-relaxed font-medium italic">&ldquo;{phrase}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visual Elements */}
                  {ad.analysis.visuals_that_helped && ad.analysis.visuals_that_helped.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Key Visual Elements
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {ad.analysis.visuals_that_helped.map((visual, index) => (
                          <div key={index} className="p-3 bg-muted/20 rounded-lg">
                            <p className="text-sm text-foreground leading-relaxed">{visual}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strategic Framework */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {ad.analysis.angle && (
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="text-sm font-medium text-primary mb-2">Marketing Angle</p>
                        <p className="text-sm text-foreground leading-relaxed">{ad.analysis.angle}</p>
                      </div>
                    )}
                    {ad.analysis.format && (
                      <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                        <p className="text-sm font-medium text-secondary mb-2">Ad Format</p>
                        <p className="text-sm text-foreground leading-relaxed">{ad.analysis.format}</p>
                      </div>
                    )}
                    {ad.analysis.theme && (
                      <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                        <p className="text-sm font-medium text-accent mb-2">Messaging Theme</p>
                        <p className="text-sm text-foreground leading-relaxed">{ad.analysis.theme}</p>
                      </div>
                    )}
                  </div>

                  {/* Tonality */}
                  {ad.analysis.tonality && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        Tonality & Voice
                      </h4>
                      <div className="p-4 bg-muted/20 rounded-lg">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{ad.analysis.tonality}</p>
                      </div>
                    </div>
                  )}

                  {/* Elements to Double Down */}
                  {ad.analysis.elements_to_double_down && ad.analysis.elements_to_double_down.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-success" />
                        Elements to Double Down On
                      </h4>
                      <div className="space-y-3">
                        {ad.analysis.elements_to_double_down.map((element, index) => (
                          <div key={index} className="flex items-start gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
                            <ChevronRight className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-foreground leading-relaxed">{element}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* AI-Generated Variations Section */}
          {/* Always show for debugging - remove this condition later */}
          {true && (
            <AccordionItem value="ai-variations" className="shadow-card border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">AI-Generated Variations ({variations ? Object.keys(variations).length : 0} versions)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">

                {/* Variation Tabs */}
                <Tabs value={activeVariation} onValueChange={setActiveVariation} className="w-full">
                  <TabsList className="grid w-full gap-1 grid-cols-7">
                    {(() => {
                      console.log("🎯 RENDER DEBUG: variations state:", variations);
                      console.log("🎯 RENDER DEBUG: variations type:", typeof variations);
                      console.log("🎯 RENDER DEBUG: variations keys:", variations ? Object.keys(variations) : 'null');
                      console.log("🎯 RENDER DEBUG: variations length:", variations ? Object.keys(variations).length : 0);
                      
                      if (variations && Object.keys(variations).length > 0) {
                        return Object.keys(variations).map((versionKey) => (
                          <TabsTrigger key={versionKey} value={versionKey} className="text-xs">
                            {versionKey.toUpperCase()}
                          </TabsTrigger>
                        ));
                      } else {
                        return (
                          <div className="text-sm text-muted-foreground p-4">
                            No variations data received. Check console logs.
                          </div>
                        );
                      }
                    })()}
                  </TabsList>

                  {/* V1 - Hook Replacement */}
                  {variations?.v1 && (
                    <TabsContent value="v1" className="mt-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">V1 - Hook Replacement</h3>
                            <p className="text-sm text-muted-foreground">Alternative hook variations to improve initial engagement</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">Hook Optimization</Badge>
                              {selectedHooks.size > 0 && (
                                <Badge className="bg-primary text-primary-foreground">
                                  {selectedHooks.size} selected
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={handleSelectAllHooks}
                            >
                              {selectedHooks.size === variations.v1.length ? 'Deselect All' : 'Select All'}
                            </Button>
                            <Button 
                              variant="secondary"
                              className="gap-2"
                              onClick={handlePushHooksToBriefBuilder}
                              disabled={selectedHooks.size === 0}
                            >
                              <FileText className="h-4 w-4" />
                              Push to Brief Builder
                            </Button>
                            <Button className="gap-2">
                              <Sparkles className="h-4 w-4" />
                              Generate Creative
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {variations.v1.map((hook) => {
                            const isSelected = selectedHooks.has(hook.id);
                            return (
                              <div 
                                key={hook.id} 
                                onClick={() => handleHookToggle(hook.id)}
                                className={`
                                  relative p-4 rounded-lg cursor-pointer transition-all duration-200
                                  ${isSelected 
                                    ? 'bg-primary/20 border-2 border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
                                    : 'bg-primary/5 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/10'
                                  }
                                `}
                              >
                                {/* Selection Indicator */}
                                <div className="absolute top-3 right-3 flex items-center gap-2">
                                  <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                    ${isSelected 
                                      ? 'bg-primary border-primary' 
                                      : 'bg-background border-muted-foreground/30'
                                    }
                                  `}>
                                    {isSelected && (
                                      <svg className="w-4 h-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 mb-3 mr-8">
                                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                    Hook {hook.hook_num}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                                    Replaces: {hook.replace_scenes}
                                  </Badge>
                                </div>
                                
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="font-semibold text-xs text-muted-foreground uppercase mb-1">Script</h5>
                                    <p className="text-sm text-foreground leading-relaxed">{hook.script}</p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="font-semibold text-xs text-muted-foreground uppercase mb-1">Visual</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{hook.visual}</p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="font-semibold text-xs text-muted-foreground uppercase mb-1">Text Overlay</h5>
                                    <div className="p-2 bg-muted/50 rounded text-xs font-mono leading-relaxed whitespace-pre-line">
                                      {hook.text_overlay}
                                    </div>
                                  </div>
                                </div>

                                {/* Click to select hint */}
                                {!isSelected && (
                                  <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {selectedHooks.size > 0 && (
                          <div className="flex items-center justify-center gap-3 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <p className="text-sm font-medium text-foreground">
                              {selectedHooks.size} hook{selectedHooks.size > 1 ? 's' : ''} selected. 
                              <span className="text-muted-foreground ml-1">
                                Click &quot;Push to Brief Builder&quot; to create {selectedHooks.size} variation{selectedHooks.size > 1 ? 's' : ''} with different hooks.
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  )}

                  {/* V2-V5 - Video Scene Variations */}
                  {(['v2', 'v3', 'v4', 'v5'] as const).map((versionKey) => {
                    const versionData = variations?.[versionKey];
                    if (!versionData) return null;

                    const titles = {
                      v2: 'V2 - Video Metrics Optimization',
                      v3: 'V3 - Audit Report Summary Based',
                      v4: 'V4 - Same Script, Different Visuals',
                      v5: 'V5 - Same Visuals, Different Script'
                    };

                    const descriptions = {
                      v2: 'New ad variation optimized based on video performance metrics',
                      v3: 'Variation created from audit report summary insights',
                      v4: 'Keep the winning script but enhance with new visual elements',
                      v5: 'Maintain proven visuals while testing new script variations'
                    };

                    return (
                      <TabsContent key={versionKey} value={versionKey} className="mt-6">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{titles[versionKey]}</h3>
                              <p className="text-sm text-muted-foreground">{descriptions[versionKey]}</p>
                              <Badge variant="outline" className="mt-2">Scene Optimization</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="secondary"
                                className="gap-2"
                                onClick={() => handlePushVariationToBriefBuilder(versionKey)}
                              >
                                <FileText className="h-4 w-4" />
                                Push to Brief Builder
                              </Button>
                              <Button className="gap-2">
                                <Sparkles className="h-4 w-4" />
                                Generate Creative
                              </Button>
                            </div>
                          </div>

                          {/* Video Timeline */}
                          <div className="overflow-x-auto overflow-y-hidden scroll-smooth">
                            <div className="flex gap-3 py-2">
                              {versionData.map((scene, index) => (
                                <div key={scene.id} className="relative flex-shrink-0">
                                  {/* Connecting Line */}
                                  {index < versionData.length - 1 && (
                                    <div className="absolute top-[80px] left-full w-3 h-[2px] bg-secondary z-0" />
                                  )}
                                  
                                  {/* Scene Block */}
                                  <Card className="w-[320px] border border-secondary/50 relative z-10 hover:border-secondary transition-colors flex flex-col h-[520px]">
                                    <CardHeader className="p-3 pb-2 bg-secondary/5">
                                      <div className="flex items-center justify-between">
                                        <Badge className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5">
                                          Scene {scene.scene}
                                        </Badge>
                                        <span className="text-xs font-mono text-muted-foreground">
                                          {scene.timestamp}
                                        </span>
                                      </div>
                                    </CardHeader>
                                    
                                    <CardContent className="p-3 space-y-3 overflow-y-auto flex-1">
                              {/* Script */}
                              <div>
                                <h5 className="font-semibold text-xs text-muted-foreground uppercase mb-1">Script</h5>
                                <p className="text-xs text-foreground leading-tight">{scene.script || 'No script available'}</p>
                              </div>
                              
                              {/* Visual Description */}
                              <div>
                                <h5 className="font-semibold text-xs text-muted-foreground uppercase mb-1">Visual</h5>
                                <p className="text-xs text-foreground leading-tight">{scene.visual || 'No visual description available'}</p>
                              </div>
                                      
                                      {/* Text Overlay */}
                                      <div>
                                        <h5 className="font-semibold text-xs text-muted-foreground uppercase mb-1">Text Overlay</h5>
                                        <div className="bg-muted/50 p-2 rounded text-xs font-mono leading-tight whitespace-pre-line">
                                          {scene.text_overlay || 'No text overlay'}
                                        </div>
                                      </div>
                                      
                                      {/* Shot Type */}
                                      <div>
                                        <h5 className="font-semibold text-xs text-muted-foreground uppercase mb-1">Shot Type</h5>
                                        <p className="text-xs text-muted-foreground italic leading-tight">{scene.shot_type || 'No shot type specified'}</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    );
                  })}

                  {/* V6 & V7 - Instructions */}
                  {(['v6', 'v7'] as const).map((versionKey) => {
                    const versionData = variations?.[versionKey];
                    if (!versionData) return null;

                    const titles = {
                      v6: 'V6 - Multiple Creator Re-recording',
                      v7: 'V7 - Green Screen Production'
                    };

                    const descriptions = {
                      v6: 'Get multiple people to re-record the winning script for variety testing',
                      v7: 'Have creators use green screen technology to enhance the ad production'
                    };

                    return (
                      <TabsContent key={versionKey} value={versionKey} className="mt-6">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{titles[versionKey]}</h3>
                              <p className="text-sm text-muted-foreground">{descriptions[versionKey]}</p>
                              <Badge variant="outline" className="mt-2">Production Instructions</Badge>
                            </div>
                            <Button className="gap-2">
                              <Sparkles className="h-4 w-4" />
                              Start Production
                            </Button>
                          </div>

                          <div className="space-y-4">
                            {versionData.map((instruction, index) => (
                              <div key={index} className="p-6 bg-accent/10 border border-accent/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                  <FileText className="h-6 w-6 text-accent flex-shrink-0 mt-1" />
                                  <div>
                                    <h4 className="font-medium text-foreground mb-2">Production Instruction</h4>
                                    <p className="text-sm text-foreground leading-relaxed">{instruction.instruction}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Image AI Variations - Simple Grid */}
          {isImageAd(ad) && imageVariations.length > 0 && (
            <AccordionItem value="image-ai-variations" className="shadow-card border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Image AI Variations ({imageVariations.length} versions)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6">
                  {imageVariations.map((variation, index) => (
                    <div key={index} className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground">Variation {index + 1}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(variation.data || []).map((vItem) => (
                          <Card key={vItem.id} className="border border-primary/20 hover:border-primary/40 transition-colors">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold">{vItem.element}</CardTitle>
                                <Badge variant="outline" className="text-xs">{vItem.content_type}</Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="text-xs text-muted-foreground">Position: {vItem.position}</div>
                              {vItem.text && (
                                <div className="text-sm">
                                  <span className="font-medium text-muted-foreground">Content:</span>
                                  <div className="mt-1 p-2 bg-muted rounded text-foreground font-medium">&quot;{vItem.text}&quot;</div>
                                </div>
                              )}
                              {vItem.visual_desc && (
                                <div className="text-sm">
                                  <span className="font-medium text-muted-foreground">Visual Direction:</span>
                                  <div className="mt-1 p-2 bg-secondary/10 border border-secondary/20 rounded text-foreground leading-snug">{vItem.visual_desc}</div>
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground"><span className="font-medium">Design Notes:</span> {vItem.design_notes}</div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </AppLayout>
  );
}