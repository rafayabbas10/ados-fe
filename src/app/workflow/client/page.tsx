"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Kanban, Eye, Film, User as UserIcon, Target, Layout, Lightbulb, Calendar, Image as ImageIcon, Lock, RefreshCw, AlertCircle } from "lucide-react";
import { fetchProductionAds, ProductionAd } from "@/services/workflowService";
import { fetchAdBlocks, AdBlockVersion } from "@/services/adBlocksService";
import { verifyClientAccess, getClientAccessByAccount } from "@/services/clientAccessService";
import { toast } from "sonner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

const STATUSES = [
  { name: 'Briefed', color: 'bg-red-500', count: 2 },
  { name: 'In Production', color: 'bg-yellow-500', count: 2 },
  { name: 'In Editing', color: 'bg-green-500', count: 1 },
  { name: 'Ready to Launch', color: 'bg-red-500', count: 1 },
  { name: 'Launched', color: 'bg-yellow-500', count: 1 },
  { name: 'Iterating', color: 'bg-green-500', count: 1 },
] as const;

export default function ClientWorkflow() {
  const searchParams = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string>("");
  const [productionAds, setProductionAds] = useState<ProductionAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAd, setSelectedAd] = useState<ProductionAd | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adBlockVersions, setAdBlockVersions] = useState<AdBlockVersion[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get account ID from URL and check for existing session
  useEffect(() => {
    const urlAccountId = searchParams.get('account');
    
    if (urlAccountId) {
      // New URL with account parameter
      setAccountId(urlAccountId);
      
      // Check if already authenticated for this account
      const sessionKey = `clientAuth_${urlAccountId}`;
      const isAuthed = localStorage.getItem(sessionKey) === 'true';
      
      if (isAuthed) {
        setIsAuthenticated(true);
        
        // Get account name
        const access = getClientAccessByAccount(urlAccountId);
        if (access) {
          setAccountName(access.accountName);
        }
      } else {
        // Get account name for display
        const access = getClientAccessByAccount(urlAccountId);
        if (access) {
          setAccountName(access.accountName);
        } else {
          setPasswordError("Invalid or expired link");
        }
      }
    } else {
      // Fallback to old method (for backward compatibility)
      const clientAuth = localStorage.getItem('clientAuth');
      const clientAccountId = localStorage.getItem('clientAccountId');
      
      if (clientAuth === 'true' && clientAccountId) {
        setIsAuthenticated(true);
        setAccountId(clientAccountId);
      }
    }
  }, [searchParams]);

  // Load ads when authenticated
  useEffect(() => {
    if (isAuthenticated && accountId) {
      loadProductionAds();
    }
  }, [isAuthenticated, accountId]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountId) {
      setPasswordError("No account specified");
      return;
    }
    
    // Verify password for this specific account
    const isValid = verifyClientAccess(accountId, password);
    
    if (isValid) {
      setIsAuthenticated(true);
      setPasswordError("");
      
      // Store session for this specific account
      const sessionKey = `clientAuth_${accountId}`;
      localStorage.setItem(sessionKey, 'true');
      
      toast.success("Access granted!");
    } else {
      setPasswordError("Invalid password");
      setPassword("");
    }
  };

  const handleLogout = () => {
    if (accountId) {
      // Clear session for this specific account
      const sessionKey = `clientAuth_${accountId}`;
      localStorage.removeItem(sessionKey);
    }
    
    setIsAuthenticated(false);
    setPassword("");
    
    // Keep accountId to show password screen again
    // setAccountId(null);
  };

  const loadProductionAds = async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      const data = await fetchProductionAds(accountId);
      setProductionAds(data);
    } catch (error) {
      console.error('Failed to load production ads:', error);
      toast.error('Failed to load workflow data');
    } finally {
      setLoading(false);
    }
  };

  const getAdsByStatus = (status: string) => {
    return productionAds.filter(ad => ad.status === status);
  };

  const getStatusConfig = (status: string) => {
    return STATUSES.find(s => s.name === status) || STATUSES[0];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAdClick = async (ad: ProductionAd) => {
    setSelectedAd(ad);
    setIsModalOpen(true);
    
    setLoadingBlocks(true);
    try {
      const blocks = await fetchAdBlocks(ad.id);
      setAdBlockVersions(blocks);
    } catch (error) {
      console.error('Failed to load ad blocks:', error);
      setAdBlockVersions([]);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    // Client view is read-only, so no drag action
  };

  const activeAd = activeId ? productionAds.find(ad => ad.id === activeId) : null;

  // Password screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                <Kanban className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-2xl text-foreground">adOS Workflow</h1>
                <p className="text-sm text-muted-foreground">Client Access</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Protected Workflow</h2>
            <p className="text-muted-foreground">Enter the password provided by your strategist</p>
            
            {accountName && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <Kanban className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{accountName}</span>
              </div>
            )}
          </div>

          {/* Password Form */}
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {passwordError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{passwordError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={!accountId}>
              Access Workflow
            </Button>
          </form>

          {/* Help text */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Don&apos;t have a password? Contact your strategist for access.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Workflow view
  return (
    <div className="min-h-screen bg-background">
      {/* Simple header without full AppLayout */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Kanban className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Production Workflow</h1>
                <p className="text-xs text-muted-foreground">
                  {accountName ? `${accountName} - ` : ''}Client View - Read Only
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={loadProductionAds} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <Lock className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Workflow content */}
      <div className="py-6">
        <div className="max-w-[1600px] mx-auto px-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground mt-4">Loading workflow...</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
                {STATUSES.map((statusConfig) => {
                  const ads = getAdsByStatus(statusConfig.name);
                  return (
                    <DroppableColumn
                      key={statusConfig.name}
                      id={statusConfig.name}
                      statusConfig={statusConfig}
                      ads={ads}
                      onAdClick={handleAdClick}
                      formatDate={formatDate}
                    />
                  );
                })}
              </div>

              <DragOverlay>
                {activeAd && (
                  <AdCard
                    ad={activeAd}
                    statusConfig={getStatusConfig(activeAd.status)}
                    isDragging={true}
                    onAdClick={() => {}}
                    formatDate={formatDate}
                  />
                )}
              </DragOverlay>
            </DndContext>
          )}

          {/* Stats Footer */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4 bg-card border text-center">
              <div className="text-2xl font-bold text-foreground">
                {productionAds.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Total Briefs</div>
            </Card>
            <Card className="p-4 bg-card border text-center">
              <div className="text-2xl font-bold text-foreground">
                {getAdsByStatus('In Production').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">In Production</div>
            </Card>
            <Card className="p-4 bg-card border text-center">
              <div className="text-2xl font-bold text-green-600">
                {getAdsByStatus('Launched').length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Completed</div>
            </Card>
            <Card className="p-4 bg-card border text-center">
              <div className="text-2xl font-bold text-foreground">
                {productionAds.length > 0 
                  ? ((getAdsByStatus('Launched').length / productionAds.length) * 100).toFixed(0)
                  : 0}%
              </div>
              <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">Completion Rate</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Ad Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${selectedAd ? getStatusConfig(selectedAd.status).color : ''}`}></div>
              {selectedAd?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedAd && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="blocks">Ad Blocks</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Target className="w-4 h-4" />
                      <span>Status</span>
                    </div>
                    <Badge variant="outline">
                      {selectedAd.status}
                    </Badge>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <UserIcon className="w-4 h-4" />
                      <span>Assigned To</span>
                    </div>
                    <p className="font-medium text-foreground">{selectedAd.assigned_to}</p>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Lightbulb className="w-4 h-4" />
                      <span>Market Awareness</span>
                    </div>
                    <p className="text-foreground">{selectedAd.market_awareness}</p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Target className="w-4 h-4" />
                      <span>Angle</span>
                    </div>
                    <p className="text-foreground text-sm">{selectedAd.angle}</p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Layout className="w-4 h-4" />
                      <span>Format</span>
                    </div>
                    <p className="text-foreground text-sm">{selectedAd.format}</p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Film className="w-4 h-4" />
                      <span>Theme</span>
                    </div>
                    <p className="text-foreground text-sm">{selectedAd.theme}</p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <UserIcon className="w-4 h-4" />
                      <span>Avatar</span>
                    </div>
                    <p className="text-foreground text-sm">{selectedAd.avatar}</p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created At</span>
                    </div>
                    <p className="text-foreground">{formatDate(selectedAd.created_at)}</p>
                  </Card>
                </div>
              </TabsContent>

              {/* Ad Blocks Tab */}
              <TabsContent value="blocks" className="mt-6">
                {loadingBlocks ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading ad blocks...</p>
                  </div>
                ) : adBlockVersions.length === 0 ? (
                  <div className="text-center py-12">
                    <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No ad blocks found</p>
                  </div>
                ) : (
                  <Tabs defaultValue={adBlockVersions[0]?.version} className="w-full">
                    <TabsList className={`grid w-full ${adBlockVersions.length === 1 ? 'grid-cols-1' : adBlockVersions.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {adBlockVersions.map((versionData) => (
                        <TabsTrigger key={versionData.version} value={versionData.version}>
                          {versionData.version}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {versionData.scenes.length}
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {adBlockVersions.map((versionData) => (
                      <TabsContent key={versionData.version} value={versionData.version} className="mt-6">
                        <div className="space-y-3">
                          {versionData.scenes.map((scene, sceneIdx) => (
                            <Card key={scene.id} className="p-4">
                              <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary">{scene.scene || sceneIdx + 1}</span>
                                  </div>
                                </div>

                                <div className="flex-1 space-y-3">
                                  <div>
                                    <label className="text-xs font-medium text-muted-foreground">Script</label>
                                    <p className="text-sm text-foreground mt-1">{scene.script}</p>
                                  </div>

                                  {scene.visual && (
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground">Visual</label>
                                      <p className="text-sm text-foreground mt-1">{scene.visual}</p>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-6">
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground">Audio</label>
                                      <p className="text-sm text-foreground mt-1">{scene.audio}</p>
                                    </div>
                                    
                                    {scene.screenshot_url && (
                                      <div className="flex items-center gap-2">
                                        <label className="text-xs font-medium text-muted-foreground">Screenshot:</label>
                                        <a 
                                          href={scene.screenshot_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="relative w-16 h-12 rounded overflow-hidden bg-muted flex-shrink-0 hover:opacity-80 transition-opacity border"
                                          title="View screenshot"
                                        >
                                          <img 
                                            src={scene.screenshot_url} 
                                            alt={`Scene ${scene.scene} screenshot`}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                              const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon');
                                              if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                            }}
                                          />
                                          <div className="fallback-icon absolute inset-0 items-center justify-center bg-muted hidden">
                                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                          </div>
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  {scene.text_overlay && scene.text_overlay.trim() !== '' && (
                                    <div>
                                      <label className="text-xs font-medium text-muted-foreground">Text Overlay</label>
                                      <div className="mt-1">
                                        <Badge variant="outline" className="whitespace-pre-wrap text-left">
                                          {scene.text_overlay}
                                        </Badge>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({ 
  id, 
  statusConfig, 
  ads, 
  onAdClick, 
  formatDate 
}: { 
  id: string; 
  statusConfig: typeof STATUSES[number]; 
  ads: ProductionAd[]; 
  onAdClick: (ad: ProductionAd) => void;
  formatDate: (date: string) => string;
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground truncate">{statusConfig.name}</h3>
          <span className="text-xs text-muted-foreground flex-shrink-0">({ads.length})</span>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className="space-y-2 min-h-[200px]"
      >
        {ads.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-xs">
            No items
          </div>
        ) : (
          ads.map((ad) => (
            <DraggableAdCard
              key={ad.id}
              ad={ad}
              statusConfig={statusConfig}
              onAdClick={onAdClick}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Draggable Ad Card Component
function DraggableAdCard({ 
  ad, 
  statusConfig, 
  onAdClick, 
  formatDate 
}: { 
  ad: ProductionAd; 
  statusConfig: typeof STATUSES[number]; 
  onAdClick: (ad: ProductionAd) => void;
  formatDate: (date: string) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ad.id,
    disabled: true, // Disable dragging for client view
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <AdCard
        ad={ad}
        statusConfig={statusConfig}
        isDragging={isDragging}
        onAdClick={onAdClick}
        formatDate={formatDate}
      />
    </div>
  );
}

// Ad Card Component
function AdCard({ 
  ad, 
  statusConfig, 
  isDragging, 
  onAdClick, 
  formatDate
}: { 
  ad: ProductionAd; 
  statusConfig: typeof STATUSES[number]; 
  isDragging?: boolean;
  onAdClick: (ad: ProductionAd) => void;
  formatDate: (date: string) => string;
}) {
  return (
    <Card 
      className={`p-3 bg-card border hover:border-primary/50 transition-colors ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="mt-0.5">
          <div className={`w-2 h-2 rounded-full ${statusConfig.color}`}></div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-xs text-foreground line-clamp-2 mb-1">
            {ad.name}
          </h4>
          <p className="text-xs text-muted-foreground">
            {ad.assigned_to}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 text-[10px]">
          {ad.market_awareness.split(' ')[0]}
        </Badge>
        {ad.format && (
          <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 text-[10px]">
            +1
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1 pt-2 border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 flex-1 text-xs px-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onAdClick(ad);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Eye className="w-3 h-3 mr-1" />
          View
        </Button>
      </div>
    </Card>
  );
}

