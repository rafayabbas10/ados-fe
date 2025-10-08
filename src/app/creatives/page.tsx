"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/AppLayout";
import { useAccount } from "@/contexts/AccountContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, Search, Send, Image as ImageIcon, TrendingUp, Eye, DollarSign, ExternalLink } from "lucide-react";
import { fetchCreativesByAccountId, Creative } from "@/services/creativesService";

export default function AdCreatives() {
  const router = useRouter();
  const { selectedAccountId } = useAccount();
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedHooks, setExpandedHooks] = useState<Set<number>>(new Set());
  
  // Column widths state
  const [columnWidths, setColumnWidths] = useState({
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

  useEffect(() => {
    if (selectedAccountId) {
      loadCreatives();
    }
  }, [selectedAccountId]);

  const loadCreatives = async () => {
    if (!selectedAccountId) return;

    setLoading(true);
    try {
      const data = await fetchCreativesByAccountId(selectedAccountId);
      setCreatives(data);
    } catch (error) {
      console.error('Failed to load creatives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToBriefBuilder = (creative: Creative) => {
    // Navigate to Brief Builder with creative data
    router.push(`/build-ai?creativeId=${creative.id}`);
    
    // Store creative data in localStorage for Brief Builder to access
    localStorage.setItem('selectedCreative', JSON.stringify(creative));
  };

  const handleViewDetails = (creative: Creative) => {
    // Navigate to Ad Details page
    router.push(`/ads/${encodeURIComponent(creative.id)}/details`);
  };

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

  // Column resize handlers
  const handleResizeStart = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(columnKey);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnKey as keyof typeof columnWidths]);
  };

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

  const filteredCreatives = creatives.filter(creative =>
    searchQuery === "" || 
    creative.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creative.hook.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (!selectedAccountId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Select an Account</h3>
            <p className="text-muted-foreground">
              Please select an ad account from the sidebar to view creatives
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Play className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Ad Creatives</h1>
              <p className="text-muted-foreground">
                Top performing creatives from your ad account
              </p>
            </div>
          </div>
        </div>

        {/* Creatives Table */}
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
                <Button onClick={loadCreatives} variant="outline">
                  Refresh
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading creatives...</p>
              </div>
            ) : filteredCreatives.length === 0 ? (
              <div className="text-center py-12">
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
                      
                      return (
                      <TableRow 
                        key={creative.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors h-20"
                        onClick={() => handleViewDetails(creative)}
                      >
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
                {filteredCreatives.map((creative) => (
                  <Card 
                    key={creative.id} 
                    className="p-4 cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => handleViewDetails(creative)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        {creative.ad_type === 'video' ? (
                          <Play className="w-6 h-6 text-primary" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-primary" />
                        )}
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
                ))}
              </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

