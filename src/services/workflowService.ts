// Service for fetching production workflow ads

const WORKFLOW_WEBHOOK_URL = 'https://n8n.srv931040.hstgr.cloud/webhook/753e3688-844f-4e05-9434-12f1776c2a56';
const UPDATE_STATUS_WEBHOOK_URL = 'https://n8n.srv931040.hstgr.cloud/webhook/0c98a34f-98fa-4996-b044-e2b936f1643d';

export interface ProductionAd {
  id: number;
  account_id: string;
  name: string;
  market_awareness: string;
  angle: string;
  format: string;
  theme: string;
  status: 'Briefed' | 'In Production' | 'In Editing' | 'Ready to Launch' | 'Launched' | 'Iterating';
  assigned_to: string;
  created_at: string;
  avatar: string;
}

export async function fetchProductionAds(accountId: string): Promise<ProductionAd[]> {
  try {
    const response = await fetch(`${WORKFLOW_WEBHOOK_URL}?accountId=${accountId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch production ads: ${response.statusText}`);
    }

    const data = await response.json();
    return data as ProductionAd[];
  } catch (error) {
    console.error('Error fetching production ads:', error);
    throw error;
  }
}

export async function updateAdStatus(productionTaskId: number, newStatus: string): Promise<void> {
  try {
    const response = await fetch(UPDATE_STATUS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: productionTaskId,
        status: newStatus
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update ad status: ${response.statusText}`);
    }

    console.log(`Successfully updated ad ${productionTaskId} to status: ${newStatus}`);
  } catch (error) {
    console.error('Error updating ad status:', error);
    throw error;
  }
}

