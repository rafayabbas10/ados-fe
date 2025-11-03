"use client";

import React, { useState, useEffect } from 'react';
import { useAccount } from '@/contexts/AccountContext';
import { fetchCreativesByAccountId, Creative } from '@/services/creativesService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Video, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdSelectorProps {
  onSelect: (ad: Creative) => void;
}

export function AdSelector({ onSelect }: AdSelectorProps) {
  const { selectedAccountId } = useAccount();
  const [ads, setAds] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  useEffect(() => {
    if (selectedAccountId) {
      loadAds();
    }
  }, [selectedAccountId]);
  
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
    setShowDropdown(false);
    setSearchQuery('');
  };
  
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search ads by ID or name..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="pl-9 h-12 text-base"
        />
      </div>
      
      {showDropdown && (
        <div className="absolute z-50 w-full mt-2 bg-popover border rounded-lg shadow-lg max-h-96 overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAds.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No ads found</p>
              {searchQuery && (
                <p className="text-xs mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              {videoAds.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                    📹 Video Ads ({videoAds.length})
                  </div>
                  {videoAds.map(ad => (
                    <AdItem key={ad.id} ad={ad} onClick={() => handleSelectAd(ad)} />
                  ))}
                </div>
              )}
              
              {imageAds.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                    📷 Image Ads ({imageAds.length})
                  </div>
                  {imageAds.map(ad => (
                    <AdItem key={ad.id} ad={ad} onClick={() => handleSelectAd(ad)} />
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}

function AdItem({ ad, onClick }: { ad: Creative; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3 flex items-center gap-3 hover:bg-accent transition-colors text-left",
        "border-b border-border last:border-0"
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
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
            <Video className="w-6 h-6 text-muted-foreground" />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
      </div>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-muted-foreground">#{ad.id}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
            {ad.ad_type}
          </span>
        </div>
        <p className="text-sm font-medium text-foreground truncate">{ad.name}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>Spend: ${ad.spend.toFixed(2)}</span>
          <span>•</span>
          <span>ROAS: {ad.roas.toFixed(2)}x</span>
        </div>
      </div>
    </button>
  );
}

