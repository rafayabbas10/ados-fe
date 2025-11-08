"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/AppLayout";
import { 
  Search,
  TrendingUp,
  Target,
  Users,
  Lightbulb,
  Eye,
  Video,
  Image as ImageIcon,
  Download,
  RefreshCw,
  ChevronRight,
  Sparkles,
  BarChart3,
  Heart,
  AlertCircle,
  ExternalLink,
  Loader2,
  Brain,
  Flame,
  Zap,
  Shield,
  Smile,
  Calendar
} from "lucide-react";
import { useAccount } from "@/contexts/AccountContext";
import { toast } from "sonner";
import { 
  getResearchAds, 
  getResearchElements,
  startResearch,
  parseEmotionalDrivers,
  getTopEmotionalDrivers,
  getEmotionColor,
  type ResearchAd,
  type ResearchElement,
  type EmotionalDrivers
} from "@/services/researchService";

export default function ResearchPage() {
  const { selectedAccountId, accounts } = useAccount();
  const [researchAds, setResearchAds] = useState<ResearchAd[]>([]);
  const [researchElements, setResearchElements] = useState<ResearchElement[]>([]);
  const [selectedAd, setSelectedAd] = useState<ResearchAd | null>(null);
  const [selectedElement, setSelectedElement] = useState<ResearchElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "video" | "image">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);
  
  // Default date range: last 14 days
  const getDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14);
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };
  
  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  // Fetch research data
  useEffect(() => {
    const fetchResearchData = async () => {
      if (!selectedAccountId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [adsData, elementsData] = await Promise.all([
          getResearchAds(selectedAccountId),
          getResearchElements(selectedAccountId)
        ]);

        setResearchAds(adsData);
        setResearchElements(elementsData);
        
        // Auto-select first ad if available
        if (adsData.length > 0 && !selectedAd) {
          setSelectedAd(adsData[0]);
          // Find corresponding element
          const element = elementsData.find(el => el.research_ad_id === adsData[0].id);
          setSelectedElement(element || null);
        }
      } catch (err) {
        console.error('Error fetching research data:', err);
        setError('Failed to load research data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResearchData();
  }, [selectedAccountId]);

  // Update selected element when ad changes
  useEffect(() => {
    if (selectedAd) {
      const element = researchElements.find(el => el.research_ad_id === selectedAd.id);
      setSelectedElement(element || null);
    }
  }, [selectedAd, researchElements]);

  const filteredAds = researchAds
    .filter(ad => {
      const matchesSearch = ad.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ad.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ad.categories.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === "all" || ad.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .reverse(); // Show newest first

  const handleRefresh = async () => {
    if (!selectedAccountId) return;
    
    setLoading(true);
    setError(null);

    try {
      const [adsData, elementsData] = await Promise.all([
        getResearchAds(selectedAccountId),
        getResearchElements(selectedAccountId)
      ]);

      setResearchAds(adsData);
      setResearchElements(elementsData);
    } catch (err) {
      console.error('Error refreshing research data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartResearch = async () => {
    if (!selectedAccountId) return;
    
    setIsResearching(true);
    setError(null);
    setResearchProgress(0);

    try {
      // Remove 'act_' prefix if present
      const cleanAccountId = selectedAccountId.startsWith('act_') 
        ? selectedAccountId.substring(4) 
        : selectedAccountId;

      // Start the research
      await startResearch(cleanAccountId, dateRange.start, dateRange.end);
      
      toast.success('Research started successfully! This will take 3-5 minutes.');
      
      // Simulate progress (since the API takes 3-5 minutes)
      const progressInterval = setInterval(() => {
        setResearchProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; // Stop at 90% and wait for completion
          }
          return prev + 5;
        });
      }, 10000); // Update every 10 seconds

      // Poll for completion every 30 seconds
      const pollInterval = setInterval(async () => {
        try {
          const [adsData, elementsData] = await Promise.all([
            getResearchAds(selectedAccountId),
            getResearchElements(selectedAccountId)
          ]);

          if (adsData.length > 0) {
            // Research completed!
            clearInterval(progressInterval);
            clearInterval(pollInterval);
            setResearchProgress(100);
            setResearchAds(adsData);
            setResearchElements(elementsData);
            
            toast.success(`Research complete! Found ${adsData.length} ads with insights.`);
            
            setTimeout(() => {
              setIsResearching(false);
              setResearchProgress(0);
            }, 1000);
          }
        } catch (pollError) {
          console.error('Error polling for research completion:', pollError);
        }
      }, 30000); // Poll every 30 seconds

      // Timeout after 6 minutes
      setTimeout(() => {
        clearInterval(progressInterval);
        clearInterval(pollInterval);
        if (isResearching) {
          setIsResearching(false);
          setResearchProgress(0);
          setError('Research is taking longer than expected. Please refresh the page in a few minutes.');
        }
      }, 360000); // 6 minutes

    } catch (err) {
      console.error('Error starting research:', err);
      const errorMessage = 'Failed to start research. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsResearching(false);
      setResearchProgress(0);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Search className="h-8 w-8 text-primary" />
              Ad Research Library
            </h1>
            <p className="text-muted-foreground mt-1">
              Discover competitor ads, emotional drivers, and creative insights for {selectedAccount?.account_name || "your brand"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button className="gap-2" disabled={researchAds.length === 0}>
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="ml-auto"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="shadow-card border">
            <CardContent className="p-12 flex flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Loading Research Data...</h3>
              <p className="text-sm text-muted-foreground">Fetching ads and insights for your account</p>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        {!loading && researchAds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Ads</p>
                    <p className="text-2xl font-bold text-foreground">{researchAds.length}</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Video Ads</p>
                    <p className="text-2xl font-bold text-foreground">
                      {researchAds.filter(ad => ad.type === 'video').length}
                    </p>
                  </div>
                  <Video className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Image Ads</p>
                    <p className="text-2xl font-bold text-foreground">
                      {researchAds.filter(ad => ad.type === 'image').length}
                    </p>
                  </div>
                  <ImageIcon className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">With Insights</p>
                    <p className="text-2xl font-bold text-foreground">{researchElements.length}</p>
                  </div>
                  <Brain className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter */}
        {!loading && researchAds.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ads by name, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                size="sm"
              >
                All ({researchAds.length})
              </Button>
              <Button
                variant={filterType === "video" ? "default" : "outline"}
                onClick={() => setFilterType("video")}
                size="sm"
                className="gap-2"
              >
                <Video className="h-4 w-4" />
                Video ({researchAds.filter(a => a.type === "video").length})
              </Button>
              <Button
                variant={filterType === "image" ? "default" : "outline"}
                onClick={() => setFilterType("image")}
                size="sm"
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Image ({researchAds.filter(a => a.type === "image").length})
              </Button>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        {!loading && researchAds.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Ads List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Research Ads ({filteredAds.length})
              </h2>
              <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                {filteredAds.map((ad) => {
                  const hasElement = researchElements.some(el => el.research_ad_id === ad.id);
                  const imageUrl = ad.type === 'image' ? ad.image_link : ad.thumbnail;
                  
                  return (
                    <Card
                      key={ad.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedAd?.id === ad.id ? "border-primary border-2" : "border-border"
                      }`}
                      onClick={() => setSelectedAd(ad)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-muted">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={ad.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {ad.type === "video" ? (
                                  <Video className="h-8 w-8 text-muted-foreground" />
                                ) : (
                                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                )}
                              </div>
                            )}
                            <div className="absolute top-1 left-1">
                              <Badge className="text-xs" variant={ad.type === "video" ? "destructive" : "secondary"}>
                                {ad.type === "video" ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                              </Badge>
                            </div>
                            {hasElement && (
                              <div className="absolute bottom-1 right-1">
                                <Badge className="text-xs bg-primary/90" variant="default">
                                  <Sparkles className="h-2 w-2" />
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">
                              {ad.name}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {ad.description}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {ad.categories && ad.categories.split(',').slice(0, 2).map((cat, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {cat.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Right: Detailed Analysis */}
            <div className="lg:col-span-2">
              {selectedAd ? (
                <div className="space-y-6">
                  {/* Media Player & Ad Info Combined Card */}
                  <Card className="shadow-card border">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
                        {/* Left: Media Player */}
                        <div className="space-y-3">
                          {/* Media Player - Video or Image */}
                          <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
                            {(() => {
                              const mediaUrl = selectedAd.type === 'image' ? selectedAd.image_link : selectedAd.video_link;
                              
                              if (!mediaUrl) {
                                return (
                                  <div className="flex items-center justify-center h-full">
                                    <div className="text-center text-white">
                                      {selectedAd.type === 'video' ? (
                                        <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                      ) : (
                                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                      )}
                                      <p className="text-sm opacity-75">Media not available</p>
                                    </div>
                                  </div>
                                );
                              }

                              if (selectedAd.type === 'image') {
                                return (
                                  <div className="relative w-full h-full">
                                    <img
                                      key={selectedAd.id}
                                      src={mediaUrl}
                                      alt={selectedAd.name}
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
                              } else {
                                return (
                                  <div className="relative w-full h-full">
                                    <video
                                      key={selectedAd.id}
                                      controls
                                      className="w-full h-full object-contain"
                                      poster={selectedAd.thumbnail || ""}
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
                                      <source src={mediaUrl} type="video/mp4" />
                                      <source src={mediaUrl} type="video/webm" />
                                      Your browser does not support the video tag.
                                    </video>
                                    <div className="absolute top-2 left-2">
                                      <Badge className="bg-red-500 text-white text-xs">
                                        VIDEO AD
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            {selectedAd.product_link && selectedAd.product_link !== 'http://fb.me/' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-1 gap-1 text-xs"
                                onClick={() => window.open(selectedAd.product_link, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                                Product
                              </Button>
                            )}
                            {selectedAd.video_link && selectedAd.type === 'video' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="flex-1 gap-1 text-xs"
                                onClick={() => window.open(selectedAd.video_link!, '_blank')}
                              >
                                <Video className="h-3 w-3" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Right: Ad Details */}
                        <div className="space-y-4">
                          <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">{selectedAd.name}</h2>
                            <p className="text-sm text-muted-foreground">{selectedAd.description}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Target Market</p>
                              <Badge variant="default" className="uppercase">{selectedAd.target_market}</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Product Category</p>
                              <Badge variant="secondary">{selectedAd.product_category}</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Creative Targeting</p>
                              <p className="text-xs text-foreground">{selectedAd.creative_targeting}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Ad Type</p>
                              <Badge variant={selectedAd.type === 'video' ? 'destructive' : 'secondary'} className="uppercase">
                                {selectedAd.type}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Categories</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedAd.categories.split(',').map((cat, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {cat.trim()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Niches</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedAd.niches.split(',').map((niche, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {niche.trim()}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                {/* Tabs for Detailed Analysis */}
                <Tabs defaultValue="elements" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="elements" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Research Elements
                    </TabsTrigger>
                    <TabsTrigger value="emotions" className="gap-2">
                      <Flame className="h-4 w-4" />
                      Emotional Drivers
                    </TabsTrigger>
                    <TabsTrigger value="details" className="gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Creative Details
                    </TabsTrigger>
                  </TabsList>

                  {/* Research Elements Tab */}
                  <TabsContent value="elements" className="space-y-4 mt-4">
                    {selectedElement ? (
                      <Card className="shadow-card border">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5 text-primary" />
                            Strategic Research Elements
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Users className="h-5 w-5 text-primary" />
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Target Avatar</h3>
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">{selectedElement.Avatar}</p>
                            </CardContent>
                          </Card>

                          <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Eye className="h-5 w-5 text-blue-500" />
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Awareness Level</h3>
                              </div>
                              <Badge variant="default" className="text-sm">{selectedElement.Awareness}</Badge>
                            </CardContent>
                          </Card>

                          <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Target className="h-5 w-5 text-purple-500" />
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Marketing Angle</h3>
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">{selectedElement.Angle}</p>
                            </CardContent>
                          </Card>

                          <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Lightbulb className="h-5 w-5 text-green-500" />
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Ad Format</h3>
                              </div>
                              <p className="text-sm text-foreground">{selectedElement.Format}</p>
                            </CardContent>
                          </Card>

                          <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="h-5 w-5 text-orange-500" />
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Theme</h3>
                              </div>
                              <p className="text-sm text-foreground">{selectedElement.Theme}</p>
                            </CardContent>
                          </Card>

                          <Card className="border-2 border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent">
                            <CardContent className="p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Smile className="h-5 w-5 text-pink-500" />
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Tonality</h3>
                              </div>
                              <p className="text-sm text-foreground">{selectedElement.Tonality}</p>
                            </CardContent>
                          </Card>

                          {selectedElement.Hook && (
                            <Card className="md:col-span-2 border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10">
                              <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-3">
                                  <Zap className="h-5 w-5 text-primary" />
                                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">Hook</h3>
                                </div>
                                <p className="text-base font-medium text-foreground italic">&quot;{selectedElement.Hook}&quot;</p>
                              </CardContent>
                            </Card>
                          )}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="shadow-card border">
                        <CardContent className="p-12 flex flex-col items-center justify-center">
                          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold text-foreground mb-2">No Research Elements Available</h3>
                          <p className="text-sm text-muted-foreground text-center">
                            Strategic insights haven&apos;t been generated for this ad yet.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Emotional Drivers Tab */}
                  <TabsContent value="emotions" className="space-y-4 mt-4">
                    <Card className="shadow-card border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Flame className="h-5 w-5 text-primary" />
                          Emotional Drivers Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const emotionalDrivers = parseEmotionalDrivers(selectedAd.emotional_drivers);
                          const topDrivers = getTopEmotionalDrivers(emotionalDrivers, 10);
                          
                          return topDrivers.length > 0 ? (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {topDrivers.map((driver) => (
                                  <Card 
                                    key={driver.name} 
                                    className="border-2 transition-all hover:shadow-md"
                                    style={{ 
                                      borderColor: getEmotionColor(driver.name) + '40',
                                      backgroundColor: getEmotionColor(driver.name) + '08'
                                    }}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold capitalize text-foreground">
                                          {driver.name}
                                        </h3>
                                        <Badge 
                                          style={{ 
                                            backgroundColor: getEmotionColor(driver.name) + '20',
                                            color: getEmotionColor(driver.name),
                                            border: `1px solid ${getEmotionColor(driver.name)}40`
                                          }}
                                        >
                                          {driver.value}
                                        </Badge>
                                      </div>
                                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                        <div 
                                          className="h-full transition-all rounded-full"
                                          style={{ 
                                            width: `${(driver.value / 10) * 100}%`,
                                            backgroundColor: getEmotionColor(driver.name)
                                          }}
                                        />
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <p className="text-sm text-muted-foreground">No emotional drivers data available</p>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Creative Details Tab */}
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <Card className="shadow-card border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-primary" />
                          Creative Targeting & Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Creative Targeting
                            </h3>
                            <Card className="border-2 border-primary/20 bg-primary/5">
                              <CardContent className="p-4">
                                <p className="text-sm text-foreground">{selectedAd.creative_targeting}</p>
                              </CardContent>
                            </Card>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Target Market
                            </h3>
                            <Card className="border-2 border-blue-500/20 bg-blue-500/5">
                              <CardContent className="p-4">
                                <Badge variant="default" className="uppercase text-sm">
                                  {selectedAd.target_market}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-2">Market Segment</p>
                              </CardContent>
                            </Card>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Product Category</h3>
                            <Card className="border-2 border-green-500/20 bg-green-500/5">
                              <CardContent className="p-4">
                                <p className="text-sm font-medium text-foreground">{selectedAd.product_category}</p>
                              </CardContent>
                            </Card>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Ad Type</h3>
                            <Card className="border-2 border-purple-500/20 bg-purple-500/5">
                              <CardContent className="p-4">
                                <Badge variant={selectedAd.type === 'video' ? 'destructive' : 'secondary'} className="uppercase text-sm">
                                  {selectedAd.type}
                                </Badge>
                                {selectedAd.video_duration && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Duration: {Math.floor(selectedAd.video_duration / 60)}:{String(selectedAd.video_duration % 60).padStart(2, '0')} min
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        {selectedAd.transcription && (
                          <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                              <ChevronRight className="h-4 w-4" />
                              Video Transcription
                            </h3>
                            <Card className="border-2 border-accent/20 bg-accent/5">
                              <CardContent className="p-4">
                                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedAd.transcription}</p>
                              </CardContent>
                            </Card>
                          </div>
                        )}

                        <div>
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">Categories & Niches</h3>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Categories</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedAd.categories.split(',').map((cat, i) => (
                                  <Badge key={i} variant="outline">{cat.trim()}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Niches</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedAd.niches.split(',').map((niche, i) => (
                                  <Badge key={i} variant="secondary">{niche.trim()}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
                </div>
              ) : (
                <Card className="shadow-card border h-full">
                  <CardContent className="flex items-center justify-center h-[600px]">
                    <div className="text-center">
                      <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Select an ad to view insights
                      </h3>
                      <p className="text-muted-foreground">
                        Click on any ad from the list to see the media player, research elements, emotional drivers, and creative details
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Empty State - Start Research */}
        {!loading && researchAds.length === 0 && !isResearching && (
          <Card className="shadow-card border">
            <CardContent className="p-16 flex flex-col items-center justify-center">
              <div className="rounded-full bg-primary/10 p-6 mb-6">
                <Brain className="h-16 w-16 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Start Ad Research</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                {selectedAccount 
                  ? `No research data available for ${selectedAccount.account_name}. Start analyzing ads to discover winning patterns and insights.`
                  : 'Please select an account to start research.'}
              </p>
              
              {selectedAccount && (
                <div className="w-full max-w-md space-y-4">
                  {/* Date Range Inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Start Date
                      </label>
                      <Input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        End Date
                      </label>
                      <Input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={handleStartResearch} 
                      variant="default" 
                      className="flex-1 gap-2"
                      size="lg"
                    >
                      <Sparkles className="h-5 w-5" />
                      Start Research
                    </Button>
                    <Button 
                      onClick={handleRefresh} 
                      variant="outline" 
                      className="gap-2"
                      size="lg"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    ⏱️ Research typically takes 3-5 minutes to complete
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Research In Progress */}
        {isResearching && (
          <Card className="shadow-card border">
            <CardContent className="p-16 flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="rounded-full bg-primary/10 p-6">
                  <Brain className="h-16 w-16 text-primary animate-pulse" />
                </div>
                <Loader2 className="h-8 w-8 text-primary animate-spin absolute -top-2 -right-2" />
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-3">Research In Progress...</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Analyzing ads for {selectedAccount?.account_name}. This will take 3-5 minutes.
              </p>
              
              {/* Progress Bar */}
              <div className="w-full max-w-md space-y-3">
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                    style={{ width: `${researchProgress}%` }}
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {researchProgress}% Complete
                </p>
              </div>

              <p className="text-xs text-muted-foreground text-center mt-6">
                Please don&apos;t close this page. We&apos;ll automatically refresh when complete.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

