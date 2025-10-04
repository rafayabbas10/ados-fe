"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLayout } from "@/components/AppLayout";
import { 
  FileText, 
  Calendar, 
  BarChart3, 
  ArrowLeft,
  Play,
  Eye,
  Target,
  Brain,
  TrendingUp,
  Users
} from "lucide-react";
import { AuditReport, ReportAd, ReportSummary } from "@/types";
import { fetchReportDetails, fetchReportAds, fetchReportSummary } from "@/services/reportsService";

export default function ReportDetails() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.reportId as string;
  
  const [report, setReport] = useState<AuditReport | null>(null);
  const [ads, setAds] = useState<ReportAd[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      if (!reportId) return;
      
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [reportData, adsData, summaryData] = await Promise.all([
          fetchReportDetails(reportId),
          fetchReportAds(reportId),
          fetchReportSummary(reportId)
        ]);
        
        console.log("📊 Report Data:", reportData);
        console.log("📊 Ads Data:", adsData);
        console.log("📊 Summary Data:", summaryData);
        
        setReport(reportData);
        // Sort ads by spend (highest first)
        const sortedAds = [...adsData].sort((a, b) => b.spend - a.spend);
        setAds(sortedAds);
        setSummary(summaryData);
      } catch (error) {
        console.error("❌ Error loading report data:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
      } finally {
        setLoading(false);
      }
    };
    
    loadReportData();
  }, [reportId]);

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-500 text-white';
    
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'processing':
        return 'bg-blue-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading report...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!report) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Report not found</h3>
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
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Report #{report.id}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateRange(report.from_date, report.to_date)}</span>
                  </div>
                  <Badge className={getStatusColor(report.status)}>
                    {report.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground mb-4">Ad Performance Data</h2>
              
              {ads.length === 0 ? (
                <Card className="shadow-card">
                  <CardContent className="p-12 text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Ads Found</h3>
                    <p className="text-muted-foreground">No ads found for this report.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {ads.map((ad, index) => (
                    <Card key={index} className="shadow-card hover:shadow-elevated transition-all duration-200">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{ad.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{ad.ad_type.toUpperCase()}</Badge>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => router.push(`/ads/${encodeURIComponent(ad.facebook_ad_id || ad.id || ad.name)}/details`)}
                          >
                            <Eye className="h-4 w-4" />
                            Ad Details
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Spend</p>
                            <p className="text-lg font-bold text-foreground">{formatCurrency(ad.spend)}</p>
                          </div>
                          
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">ROAS</p>
                            <p className="text-lg font-bold text-green-600">{ad.roas.toFixed(2)}x</p>
                          </div>
                          
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">AOV</p>
                            <p className="text-lg font-bold text-foreground">{formatCurrency(ad.aov)}</p>
                          </div>
                          
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">CPA</p>
                            <p className="text-lg font-bold text-foreground">{formatCurrency(ad.cpa)}</p>
                          </div>

                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Thumbstop</p>
                            <p className="text-lg font-bold text-foreground">{ad.thumbstop.toFixed(2)}%</p>
                          </div>

                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Hold Rate</p>
                            <p className="text-lg font-bold text-foreground">{ad.hold_rate.toFixed(2)}%</p>
                          </div>

                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">CTR</p>
                            <p className="text-lg font-bold text-foreground">{ad.ctr.toFixed(2)}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-primary" />
                Report Analysis & Insights
              </h2>
            </div>

            {!summary ? (
              <Card className="shadow-card">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No summary data available yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      Psychological Triggers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/90 leading-relaxed">{summary.psychological_triggers}</p>
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
                    <p className="text-sm text-foreground/90 leading-relaxed">{summary.paint_points}</p>
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
                    <p className="text-sm text-foreground/90 leading-relaxed">{summary.tonality}</p>
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
                    <p className="text-sm text-foreground/90 leading-relaxed">{summary.visuals}</p>
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
                    <p className="text-sm text-foreground/90 leading-relaxed">{summary.market_awareness}</p>
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
                    <p className="text-sm text-foreground/90 leading-relaxed">{summary.angle}</p>
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
                    <p className="text-sm text-foreground/90 leading-relaxed">{summary.format}</p>
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
                    <p className="text-sm text-foreground/90 leading-relaxed">{summary.theme}</p>
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
                    <p className="text-sm text-foreground/90 leading-relaxed">{summary.recomendations}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
