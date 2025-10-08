// Service for fetching ad blocks for a production workflow

const AD_BLOCKS_WEBHOOK_URL = 'https://n8n.srv931040.hstgr.cloud/webhook/d74b3aa2-4f00-4088-a348-2aee0b363191';

export interface AdScene {
  id: number;
  created_at: string;
  workflow_id: number;
  scene: string;
  script: string;
  audio: string;
  visual: string;
  text_overlay: string;
  screenshot_url: string;
  version: string;
}

export interface AdBlockVersion {
  version: string;
  scenes: AdScene[];
}

export async function fetchAdBlocks(productionWorkflowId: number): Promise<AdBlockVersion[]> {
  try {
    const response = await fetch(`${AD_BLOCKS_WEBHOOK_URL}?id=${productionWorkflowId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ad blocks: ${response.statusText}`);
    }

    const data = await response.json();
    return data as AdBlockVersion[];
  } catch (error) {
    console.error('Error fetching ad blocks:', error);
    throw error;
  }
}

