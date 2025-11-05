"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import { fetchCreativesByAccountId, Creative } from '@/services/creativesService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Search, Video, Image as ImageIcon, TrendingUp, DollarSign, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (ad: Creative) => void;
}

export function AdSelectorModal({ isOpen, onClose, onSelect }: AdSelectorModalProps) {
  const { selectedAccountId } = useAccount();
  const [ads, setAds] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (isOpen && selectedAccountId) {
      loadAds();
    }
  }, [isOpen, selectedAccountId]);
  
  const loadAds = async () => {
    if (!selectedAccountId) return;
    
    setLoading(true);
    try {
      const creatives = await fetchCreativesByAccountId(selectedAccountId);
      setAds(creatives);
    } catch (error) {
      console.error('Error loading ads:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredAds = ads.filter(ad => {
    const query = searchQuery.toLowerCase();
    return (
      ad.id.toString().includes(query) ||
      ad.name.toLowerCase().includes(query)
    );
  });
  
  const videoAds = filteredAds.filter(ad => ad.ad_type === 'video');
  const imageAds = filteredAds.filter(ad => ad.ad_type === 'image');
  
  const handleSelectAd = (ad: Creative) => {
    onSelect(ad);
    onClose();
    setSearchQuery('');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Select an Ad to Edit</DialogTitle>
          <DialogDescription>
            Choose an ad from your account to start refining its creative brief
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by ad name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              autoFocus
            />
          </div>
        </div>
        
        <div className="px-6 pb-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="w-20 h-20 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-lg font-medium">No ads found</p>
              {searchQuery && (
                <p className="text-sm mt-2">Try a different search term</p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[50vh] pr-4">
              <div className="space-y-6">
                {videoAds.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
                      <Video className="w-4 h-4" />
                      <span>Video Ads ({videoAds.length})</span>
                    </div>
                    <div className="space-y-2">
                      {videoAds.map(ad => (
                        <AdCard key={ad.id} ad={ad} onClick={() => handleSelectAd(ad)} />
                      ))}
                    </div>
                  </div>
                )}
                
                {imageAds.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
                      <ImageIcon className="w-4 h-4" />
                      <span>Image Ads ({imageAds.length})</span>
                    </div>
                    <div className="space-y-2">
                      {imageAds.map(ad => (
                        <AdCard key={ad.id} ad={ad} onClick={() => handleSelectAd(ad)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdCard({ ad, onClick }: { ad: Creative; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 flex items-center gap-4 rounded-lg border-2 border-border bg-card",
        "hover:border-primary hover:shadow-md transition-all duration-200",
        "text-left group"
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0 group-hover:ring-2 group-hover:ring-primary transition-all">
        {ad.ad_type === 'video' && ad.ad_video_link ? (
          <img
            src={ad.ad_video_link}
            alt={ad.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : ad.link ? (
          <img
            src={ad.link}
            alt={ad.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className="hidden absolute inset-0 flex items-center justify-center bg-muted">
          {ad.ad_type === 'video' ? (
            <Video className="w-8 h-8 text-muted-foreground" />
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono px-2 py-1 rounded bg-muted text-muted-foreground">
            #{ad.id}
          </span>
          <span className={cn(
            "text-xs px-2 py-1 rounded font-medium",
            ad.ad_type === 'video' 
              ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          )}>
            {ad.ad_type}
          </span>
        </div>
        <p className="text-base font-semibold text-foreground truncate mb-1 group-hover:text-primary transition-colors">
          {ad.name}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span>${ad.spend.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>{ad.roas.toFixed(2)}x ROAS</span>
          </div>
        </div>
      </div>
      
      {/* Arrow indicator */}
      <div className="text-muted-foreground group-hover:text-primary transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

