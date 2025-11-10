"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/AppLayout";
import { AnalysisProgressStepper } from "@/components/AnalysisProgressStepper";
import { useAccount } from "@/contexts/AccountContext";
import { 
  FileText, 
  Play, 
  BarChart3,
  Calendar,
  Plus,
  RefreshCw,
  Search,
  Send,
  Image as ImageIcon,
  Eye,
  DollarSign,
  ExternalLink,
  Brain,
  Target,
  TrendingUp,
  Users,
  Sparkles
} from "lucide-react";
import { AuditReport, ReportSummary } from "@/types";
import { fetchReportsByAccountId, fetchReportSummary } from "@/services/reportsService";
import { fetchCreativesByAccountId, Creative } from "@/services/creativesService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  const [allCreatives, setAllCreatives] = useState<Creative[]>([]);
  const [auditSummary, setAuditSummary] = useState<ReportSummary | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [adsLoading, setAdsLoading] = useState(true);
  const [creativesLoading, setCreativesLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingAds, setRefreshingAds] = useState(false);
  const [mediaLoadingStates, setMediaLoadingStates] = useState<Record<string, boolean>>({});
  const [mediaErrorStates, setMediaErrorStates] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedHooks, setExpandedHooks] = useState<Set<number>>(new Set());
  const [selectedCreativeIds, setSelectedCreativeIds] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    accountId: '',
    startDate: '',
    endDate: '',
    topAdsCount: '10'
  });

  // Column widths state for creatives table
  const [columnWidths, setColumnWidths] = useState({
    select: 50,
    icon: 48,
    name: 180,
    hook: 280,
    type: 80,
    spend: 96,
    roas: 80,
    views: 96,
    thumbstop: 96,
    holdRate: 96,
    ctr: 80,
    actions: 160
  });
  
  const [resizing, setResizing] = useState<string | null>(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Get the latest audit report
  const latestReport = reports.length > 0 
    ? reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  // Determine if we should show the progress section (only show for in-progress stages, not when complete)
  const showProgressSection = latestReport && 
    ['processing initiated', 'ad analysis complete', 'ad blocks created', 'summary created'].includes(latestReport.status);

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
      
      // If we have a latest report with summary, fetch it
      if (reportsData.length > 0) {
        const latest = reportsData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        // Only fetch summary if report is at summary stage or complete
        if (latest.status === 'summary created' || latest.status === 'complete') {
          await fetchSummaryForReport(latest.id);
        }
      }
    } catch (error) {
      console.error("❌ Failed to refresh reports:", error);
    } finally {
      if (silent) {
        setRefreshing(false);
      }
    }
  };

  // Function to fetch summary for a report
  const fetchSummaryForReport = async (reportId: number) => {
    try {
      setSummaryLoading(true);
      const summaryData = await fetchReportSummary(reportId.toString());
      setAuditSummary(summaryData);
    } catch (error) {
      console.error("❌ Failed to fetch summary:", error);
      setAuditSummary(null);
    } finally {
      setSummaryLoading(false);
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

  // Function to load all creatives
  const loadAllCreatives = async (accountId: string) => {
    try {
      setCreativesLoading(true);
      const creativesData = await fetchCreativesByAccountId(accountId);
      setAllCreatives(creativesData);
      
      // Pre-select first 5 creatives
      if (creativesData.length > 0 && selectedCreativeIds.size === 0) {
        const firstFive = new Set(creativesData.slice(0, 5).map(c => c.id));
        setSelectedCreativeIds(firstFive);
      }
      
      console.log("✅ All creatives loaded:", creativesData.length);
    } catch (error) {
      console.error("❌ Failed to load all creatives:", error);
    } finally {
      setCreativesLoading(false);
    }
  };

  // Toggle creative selection for Top Creatives section
  const toggleCreativeSelection = (creativeId: number) => {
    setSelectedCreativeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(creativeId)) {
        newSet.delete(creativeId);
      } else {
        // Limit to 5 selections
        if (newSet.size >= 5) {
          // Remove the oldest selection (first item in the set)
          const firstItem = Array.from(newSet)[0];
          newSet.delete(firstItem);
        }
        newSet.add(creativeId);
      }
      return newSet;
    });
  };

  // Get creatives to display in Top Creatives section (based on selection)
  const getDisplayedTopCreatives = () => {
    // If nothing selected, show first 5 from allCreatives (or fallback to topAds)
    if (selectedCreativeIds.size === 0) {
      if (allCreatives.length > 0) {
        return allCreatives.slice(0, 5).map(creative => ({
          id: creative.id,
          name: creative.name,
          link: creative.link,
          spend: creative.spend,
          roas: creative.roas,
          total_views: creative.total_views,
          ad_video_link: creative.ad_video_link,
          ad_type: creative.ad_type
        }));
      }
      return topAds.slice(0, 5);
    }
    
    // Get selected creatives from allCreatives list
    const selectedCreatives = allCreatives
      .filter(creative => selectedCreativeIds.has(creative.id))
      .slice(0, 5);
    
    // Map to TopPerformingAd format
    return selectedCreatives.map(creative => ({
      id: creative.id,
      name: creative.name,
      link: creative.link,
      spend: creative.spend,
      roas: creative.roas,
      total_views: creative.total_views,
      ad_video_link: creative.ad_video_link,
      ad_type: creative.ad_type
    }));
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!selectedAccountId) {
        setDashboardLoading(false);
        setAdsLoading(false);
        setCreativesLoading(false);
        setSummaryLoading(false);
        return;
      }

      setDashboardLoading(true);
      setAdsLoading(true);
      setCreativesLoading(true);
      
      try {
        console.log("📊 Loading dashboard data for account:", selectedAccountId);
        
        // Load reports, top ads, and all creatives in parallel
        const [reportsData, topAdsData] = await Promise.all([
          fetchReportsByAccountId(selectedAccountId),
          fetchTopPerformingAds(selectedAccountId)
        ]);
        
        setReports(reportsData);
        setTopAds(topAdsData);
        
        // Load all creatives separately (non-blocking)
        loadAllCreatives(selectedAccountId);
        
        // If we have reports, fetch summary for the latest one
        if (reportsData.length > 0) {
          const latest = reportsData.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          
          // Only fetch summary if report is at summary stage or complete
          if (latest.status === 'summary created' || latest.status === 'complete') {
            await fetchSummaryForReport(latest.id);
          } else {
            setSummaryLoading(false);
          }
        } else {
          setSummaryLoading(false);
        }
        
        // Reset media loading states when new ads are loaded
        setMediaLoadingStates({});
        setMediaErrorStates({});
        
        console.log("✅ Dashboard data loaded:", { 
          reports: reportsData.length, 
          topAds: topAdsData.length 
        });
      } catch (error) {
        console.error("❌ Failed to load dashboard data:", error);
        setSummaryLoading(false);
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
  }, [selectedAccountId]);

  // Column resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      
      const diff = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff); // Minimum width of 50px
      
      setColumnWidths(prev => ({
        ...prev,
        [resizing]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizing, startX, startWidth]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete':
      case 'completed':
        return 'bg-green-500 text-white';
      case 'processing initiated':
      case 'ad analysis complete':
      case 'ad blocks created':
      case 'summary created':
      case 'processing':
        return 'bg-blue-500 text-white';
      case 'failed':
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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

  // Toggle hook expansion
  const toggleHookExpansion = (creativeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedHooks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(creativeId)) {
        newSet.delete(creativeId);
      } else {
        newSet.add(creativeId);
      }
      return newSet;
    });
  };

  // Column resize handler
  const handleResizeStart = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(columnKey);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnKey as keyof typeof columnWidths]);
  };

  // Creative handlers
  const handleSendToBriefBuilder = (creative: Creative) => {
    window.location.href = `/build-ai?creativeId=${creative.id}`;
    localStorage.setItem('selectedCreative', JSON.stringify(creative));
  };

  const handleViewDetails = (creative: Creative) => {
    window.location.href = `/ads/${encodeURIComponent(creative.id)}/details`;
  };

  // Set default account when modal opens
  useEffect(() => {
    if (selectedAccountId && !formData.accountId) {
      setFormData(prev => ({ ...prev, accountId: selectedAccountId }));
    }
  }, [selectedAccountId, formData.accountId]);

  const handleGenerateReport = async (formValues: typeof formData) => {
    setGenerating(true);
    try {
      console.log("🚀 Starting analysis with data:", formValues);
      
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
      console.log("✅ Analysis started");
      
      setModalOpen(false);
      
      // Refresh reports after generation
      if (selectedAccountId) {
        await refreshReports(selectedAccountId, false);
      }
    } catch (error) {
      console.error("❌ Failed to start analysis:", error);
      alert("Failed to start analysis. Please try again.");
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

  // Filter creatives based on search query
  const filteredCreatives = allCreatives.filter(creative =>
    searchQuery === "" || 
    creative.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creative.hook.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="p-6 max-w-[1600px] mx-auto">
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
                    Account analysis and top performing creatives
                    </p>
                  </div>
                </div>
              </div>

            {/* Analysis Progress Section */}
            {showProgressSection ? (
              <div className="mb-8">
                <AnalysisProgressStepper 
                  currentStatus={latestReport.status as 'processing initiated' | 'ad analysis complete' | 'ad blocks created' | 'summary created' | 'complete'}
                  reportId={latestReport.id}
                  createdAt={latestReport.created_at}
                />
              </div>
            ) : !latestReport ? (
              <Card className="shadow-card mb-8 border-dashed border-2">
                <CardContent className="p-12 text-center">
                  <Sparkles className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-foreground mb-2">Start Your Analysis</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Begin analyzing your ad account performance to get insights on your top performing creatives, 
                    psychological triggers, and optimization recommendations.
                  </p>
                  <Button 
                    className="bg-gradient-primary hover:opacity-90 transition-opacity gap-2"
                    onClick={handleOpenModal}
                    disabled={generating}
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Start Analysis
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : null}

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
                   {getDisplayedTopCreatives().map((ad) => (
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

            {/* All Creatives Section with Tabs */}
              <div>
                <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-foreground">All Creatives</h2>
                      </div>

              <Tabs defaultValue="creatives" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="creatives">
                    <Play className="h-4 w-4 mr-2" />
                    Creatives ({allCreatives.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="summary" 
                    disabled={!auditSummary && !summaryLoading}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Summary
                    {!auditSummary && !summaryLoading && (
                      <Badge variant="outline" className="ml-2 text-[10px]">Stage 4+</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Creatives Tab */}
                <TabsContent value="creatives" className="mt-6">
                  <Card className="shadow-card overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-foreground">
                          All Creatives ({filteredCreatives.length})
                        </h3>
                        <div className="flex gap-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                              placeholder="Search creatives..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 w-64"
                            />
                  </div>
                          <Button onClick={() => loadAllCreatives(selectedAccountId)} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                          </Button>
                        </div>
                      </div>

                      {creativesLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                          <p className="text-muted-foreground">Loading creatives...</p>
                        </div>
                      ) : filteredCreatives.length === 0 ? (
                        <div className="text-center py-12">
                          <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No creatives found</p>
                        </div>
                      ) : (
                        <>
                          {/* Desktop Table View */}
                          <div className="hidden lg:block overflow-x-auto">
                            <div className="min-w-full inline-block align-middle">
                              <Table className="w-full table-fixed">
                                <TableHeader>
                                  <TableRow>
                                    <TableHead style={{ width: `${columnWidths.select}px` }} className="relative group">
                                      <div className="flex items-center justify-center">
                                        <span className="text-xs font-semibold">Top 5</span>
                                      </div>
                                    </TableHead>
                                    <TableHead style={{ width: `${columnWidths.icon}px` }} className="relative group">
                                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                        onMouseDown={(e) => handleResizeStart('icon', e)}
                                      />
                                    </TableHead>
                                    <TableHead style={{ width: `${columnWidths.name}px` }} className="relative group">
                                      Name
                                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                        onMouseDown={(e) => handleResizeStart('name', e)}
                                      />
                                    </TableHead>
                                    <TableHead style={{ width: `${columnWidths.hook}px` }} className="relative group">
                                      Hook
                                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                        onMouseDown={(e) => handleResizeStart('hook', e)}
                                      />
                                    </TableHead>
                                    <TableHead style={{ width: `${columnWidths.type}px` }} className="relative group">
                                      Type
                                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                        onMouseDown={(e) => handleResizeStart('type', e)}
                                      />
                                    </TableHead>
                                    <TableHead style={{ width: `${columnWidths.spend}px` }} className="relative group">
                                      Spend
                                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                        onMouseDown={(e) => handleResizeStart('spend', e)}
                                      />
                                    </TableHead>
                                    <TableHead style={{ width: `${columnWidths.roas}px` }} className="relative group">
                                      ROAS
                                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                        onMouseDown={(e) => handleResizeStart('roas', e)}
                                      />
                                    </TableHead>
                                    <TableHead style={{ width: `${columnWidths.views}px` }} className="relative group">
                                      Views
                                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                        onMouseDown={(e) => handleResizeStart('views', e)}
                                      />
                                    </TableHead>
                                    <TableHead style={{ width: `${columnWidths.thumbstop}px` }} className="relative group">
                                      Thumbstop
                                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                        onMouseDown={(e) => handleResizeStart('thumbstop', e)}
                                      />
                                    </TableHead>
                                    <TableHead style={{ width: `${columnWidths.holdRate}px` }} className="relative group">
                                      Hold Rate
                                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                        onMouseDown={(e) => handleResizeStart('holdRate', e)}
                                      />
                                    </TableHead>
                                    <TableHead style={{ width: `${columnWidths.ctr}px` }} className="relative group">
                                      CTR
                                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                        onMouseDown={(e) => handleResizeStart('ctr', e)}
                                      />
                                    </TableHead>
                                    <TableHead style={{ width: `${columnWidths.actions}px` }} className="relative group">
                                      Actions
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredCreatives.map((creative) => {
                                    const isHookExpanded = expandedHooks.has(creative.id);
                                    const hookText = creative.hook;
                                    const isLongHook = hookText.length > 100;
                                    const isSelected = selectedCreativeIds.has(creative.id);
                                    
                                    return (
                                      <TableRow 
                                        key={creative.id} 
                                        className={`cursor-pointer hover:bg-muted/50 transition-colors h-20 ${
                                          isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                                        }`}
                                        onClick={() => handleViewDetails(creative)}
                                      >
                                        <TableCell className="align-middle overflow-hidden" style={{ width: `${columnWidths.select}px` }}>
                                          <div className="flex items-center justify-center">
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() => toggleCreativeSelection(creative.id)}
                                              onClick={(e) => e.stopPropagation()}
                                              disabled={!isSelected && selectedCreativeIds.size >= 5}
                                              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                              title={!isSelected && selectedCreativeIds.size >= 5 ? "Maximum 5 creatives can be selected" : "Select for Top Creatives"}
                                            />
                                          </div>
                                        </TableCell>
                                        <TableCell className="align-middle overflow-hidden" style={{ width: `${columnWidths.icon}px` }}>
                                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                            {creative.ad_type === 'video' ? (
                                              <Play className="w-5 h-5 text-primary" />
                                            ) : (
                                              <ImageIcon className="w-5 h-5 text-primary" />
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell className="align-middle overflow-hidden" style={{ width: `${columnWidths.name}px` }}>
                                          <div className="font-medium text-foreground truncate flex items-center gap-2">
                                            {creative.name}
                                            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                          </div>
                                        </TableCell>
                                        <TableCell className="align-middle overflow-hidden" style={{ width: `${columnWidths.hook}px` }}>
                                          <div className="py-2">
                                            <div className={`text-sm text-muted-foreground leading-relaxed ${!isHookExpanded ? 'line-clamp-2' : ''}`}>
                                              {hookText}
                                            </div>
                                            {isLongHook && (
                                              <button
                                                onClick={(e) => toggleHookExpansion(creative.id, e)}
                                                className="text-xs text-primary hover:text-primary/80 font-medium mt-1 hover:underline"
                                              >
                                                {isHookExpanded ? 'Show less' : 'Read more'}
                                              </button>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell className="align-middle overflow-hidden" style={{ width: `${columnWidths.type}px` }}>
                                          <Badge variant="outline" className="capitalize">
                                            {creative.ad_type}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="align-middle overflow-hidden" style={{ width: `${columnWidths.spend}px` }}>
                                          <div className="flex items-center gap-1 text-sm">
                                            <DollarSign className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                            <span className="truncate">{formatCurrency(creative.spend)}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="align-middle overflow-hidden" style={{ width: `${columnWidths.roas}px` }}>
                                          <Badge className={
                                            creative.roas >= 2.5 ? 'bg-green-500/10 text-green-600' :
                                            creative.roas >= 2 ? 'bg-blue-500/10 text-blue-600' :
                                            'bg-yellow-500/10 text-yellow-600'
                                          }>
                                            {creative.roas.toFixed(2)}x
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="align-middle overflow-hidden" style={{ width: `${columnWidths.views}px` }}>
                                          <div className="flex items-center gap-1 text-sm">
                                            <Eye className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                            <span className="truncate">{formatNumber(creative.total_views)}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="align-middle overflow-hidden" style={{ width: `${columnWidths.thumbstop}px` }}>
                                          {creative.thumbstop !== null ? (
                                            <span className="text-sm">{creative.thumbstop.toFixed(1)}%</span>
                                          ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="align-middle overflow-hidden" style={{ width: `${columnWidths.holdRate}px` }}>
                                          {creative.hold_rate !== null ? (
                                            <span className="text-sm">{creative.hold_rate.toFixed(1)}%</span>
                                          ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                          )}
                                        </TableCell>
                                        <TableCell className="align-middle overflow-hidden" style={{ width: `${columnWidths.ctr}px` }}>
                                          <span className="text-sm">{creative.ctr.toFixed(1)}%</span>
                                        </TableCell>
                                        <TableCell className="align-middle overflow-hidden" style={{ width: `${columnWidths.actions}px` }}>
                                          <div className="flex gap-2">
                      <Button 
                                              size="sm"
                                              variant="outline"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetails(creative);
                                              }}
                                              className="whitespace-nowrap"
                                            >
                                              <ExternalLink className="w-3 h-3 mr-1" />
                                              View
                                            </Button>
                                            <Button
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleSendToBriefBuilder(creative);
                                              }}
                                              className="bg-primary hover:bg-primary/90 text-white whitespace-nowrap"
                                            >
                                              <Send className="w-3 h-3 mr-1" />
                                              Brief
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </div>

                          {/* Mobile Card View */}
                          <div className="lg:hidden space-y-4">
                            {filteredCreatives.map((creative) => {
                              const isSelected = selectedCreativeIds.has(creative.id);
                              
                              return (
                                <Card 
                                  key={creative.id} 
                                  className={`p-4 cursor-pointer hover:shadow-lg transition-all ${
                                    isSelected ? 'border-2 border-primary bg-primary/5' : ''
                                  }`}
                                  onClick={() => handleViewDetails(creative)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex flex-col items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleCreativeSelection(creative.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={!isSelected && selectedCreativeIds.size >= 5}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={!isSelected && selectedCreativeIds.size >= 5 ? "Maximum 5 creatives can be selected" : "Select for Top Creatives"}
                                      />
                                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                        {creative.ad_type === 'video' ? (
                                          <Play className="w-6 h-6 text-primary" />
                                        ) : (
                                          <ImageIcon className="w-6 h-6 text-primary" />
                                        )}
                                      </div>
                                    </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <h3 className="font-medium text-foreground text-sm line-clamp-2">
                                        {creative.name}
                                      </h3>
                                      <Badge variant="outline" className="capitalize flex-shrink-0">
                                        {creative.ad_type}
                                      </Badge>
                                    </div>
                                    
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                                      {creative.hook}
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs font-medium">{formatCurrency(creative.spend)}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Badge className={
                                          creative.roas >= 2.5 ? 'bg-green-500/10 text-green-600' :
                                          creative.roas >= 2 ? 'bg-blue-500/10 text-blue-600' :
                                          'bg-yellow-500/10 text-yellow-600'
                                        }>
                                          {creative.roas.toFixed(2)}x ROAS
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Eye className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs">{formatNumber(creative.total_views)} views</span>
                                      </div>
                                      <div className="text-xs">
                                        <span className="text-muted-foreground">CTR: </span>
                                        <span className="font-medium">{creative.ctr.toFixed(1)}%</span>
                                      </div>
                                    </div>
                                    
                                    {creative.ad_type === 'video' && (
                                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                        <div>
                                          <span className="text-muted-foreground">Thumbstop: </span>
                                          <span className="font-medium">
                                            {creative.thumbstop !== null ? `${creative.thumbstop.toFixed(1)}%` : '-'}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-muted-foreground">Hold Rate: </span>
                                          <span className="font-medium">
                                            {creative.hold_rate !== null ? `${creative.hold_rate.toFixed(1)}%` : '-'}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleViewDetails(creative);
                                        }}
                                        className="flex-1"
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        View Details
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSendToBriefBuilder(creative);
                                        }}
                                        className="bg-primary hover:bg-primary/90 text-white flex-1"
                                      >
                                        <Send className="w-3 h-3 mr-1" />
                                        Brief
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                </TabsContent>

                {/* Summary Tab */}
                <TabsContent value="summary" className="mt-6">
                  {summaryLoading ? (
                    <Card className="shadow-card">
                      <CardContent className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading summary...</p>
                      </CardContent>
                    </Card>
                  ) : !auditSummary ? (
                    <Card className="shadow-card">
                      <CardContent className="p-12 text-center">
                        <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Summary Not Available</h3>
                        <p className="text-muted-foreground">
                          The audit summary will be available once the analysis reaches the &quot;Summary Created&quot; stage.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div>
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                          <Brain className="h-5 w-5 text-primary" />
                          Analysis & Insights
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="shadow-card">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <Brain className="h-4 w-4 text-primary" />
                              Psychological Triggers
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-foreground/90 leading-relaxed">{auditSummary.psychological_triggers}</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-card">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <Target className="h-4 w-4 text-red-500" />
                              Pain Points
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-foreground/90 leading-relaxed">{auditSummary.paint_points}</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-card">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-500" />
                              Tonality
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-foreground/90 leading-relaxed">{auditSummary.tonality}</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-card">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <Eye className="h-4 w-4 text-primary" />
                              Visuals
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-foreground/90 leading-relaxed">{auditSummary.visuals}</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-card">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              Market Awareness
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-foreground/90 leading-relaxed">{auditSummary.market_awareness}</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-card">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <Target className="h-4 w-4 text-primary" />
                              Angle
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-foreground/90 leading-relaxed">{auditSummary.angle}</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-card">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              Format
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-foreground/90 leading-relaxed">{auditSummary.format}</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-card">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <BarChart3 className="h-4 w-4 text-primary" />
                              Theme
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-foreground/90 leading-relaxed">{auditSummary.theme}</p>
                          </CardContent>
                        </Card>

                        <Card className="shadow-card md:col-span-2">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              Recommendations
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-foreground/90 leading-relaxed">{auditSummary.recomendations}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
                          </>
                        )}

        {/* Analysis Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
              <DialogTitle>Start New Analysis</DialogTitle>
                        <DialogDescription>
                Configure the parameters for your account analysis.
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
                      Starting...
                              </>
                            ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Start Analysis
                    </>
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
    </div>
    </AppLayout>
  );
}
