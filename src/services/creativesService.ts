// Service for fetching ad creatives from webhook

const CREATIVES_WEBHOOK_URL = 'https://n8n.srv931040.hstgr.cloud/webhook/686d9167-79c3-44c4-b924-668cb6196aa2';

export interface Creative {
  id: number;
  name: string;
  link: string;
  spend: number;
  roas: number;
  total_views: number;
  ad_video_link: string;
  ad_type: 'video' | 'image';
  thumbstop: number | null;
  hold_rate: number | null;
  ctr: number;
  hook: string;
}

export async function fetchCreativesByAccountId(accountId: string): Promise<Creative[]> {
  try {
    const response = await fetch(`${CREATIVES_WEBHOOK_URL}?accountId=${accountId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch creatives: ${response.statusText}`);
    }

    const data = await response.json();
    return data as Creative[];
  } catch (error) {
    console.error('Error fetching creatives:', error);
    throw error;
  }
}

