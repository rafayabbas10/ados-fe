"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAccount } from "@/contexts/AccountContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kanban, Plus, RefreshCw, Eye, Upload, X, Film, User as UserIcon, Target, Layout, Lightbulb, Calendar, Image as ImageIcon, GripVertical } from "lucide-react";
import { fetchProductionAds, ProductionAd, updateAdStatus } from "@/services/workflowService";
import { fetchAdBlocks, AdBlockVersion } from "@/services/adBlocksService";
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

export default function Workflow() {
  const { selectedAccountId } = useAccount();
  const [productionAds, setProductionAds] = useState<ProductionAd[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (selectedAccountId) {
      loadProductionAds();
    }
  }, [selectedAccountId]);

  const loadProductionAds = async () => {
    if (!selectedAccountId) return;

    setLoading(true);
    try {
      const data = await fetchProductionAds(selectedAccountId);
      setProductionAds(data);
    } catch (error) {
      console.error('Failed to load production ads:', error);
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAd(null);
    setAdBlockVersions([]);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const adId = active.id as number;
    const newStatus = over.id as string;
    
    const ad = productionAds.find(a => a.id === adId);
    if (!ad || ad.status === newStatus) return;

    // Optimistically update UI
    setProductionAds(prev => 
      prev.map(a => a.id === adId ? { ...a, status: newStatus as ProductionAd['status'] } : a)
    );

    // Update backend
    try {
      await updateAdStatus(adId, newStatus);
      toast.success('Status updated', {
        description: `Moved to ${newStatus}`,
      });
    } catch (error) {
      console.error('Failed to update ad status:', error);
      // Revert on error
      setProductionAds(prev => 
        prev.map(a => a.id === adId ? { ...a, status: ad.status } : a)
      );
      toast.error('Failed to update status', {
        description: 'Please try again.',
      });
    }
  };

  const activeAd = activeId ? productionAds.find(ad => ad.id === activeId) : null;

  if (!selectedAccountId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Kanban className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Select an Account</h3>
            <p className="text-muted-foreground">
              Please select an ad account from the sidebar to view workflow
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="py-3 min-h-screen">
        <div className="max-w-[1600px] mx-auto px-6">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Kanban className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Production Workflow
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Kanban-style creative pipeline from brief to final asset
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadProductionAds} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-white" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Brief to Queue
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Bulk Import
                </Button>
              </div>
            </div>
          </div>

          {/* Kanban Board */}
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
              <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">Avg. Production</div>
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
    </AppLayout>
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
      {/* Column Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground truncate">{statusConfig.name}</h3>
          <span className="text-xs text-muted-foreground flex-shrink-0">({ads.length})</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Droppable Area */}
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
      className={`p-3 bg-card border hover:border-primary/50 transition-colors cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Card Header with Status Dot */}
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

      {/* Badges */}
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

      {/* Action Buttons */}
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
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 flex-1 text-xs px-2 cursor-pointer"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Upload className="w-3 h-3 mr-1" />
          Upload
        </Button>
      </div>
    </Card>
  );
}
