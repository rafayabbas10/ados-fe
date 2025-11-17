"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  X,
  User,
  Calendar,
  TrendingUp,
  Target,
  Layout,
  Film,
  Users,
  Eye,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { Brief } from "@/types";
import { fetchAdBlocks, AdBlockVersion } from "@/services/adBlocksService";

interface BriefSidebarProps {
  brief: Brief | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BriefSidebar({ brief, isOpen, onClose }: BriefSidebarProps) {
  const [adBlockVersions, setAdBlockVersions] = useState<AdBlockVersion[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  useEffect(() => {
    if (brief && isOpen) {
      loadAdBlocks();
    }
  }, [brief, isOpen]);

  const loadAdBlocks = async () => {
    if (!brief) return;

    setLoadingBlocks(true);
    try {
      const blocks = await fetchAdBlocks(brief.id);
      setAdBlockVersions(blocks);
    } catch (error) {
      console.error('Failed to load ad blocks:', error);
      setAdBlockVersions([]);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Launched':
        return 'bg-green-500 text-white';
      case 'Ready to Launch':
        return 'bg-blue-500 text-white';
      case 'Briefed':
        return 'bg-purple-500 text-white';
      case 'Iterating':
        return 'bg-yellow-500 text-black';
      case 'In Editing':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  if (!brief) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[600px] lg:w-[700px] bg-background z-50 shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border z-10 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-muted-foreground">Brief #{brief.id}</span>
                <Badge className={getStatusColor(brief.status)}>
                  {brief.status}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-foreground line-clamp-2">
                {brief.name || <span className="text-muted-foreground italic">Untitled Brief</span>}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0 ml-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="details">
                <FileText className="h-4 w-4 mr-2" />
                Brief Details
              </TabsTrigger>
              <TabsTrigger value="blocks">
                <Film className="h-4 w-4 mr-2" />
                Ad Blocks
                {!loadingBlocks && adBlockVersions.length > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {adBlockVersions.reduce((acc, v) => acc + v.scenes.length, 0)}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Brief Details Tab */}
            <TabsContent value="details" className="mt-0">
              <div className="space-y-4">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {brief.assigned_to || <span className="text-muted-foreground italic">Unassigned</span>}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{formatDate(brief.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Market Awareness */}
                {brief.market_awareness && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">Market Awareness</span>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">{brief.market_awareness}</p>
                  </Card>
                )}

                {/* Angle */}
                {brief.angle && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Target className="w-4 h-4" />
                      <span className="font-medium">Angle</span>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">{brief.angle}</p>
                  </Card>
                )}

                {/* Format */}
                {brief.format && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Layout className="w-4 h-4" />
                      <span className="font-medium">Format</span>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">{brief.format}</p>
                  </Card>
                )}

                {/* Theme */}
                {brief.theme && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Film className="w-4 h-4" />
                      <span className="font-medium">Theme</span>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">{brief.theme}</p>
                  </Card>
                )}

                {/* Avatar (Demographic Info) */}
                {brief.avatar && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Audience Demographics</span>
                    </div>
                    <p className="text-foreground text-sm leading-relaxed">{brief.avatar}</p>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Ad Blocks Tab */}
            <TabsContent value="blocks" className="mt-0">
              {loadingBlocks ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading ad blocks...</p>
                </div>
              ) : adBlockVersions.length === 0 ? (
                <div className="text-center py-12">
                  <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No ad blocks found</p>
                </div>
              ) : (
                <Tabs defaultValue={adBlockVersions[0]?.version} className="w-full">
                  <TabsList className={`grid w-full ${
                    adBlockVersions.length === 1 ? 'grid-cols-1' : 
                    adBlockVersions.length === 2 ? 'grid-cols-2' : 
                    'grid-cols-3'
                  }`}>
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
        </div>
      </div>
    </>
  );
}

