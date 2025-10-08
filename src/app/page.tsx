"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppLayout } from "@/components/AppLayout";
import { useAccount } from "@/contexts/AccountContext";
import { 
  FileText, 
  Play, 
  BarChart3,
  Calendar,
  Plus,
  RefreshCw
} from "lucide-react";
import { AuditReport } from "@/types";
import { fetchReportsByAccountId } from "@/services/reportsService";

// Interface for top performing ads from webhook
interface TopPerformingAd {
  id: number;
  name: string;
  link: string;
  spend: number;
  roas: number;
  total_views: number;
  ad_video_link: string;
  ad_type: string;
}

export default function Dashboard() {
  const { selectedAccountId, accounts } = useAccount();
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [topAds, setTopAds] = useState<TopPerformingAd[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingAds, setRefreshingAds] = useState(false);
  const [mediaLoadingStates, setMediaLoadingStates] = useState<Record<string, boolean>>({});
  const [mediaErrorStates, setMediaErrorStates] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    accountId: '',
    startDate: '',
    endDate: '',
    topAdsCount: '10'
  });

  // Function to refresh reports data
  const refreshReports = async (accountId: string, silent: boolean = true) => {
    if (silent) {
      setRefreshing(true);
    }
    
    try {
      console.log("🔄 Refreshing reports for account:", accountId);
      const reportsData = await fetchReportsByAccountId(accountId);
      setReports(reportsData);
      console.log("✅ Reports refreshed:", reportsData.length);
    } catch (error) {
      console.error("❌ Failed to refresh reports:", error);
    } finally {
      if (silent) {
        setRefreshing(false);
      }
    }
  };

  // Function to refresh top ads data
  const refreshTopAds = async (accountId: string, silent: boolean = true) => {
    if (silent) {
      setRefreshingAds(true);
    }
    
    try {
      console.log("🎯 Refreshing top ads for account:", accountId);
      const topAdsData = await fetchTopPerformingAds(accountId);
      setTopAds(topAdsData);
      console.log("✅ Top ads refreshed:", topAdsData.length);
    } catch (error) {
      console.error("❌ Failed to refresh top ads:", error);
    } finally {
      if (silent) {
        setRefreshingAds(false);
      }
    }
  };

  // Function to fetch top performing ads
  const fetchTopPerformingAds = async (accountId: string) => {
    try {
      console.log("🎯 Loading top performing ads for account:", accountId);
      
      // Remove 'act_' prefix if present for the webhook call
      const cleanAccountId = accountId.startsWith('act_') ? accountId.substring(4) : accountId;
      
      const params = new URLSearchParams({
        accountId: cleanAccountId
      });
      
      const webhookUrl = `https://n8n.srv931040.hstgr.cloud/webhook/3fb936fa-2dd7-440c-9f16-d77ea2921754?${params.toString()}`;
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check if response has content before parsing JSON
      const responseText = await response.text();
      console.log("📄 Raw response text:", responseText);
      
      if (!responseText || responseText.trim() === '') {
        console.log("⚠️ Empty response from top ads webhook");
        return [];
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log("✅ Top ads webhook response:", result);
      } catch (parseError) {
        console.error("❌ Failed to parse JSON response:", parseError);
        console.error("📄 Response text that failed to parse:", responseText);
        return [];
      }
      
      // Process the webhook response
      if (Array.isArray(result)) {
        return result as TopPerformingAd[];
      }
      
      return [];
      
    } catch (error) {
      console.error("❌ Failed to fetch top performing ads:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!selectedAccountId) {
        setDashboardLoading(false);
        setAdsLoading(false);
        return;
      }

      setDashboardLoading(true);
      setAdsLoading(true);
      
      try {
        console.log("📊 Loading dashboard data for account:", selectedAccountId);
        
        // Load reports and top ads in parallel
        const [reportsData, topAdsData] = await Promise.all([
          fetchReportsByAccountId(selectedAccountId),
          fetchTopPerformingAds(selectedAccountId)
        ]);
        
        setReports(reportsData);
        setTopAds(topAdsData);
        
        // Reset media loading states when new ads are loaded
        setMediaLoadingStates({});
        setMediaErrorStates({});
        
        console.log("✅ Dashboard data loaded:", { 
          reports: reportsData.length, 
          topAds: topAdsData.length 
        });
      } catch (error) {
        console.error("❌ Failed to load dashboard data:", error);
      } finally {
        setDashboardLoading(false);
        setAdsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [selectedAccountId]);

  // Auto-refresh reports every 60 seconds
  useEffect(() => {
    if (!selectedAccountId) return;

    console.log("🔄 Setting up auto-refresh for reports every 60 seconds");
    
    const interval = setInterval(() => {
      refreshReports(selectedAccountId, true);
    }, 60000); // 60 seconds

    // Cleanup interval on unmount or when account changes
    return () => {
      console.log("🧹 Cleaning up reports auto-refresh interval");
      clearInterval(interval);
    };
  }, [selectedAccountId]);

  // Auto-refresh top ads every 60 seconds
  useEffect(() => {
    if (!selectedAccountId) return;

    console.log("🎯 Setting up auto-refresh for top ads every 60 seconds");
    
    const interval = setInterval(() => {
      refreshTopAds(selectedAccountId, true);
    }, 60000); // 60 seconds

    // Cleanup interval on unmount or when account changes
    return () => {
      console.log("🧹 Cleaning up top ads auto-refresh interval");
      clearInterval(interval);
    };
  }, [selectedAccountId, refreshTopAds]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'processing':
        return 'bg-blue-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      case 'active':
        return 'bg-green-500 text-white';
      case 'paused':
        return 'bg-yellow-500 text-black';
      case 'disabled':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getRoasColor = (roas: number) => {
    if (roas >= 4) return 'text-green-600';
    if (roas >= 3) return 'text-blue-600';
    if (roas >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateRange = (start: string, end: string) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Utility function to detect if ad_video_link is actually an image
  const isImageUrl = (url: string | null) => {
    if (!url) return false;
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('fbcdn.net');
  };

  // Utility function to detect if it's a video
  const isVideoUrl = (url: string | null) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('supabase.co');
  };

  // Helper functions for media loading states
  const setMediaLoading = (adId: string, isLoading: boolean) => {
    setMediaLoadingStates(prev => ({ ...prev, [adId]: isLoading }));
  };

  const setMediaError = (adId: string, hasError: boolean) => {
    setMediaErrorStates(prev => ({ ...prev, [adId]: hasError }));
  };

  const isMediaLoading = (adId: string) => mediaLoadingStates[adId] || false;
  const hasMediaError = (adId: string) => mediaErrorStates[adId] || false;

  // Set default account when modal opens
  useEffect(() => {
    if (selectedAccountId && !formData.accountId) {
      setFormData(prev => ({ ...prev, accountId: selectedAccountId }));
    }
  }, [selectedAccountId, formData.accountId]);

  const handleGenerateReport = async (formValues: typeof formData) => {
    setGenerating(true);
    try {
      console.log("🚀 Generating report with data:", formValues);
      
      // Build query parameters
      const params = new URLSearchParams({
        accountId: formValues.accountId,
        startDate: formValues.startDate,
        endDate: formValues.endDate,
        topAdsCount: formValues.topAdsCount
      });
      
      // Call the webhook
      const webhookUrl = `https://n8n.srv931040.hstgr.cloud/webhook/18a6d4cf-023f-46da-afe0-5d4c4f4bae72?${params.toString()}`;
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("✅ Webhook response:", result);
      console.log("✅ Report generation started");
      
      setModalOpen(false);
      
      // Refresh reports after generation
      if (selectedAccountId) {
        await refreshReports(selectedAccountId, false);
      }
    } catch (error) {
      console.error("❌ Failed to start report generation:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accountId || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields');
      return;
    }
    handleGenerateReport(formData);
  };

  const handleOpenModal = () => {
    setFormData({
      accountId: selectedAccountId || '',
      startDate: '',
      endDate: '',
      topAdsCount: '10'
    });
    setModalOpen(true);
  };

  if (dashboardLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        {!selectedAccountId ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Select an Account</h3>
              <p className="text-muted-foreground">
                Please select an ad account from the sidebar to view your dashboard
              </p>
            </div>
          </div>
        ) : (
          <>
              {/* Page Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground text-lg">
                      Top performing creatives and audit reports
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Creatives Section */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">Top Performing Creatives</h2>
                    {refreshingAds && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Refreshing...</span>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" className="gap-2">
                    View All
                  </Button>
                </div>

                {adsLoading ? (
                  <div className="flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading top performing creatives...</p>
                    </div>
                  </div>
                ) : topAds.length === 0 ? (
                  <Card className="shadow-card">
                    <CardContent className="p-12 text-center">
                      <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Top Performing Creatives Yet</h3>
                      <p className="text-muted-foreground">
                        Top performing creatives will appear here once data is available.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    {topAds.map((ad) => (
                      <Card 
                        key={ad.id} 
                        className="shadow-card hover:shadow-floating transition-all duration-300 hover:scale-[1.02] group cursor-pointer overflow-hidden border border-border hover:border-primary/50 bg-gradient-to-br from-card to-card/80"
                        onClick={() => window.location.href = `/ads/${encodeURIComponent(ad.id.toString())}/details`}
                      >
                        <CardHeader className="p-0 pb-0">
                          {/* Creative Thumbnail */}
                          <div className="relative bg-muted/50 aspect-video flex items-center justify-center overflow-hidden">
                            {ad.ad_video_link ? (
                              isImageUrl(ad.ad_video_link) ? (
                                // Render as image
                                <div className="relative w-full h-full">
                                  {/* Loading spinner overlay */}
                                  {isMediaLoading(ad.id.toString()) && (
                                    <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
                                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                                    </div>
                                  )}
                                  
                                  {/* Error state */}
                                  {hasMediaError(ad.id.toString()) && (
                                    <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
                                      <Play className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                  )}
                                  
                                  <img 
                                    src={ad.ad_video_link}
                                    alt={ad.name}
                                    className="w-full h-full object-cover"
                                    onLoadStart={() => {
                                      setMediaLoading(ad.id.toString(), true);
                                      setMediaError(ad.id.toString(), false);
                                    }}
                                    onLoad={() => {
                                      setMediaLoading(ad.id.toString(), false);
                                    }}
                                    onError={() => {
                                      setMediaLoading(ad.id.toString(), false);
                                      setMediaError(ad.id.toString(), true);
                                    }}
                                    style={{ 
                                      display: hasMediaError(ad.id.toString()) ? 'none' : 'block'
                                    }}
                                  />
                                  
                                  {/* Hover overlay - only show when not loading and no error */}
                                  {!isMediaLoading(ad.id.toString()) && !hasMediaError(ad.id.toString()) && (
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Play className="h-8 w-8 text-white" />
                                    </div>
                                  )}
                                </div>
                              ) : isVideoUrl(ad.ad_video_link) ? (
                                // Render as video
                                <div className="relative w-full h-full">
                                  {/* Loading spinner overlay */}
                                  {isMediaLoading(ad.id.toString()) && (
                                    <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
                                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                                    </div>
                                  )}
                                  
                                  {/* Error state */}
                                  {hasMediaError(ad.id.toString()) && (
                                    <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
                                      <Play className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                  )}
                                  
                                  <video 
                                    className="w-full h-full object-cover"
                                    poster=""
                                    muted
                                    onLoadStart={() => {
                                      setMediaLoading(ad.id.toString(), true);
                                      setMediaError(ad.id.toString(), false);
                                    }}
                                    onCanPlay={() => {
                                      setMediaLoading(ad.id.toString(), false);
                                    }}
                                    onError={() => {
                                      setMediaLoading(ad.id.toString(), false);
                                      setMediaError(ad.id.toString(), true);
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isMediaLoading(ad.id.toString()) && !hasMediaError(ad.id.toString())) {
                                        const video = e.currentTarget;
                                        video.play().catch(() => {
                                          // Ignore play errors (e.g., AbortError)
                                        });
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      const video = e.currentTarget;
                                      video.pause();
                                      video.currentTime = 0;
                                    }}
                                    style={{ 
                                      display: hasMediaError(ad.id.toString()) ? 'none' : 'block'
                                    }}
                                  >
                                    <source src={ad.ad_video_link} type="video/mp4" />
                                  </video>
                                </div>
                              ) : (
                                // Unknown format fallback
                                <div className="flex items-center justify-center">
                                  <Play className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              )
                            ) : (
                              <Play className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                            )}
                            
                            {/* Ad Type Badge */}
                            <div className="absolute top-1.5 right-1.5">
                              <Badge className={`text-white text-[9px] py-0.5 px-1.5 uppercase font-semibold shadow-lg ${
                                ad.ad_type === 'video' ? 'bg-red-500/90 backdrop-blur-sm' :
                                ad.ad_type === 'image' ? 'bg-blue-500/90 backdrop-blur-sm' :
                                ad.ad_type === 'carousel' ? 'bg-purple-500/90 backdrop-blur-sm' :
                                ad.ad_type === 'collection' ? 'bg-orange-500/90 backdrop-blur-sm' :
                                'bg-gray-500/90 backdrop-blur-sm'
                              }`}>
                                {ad.ad_type || 'UNKNOWN'}
                              </Badge>
                            </div>
                            
                            {/* View Details Hint */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-md font-medium text-xs shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                                View Details
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-3 space-y-2.5">
                          {/* Ad Name */}
                          <h3 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight min-h-[2rem]">
                            {ad.name}
                          </h3>
                          
                          {/* ROAS - Featured Metric */}
                          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-md p-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground font-medium">ROAS</span>
                              <div className={`text-xl font-bold ${getRoasColor(ad.roas)}`}>
                                {ad.roas.toFixed(1)}x
                              </div>
                            </div>
                          </div>

                          {/* Key Metrics Grid */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                <span className="w-1 h-1 bg-primary rounded-full"></span>
                                Spend
                              </p>
                              <p className="font-bold text-xs text-foreground">
                                {formatCurrency(ad.spend)}
                              </p>
                            </div>
                            
                            <div className="space-y-0.5">
                              <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                <span className="w-1 h-1 bg-accent rounded-full"></span>
                                Views
                              </p>
                              <p className="font-bold text-xs text-foreground">
                                {(ad.total_views / 1000).toFixed(1)}K
                              </p>
                            </div>
                          </div>
                          
                          {/* View on Platform Link */}
                          <div className="pt-1.5 border-t border-border/50">
                            <a 
                              href={ad.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-primary hover:text-primary-hover font-medium flex items-center gap-1 group/link"
                            >
                              <span>View on Facebook</span>
                              <svg className="w-2.5 h-2.5 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Reports Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold text-foreground">Audit Reports</h2>
                    {refreshing && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Refreshing...</span>
                      </div>
                    )}
                  </div>
                  <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-gradient-primary hover:opacity-90 transition-opacity gap-2"
                        onClick={handleOpenModal}
                        disabled={generating}
                      >
                        {generating ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Generate Report
                          </>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Generate New Audit Report</DialogTitle>
                        <DialogDescription>
                          Configure the parameters for your new audit report.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmitForm} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="account">Ad Account *</Label>
                          <Select 
                            value={formData.accountId} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select an account" />
                            </SelectTrigger>
                            <SelectContent>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.account_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date *</Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endDate">End Date *</Label>
                            <Input
                              id="endDate"
                              type="date"
                              value={formData.endDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="topAdsCount">Number of Top Ads</Label>
                          <Select 
                            value={formData.topAdsCount} 
                            onValueChange={(value) => setFormData(prev => ({ ...prev, topAdsCount: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 ads</SelectItem>
                              <SelectItem value="10">10 ads</SelectItem>
                              <SelectItem value="15">15 ads</SelectItem>
                              <SelectItem value="20">20 ads</SelectItem>
                              <SelectItem value="25">25 ads</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <DialogFooter>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setModalOpen(false)}
                            disabled={generating}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="bg-gradient-primary hover:opacity-90 transition-opacity"
                            disabled={generating}
                          >
                            {generating ? (
                              <>
                                <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Generating...
                              </>
                            ) : (
                              'Generate Report'
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {reports.length === 0 ? (
                  <Card className="shadow-card">
                    <CardContent className="p-12 text-center">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Audit Reports Generated Yet</h3>
                      <p className="text-muted-foreground mb-6">Generate your first audit report to analyze ad performance.</p>
                      <Button 
                        className="bg-gradient-primary hover:opacity-90 transition-opacity gap-2"
                        onClick={handleOpenModal}
                        disabled={generating}
                      >
                        {generating ? (
                          <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Generate Report
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <Card 
                        key={report.id} 
                        className="shadow-card hover:shadow-elevated transition-all duration-200 group"
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                Report #{report.id}
                              </CardTitle>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span className="text-sm">{formatDateRange(report.from_date, report.to_date)}</span>
                                </div>
                                <Badge className={getStatusColor(report.status)}>
                                  {report.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Created</p>
                              <p className="font-medium">{formatDate(report.created_at)}</p>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <Button 
                            className="bg-gradient-primary hover:opacity-90 transition-opacity cursor-pointer"
                            onClick={() => window.location.href = `/reports/${report.id}`}
                            disabled={report.status === 'processing'}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {report.status === 'processing' ? 'Processing...' : 'View Report Details'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
          </>
        )}
    </div>
    </AppLayout>
  );
}