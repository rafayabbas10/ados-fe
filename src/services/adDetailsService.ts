import { Ad, VideoScene, AIVariationsResponse } from "@/types";

const AD_DETAILS_WEBHOOK = "https://n8n.srv931040.hstgr.cloud/webhook/67e2704e-b850-48e8-bbd8-b7ec3af93d71";
const VIDEO_SCENES_WEBHOOK = "https://n8n.srv931040.hstgr.cloud/webhook/992b2c29-4e01-45bb-ad8a-7811ec1d1de2";
const AI_VARIATIONS_WEBHOOK = "https://n8n.srv931040.hstgr.cloud/webhook/9e9f944c-6bc0-45e7-9518-709490b2a167";

/**
 * Fetches detailed information for a specific ad
 * @param adId - The ID of the ad (can be ad name or Facebook ad ID)
 * @returns Promise<Ad | null>
 */
export async function fetchAdDetails(adId: string): Promise<Ad | null> {
  try {
    const url = `${AD_DETAILS_WEBHOOK}?ad_id=${encodeURIComponent(adId)}`;
    
    console.info('🔄 Fetching ad details for:', adId);
    console.info('🔄 Webhook URL:', url);
    
    const response = await fetch(url);
    
    console.info('📊 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch ad details:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.info('✅ Ad details response:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching ad details:', error);
    return null;
  }
}

/**
 * Fetches video scenes breakdown for a specific ad
 * @param adId - The ID of the ad
 * @returns Promise<VideoScene[]>
 */
export async function fetchVideoScenes(adId: string): Promise<VideoScene[]> {
  try {
    const url = `${VIDEO_SCENES_WEBHOOK}?ad_id=${encodeURIComponent(adId)}`;
    
    console.info('🔄 Fetching video scenes for:', adId);
    console.info('🔄 Webhook URL:', url);
    
    const response = await fetch(url);
    
    console.info('📊 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Failed to fetch video scenes:', response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.info('✅ Video scenes response:', data);
    
    // Handle the new webhook format: { value: [...] }
    if (data && data.value && Array.isArray(data.value)) {
      console.info('✅ Found video scenes in value array with length:', data.value.length);
      return data.value;
    }
    
    // Handle both array and single object responses (fallback)
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching video scenes:', error);
    return [];
  }
}

/**
 * Fetches AI-generated variations for a specific ad
 * @param adId - The ID of the ad
 * @returns Promise<AIVariationsResponse[]>
 */
export async function fetchAIVariations(adId: string): Promise<AIVariationsResponse[]> {
  try {
    const url = `${AI_VARIATIONS_WEBHOOK}?ad_id=${encodeURIComponent(adId)}`;
    
    console.info('🔄 Fetching AI variations for:', adId);
    console.info('🔄 Webhook URL:', url);
    console.info('🔄 Making fetch request...');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.info('📊 Response status:', response.status);
    console.info('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('❌ Failed to fetch AI variations:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error response body:', errorText);
      return [];
    }
    
    const data = await response.json();
    console.info('✅ AI variations response:', data);
    console.info('✅ Response data type:', typeof data);
    console.info('✅ Response is array:', Array.isArray(data));
    
    // Handle the current webhook format: { variations: [{ v1: [...] }, { v2: [...] }, ...] }
    if (data && data.variations && Array.isArray(data.variations)) {
      console.info('✅ Found variations array with length:', data.variations.length);
      console.info('✅ Variations structure:', data.variations.map((v: Record<string, unknown>, i: number) => `${i}: ${Object.keys(v).join(', ')}`));
      console.info('✅ Sample variation data:', data.variations[0]);
      console.info('✅ Returning variations array to ad details page');
      return data.variations;
    }
    
    // Handle older format: { value: [{ variations: [{ v1: [...], v2: [...], ... }] }] }
    if (data && data.value && Array.isArray(data.value) && data.value.length > 0) {
      const firstItem = data.value[0];
      if (firstItem && firstItem.variations && Array.isArray(firstItem.variations) && firstItem.variations.length > 0) {
        console.info('✅ Found variations in value array with length:', firstItem.variations.length);
        return firstItem.variations;
      }
    }
    
    // Handle array format: [{ variations: [{ v1: [...] }, { v2: [...] }, ...] }]
    if (Array.isArray(data) && data.length > 0 && data[0].variations) {
      console.info('✅ Found variations in array format');
      console.info('✅ Array item has variations:', data[0].variations.length);
      return data[0].variations;
    }
    
    // Fallback for direct array format
    if (Array.isArray(data)) {
      console.info('✅ Using fallback for direct array format');
      return data;
    }
    
    console.warn('⚠️ Unexpected data format, returning empty array');
    return [];
  } catch (error) {
    console.error('❌ Error fetching AI variations:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}
