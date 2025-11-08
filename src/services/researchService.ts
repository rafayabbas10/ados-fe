// Research Service - Handles research ads and elements API calls

const API_BASE_URL = 'https://n8n.srv931040.hstgr.cloud/webhook';

export interface ResearchAd {
  id: number;
  name: string;
  description: string;
  categories: string;
  creative_targeting: string;
  languages: string | null;
  target_market: string;
  niches: string;
  product_category: string;
  transcription: string | null;
  type: 'image' | 'video';
  emotional_drivers: string; // JSON string
  product_link: string;
  thumbnail: string | null;
  video_link: string | null;
  video_duration: number | null;
  created_at: string;
  account_id: string;
  image_link: string | null;
}

export interface EmotionalDrivers {
  achievement: number;
  anger: number;
  authority: number;
  belonging: number;
  competence: number;
  curiosity: number;
  empowerment: number;
  engagement: number;
  esteem: number;
  fear: number;
  guilt: number;
  nostalgia: number;
  nurturance: number;
  security: number;
  urgency: number;
}

export interface ResearchElement {
  id: number;
  account_id: string;
  Avatar: string;
  Awareness: string;
  Angle: string;
  Format: string;
  Theme: string;
  Tonality: string;
  created_at: string;
  research_ad_id: number;
  Hook: string | null;
}

/**
 * Start research for a given account
 * @param accountId The account ID to start research for
 * @param startDate Start date for research (YYYY-MM-DD)
 * @param endDate End date for research (YYYY-MM-DD)
 */
export async function startResearch(
  accountId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; message?: string }> {
  try {
    console.log('🔄 Starting research for account:', accountId);
    
    const response = await fetch(`${API_BASE_URL}/start-research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        account_id: accountId,
        startDate: startDate,
        endDate: endDate
      }]),
      mode: 'cors',
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to start research: ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    if (!responseText || responseText.trim() === '') {
      console.log('⚠️ Empty response from start research webhook');
      return { success: true, message: 'Research started successfully' };
    }

    // Try to parse as JSON, but if it's plain text, that's fine too
    let message = 'Research started successfully';
    try {
      const data = JSON.parse(responseText);
      console.log('✅ Start research response (JSON):', data);
      message = data.message || message;
    } catch (parseError) {
      // Response is plain text, not JSON - this is okay
      console.log('✅ Start research response (plain text):', responseText);
      message = responseText;
    }

    return { success: true, message };
  } catch (error) {
    console.error('❌ Error starting research:', error);
    throw error;
  }
}

/**
 * Fetch research ads for a given account
 * @param accountId The account ID to fetch research ads for
 */
export async function getResearchAds(accountId: string): Promise<ResearchAd[]> {
  try {
    console.log('🔄 Fetching research ads for account:', accountId);
    
    // Build URL with query parameter (following the pattern used by other services)
    const url = `${API_BASE_URL}/research-ads?account_id=${encodeURIComponent(accountId)}`;
    console.log('📡 Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors', // Important for cross-origin requests
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch research ads: ${response.statusText}`);
    }

    // Check if response has content before parsing JSON
    const responseText = await response.text();
    console.log('📄 Raw response length:', responseText.length);
    
    if (!responseText || responseText.trim() === '') {
      console.log('⚠️ Empty response from research ads webhook');
      return [];
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ Research ads response:', data);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.error('📄 Response text that failed to parse:', responseText);
      return [];
    }

    // Ensure we return an array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching research ads:', error);
    throw error;
  }
}

/**
 * Fetch research elements for a given account
 * @param accountId The account ID to fetch research elements for
 */
export async function getResearchElements(accountId: string): Promise<ResearchElement[]> {
  try {
    console.log('🔄 Fetching research elements for account:', accountId);
    
    // Build URL with query parameter (following the pattern used by other services)
    const url = `${API_BASE_URL}/research-elements?account_id=${encodeURIComponent(accountId)}`;
    console.log('📡 Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors', // Important for cross-origin requests
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch research elements: ${response.statusText}`);
    }

    // Check if response has content before parsing JSON
    const responseText = await response.text();
    console.log('📄 Raw response length:', responseText.length);
    
    if (!responseText || responseText.trim() === '') {
      console.log('⚠️ Empty response from research elements webhook');
      return [];
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ Research elements response:', data);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.error('📄 Response text that failed to parse:', responseText);
      return [];
    }

    // Ensure we return an array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ Error fetching research elements:', error);
    throw error;
  }
}

/**
 * Parse emotional drivers from JSON string
 */
export function parseEmotionalDrivers(emotionalDriversString: string): EmotionalDrivers {
  try {
    return JSON.parse(emotionalDriversString) as EmotionalDrivers;
  } catch (error) {
    console.error('Error parsing emotional drivers:', error);
    // Return default values if parsing fails
    return {
      achievement: 0,
      anger: 0,
      authority: 0,
      belonging: 0,
      competence: 0,
      curiosity: 0,
      empowerment: 0,
      engagement: 0,
      esteem: 0,
      fear: 0,
      guilt: 0,
      nostalgia: 0,
      nurturance: 0,
      security: 0,
      urgency: 0,
    };
  }
}

/**
 * Get top emotional drivers from emotional drivers object
 * @param drivers EmotionalDrivers object
 * @param count Number of top drivers to return
 */
export function getTopEmotionalDrivers(
  drivers: EmotionalDrivers,
  count: number = 5
): Array<{ name: string; value: number }> {
  const driverEntries = Object.entries(drivers)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, count)
    .filter(driver => driver.value > 0);

  return driverEntries;
}

/**
 * Get emotion color for visual representation
 */
export function getEmotionColor(emotion: string): string {
  const colorMap: Record<string, string> = {
    achievement: '#10b981', // green
    anger: '#ef4444', // red
    authority: '#8b5cf6', // purple
    belonging: '#3b82f6', // blue
    competence: '#06b6d4', // cyan
    curiosity: '#f59e0b', // amber
    empowerment: '#ec4899', // pink
    engagement: '#6366f1', // indigo
    esteem: '#14b8a6', // teal
    fear: '#f97316', // orange
    guilt: '#64748b', // slate
    nostalgia: '#a855f7', // violet
    nurturance: '#22c55e', // lime
    security: '#0ea5e9', // sky
    urgency: '#dc2626', // red
  };
  
  return colorMap[emotion.toLowerCase()] || '#6b7280'; // default gray
}

