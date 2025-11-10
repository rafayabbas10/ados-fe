"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { 
  FileText, 
  Search, 
  RefreshCw,
  Calendar,
  User,
  TrendingUp,
  Eye,
  Users
} from "lucide-react";
import { Brief } from "@/types";
import { fetchBriefsByAccountId } from "@/services/briefsService";

export default function AllBriefs() {
  const { selectedAccountId } = useAccount();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);

  useEffect(() => {
    if (selectedAccountId) {
      loadBriefs();
    }
  }, [selectedAccountId]);

  const loadBriefs = async () => {
    if (!selectedAccountId) return;

    setLoading(true);
    try {
      const data = await fetchBriefsByAccountId(selectedAccountId);
      // Sort by created_at descending (newest first)
      const sortedData = data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setBriefs(sortedData);
    } catch (error) {
      console.error('Failed to load briefs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBriefs = briefs.filter(brief =>
    searchQuery === "" || 
    brief.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brief.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brief.assigned_to.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!selectedAccountId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Select an Account</h3>
            <p className="text-muted-foreground">
              Please select an ad account from the sidebar to view briefs
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">All Briefs</h1>
              <p className="text-muted-foreground">
                Manage and track all creative briefs for your account
              </p>
            </div>
          </div>
        </div>

        {/* Briefs List */}
        <Card className="shadow-card overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">
                All Briefs ({filteredBriefs.length})
              </h3>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search briefs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button onClick={loadBriefs} variant="outline" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading briefs...</p>
              </div>
            ) : filteredBriefs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No briefs found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">ID</TableHead>
                        <TableHead className="min-w-[250px]">Name</TableHead>
                        <TableHead className="w-[150px]">Status</TableHead>
                        <TableHead className="w-[150px]">Assigned To</TableHead>
                        <TableHead className="w-[180px]">Created</TableHead>
                        <TableHead className="w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBriefs.map((brief) => (
                        <TableRow 
                          key={brief.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedBrief(brief)}
                        >
                          <TableCell className="font-medium">#{brief.id}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">
                                {brief.name || <span className="text-muted-foreground italic">Untitled Brief</span>}
                              </p>
                              {brief.market_awareness && (
                                <p className="text-xs text-muted-foreground">
                                  {brief.market_awareness}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(brief.status)}>
                              {brief.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {brief.assigned_to || <span className="text-muted-foreground italic">Unassigned</span>}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {formatDate(brief.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBrief(brief);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {filteredBriefs.map((brief) => (
                    <Card 
                      key={brief.id}
                      className="cursor-pointer hover:shadow-lg transition-all"
                      onClick={() => setSelectedBrief(brief)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-muted-foreground">#{brief.id}</span>
                              <Badge className={getStatusColor(brief.status)}>
                                {brief.status}
                              </Badge>
                            </div>
                            <CardTitle className="text-base">
                              {brief.name || <span className="text-muted-foreground italic">Untitled Brief</span>}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {brief.market_awareness && (
                          <p className="text-sm text-muted-foreground">
                            {brief.market_awareness}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{brief.assigned_to || 'Unassigned'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(brief.created_at)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Brief Details Modal */}
        {selectedBrief && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedBrief(null)}
          >
            <Card 
              className="max-w-3xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Brief #{selectedBrief.id}</span>
                      <Badge className={getStatusColor(selectedBrief.status)}>
                        {selectedBrief.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl">
                      {selectedBrief.name || <span className="text-muted-foreground italic">Untitled Brief</span>}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBrief(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedBrief.assigned_to || <span className="text-muted-foreground italic">Unassigned</span>}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatDate(selectedBrief.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Market Awareness */}
                {selectedBrief.market_awareness && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Market Awareness</h3>
                    </div>
                    <p className="text-foreground/90 leading-relaxed">{selectedBrief.market_awareness}</p>
                  </div>
                )}

                {/* Angle */}
                {selectedBrief.angle && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-lg">Angle</h3>
                    </div>
                    <p className="text-foreground/90 leading-relaxed">{selectedBrief.angle}</p>
                  </div>
                )}

                {/* Format */}
                {selectedBrief.format && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-green-500" />
                      <h3 className="font-semibold text-lg">Format</h3>
                    </div>
                    <p className="text-foreground/90 leading-relaxed">{selectedBrief.format}</p>
                  </div>
                )}

                {/* Theme */}
                {selectedBrief.theme && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-5 w-5 text-purple-500" />
                      <h3 className="font-semibold text-lg">Theme</h3>
                    </div>
                    <p className="text-foreground/90 leading-relaxed">{selectedBrief.theme}</p>
                  </div>
                )}

                {/* Avatar (Demographic Info) */}
                {selectedBrief.avatar && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-orange-500" />
                      <h3 className="font-semibold text-lg">Audience Demographics</h3>
                    </div>
                    <p className="text-foreground/90 leading-relaxed">{selectedBrief.avatar}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

