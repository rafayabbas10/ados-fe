import { AdAccount } from "@/types";

const WEBHOOK_URL = "https://n8n.srv931040.hstgr.cloud/webhook/f3f494b6-3082-41b6-aa75-844c49fcfcb8";
const AVAILABLE_ACCOUNTS_WEBHOOK = "https://n8n.srv931040.hstgr.cloud/webhook/get-available-accounts";
const ADD_ACCOUNTS_WEBHOOK = "https://n8n.srv931040.hstgr.cloud/webhook/add-ad-accounts";
const UPDATE_ACCOUNT_NAME_WEBHOOK = "https://n8n.srv931040.hstgr.cloud/webhook/update-ad-account-name";

export const fetchAdAccounts = async (userId?: string): Promise<AdAccount[]> => {
  try {
    console.log("🔄 Fetching ad accounts from webhook:", WEBHOOK_URL);
    console.log("👤 User ID:", userId);
    
    // Build URL with query parameter for user_id if provided
    const url = userId ? `${WEBHOOK_URL}?user_id=${encodeURIComponent(userId)}` : WEBHOOK_URL;
    console.log("📡 Request URL:", url);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log("📊 Response status:", response.status);
    console.log("📊 Response headers:", Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ Raw webhook response:", data);
    console.log("🔍 Response type:", typeof data);
    console.log("📋 Response structure:", JSON.stringify(data, null, 2));
    
    // Handle different possible response structures
    let rawAccounts: Record<string, unknown>[] = [];
    
    if (Array.isArray(data)) {
      rawAccounts = data;
    } else if (data && data.accounts && Array.isArray(data.accounts)) {
      rawAccounts = data.accounts;
    } else if (data && data.data && Array.isArray(data.data)) {
      rawAccounts = data.data;
    } else if (data && typeof data === 'object') {
      // If it's a single object, wrap it in an array
      rawAccounts = [data];
    }
    
    console.log("🔢 Found", rawAccounts.length, "raw accounts");
    
    // Transform the webhook data to match our AdAccount interface
    const transformedAccounts: AdAccount[] = rawAccounts.map((account: Record<string, unknown>, index: number) => {
      console.log(`🔄 Processing account ${index}:`, account);
      
      // Use business_name as primary display name, fallback to name if business_name is empty
      const businessName = typeof account.business_name === 'string' ? account.business_name : '';
      const accountName = typeof account.name === 'string' ? account.name : '';
      const displayName = businessName && businessName.trim() !== "" 
        ? businessName 
        : accountName || `Account ${index + 1}`;
      
      // Convert amount_spent from cents to dollars
      const amountSpent = typeof account.amount_spent === 'string' ? account.amount_spent : '0';
      const totalSpend = amountSpent ? parseFloat(amountSpent) / 100 : 0;
      
      // Generate a simple internal ID based on the Facebook account ID
      const accountId = typeof account.id === 'string' ? account.id : '';
      const internalId = accountId ? accountId.replace('act_', '') : `account-${index}`;
      
      return {
        id: internalId,
        facebook_account_id: accountId || `act_${index}`,
        account_name: displayName,
        currency: (typeof account.currency === 'string' ? account.currency : null) || "USD",
        timezone: (typeof account.timezone === 'string' ? account.timezone : null) || "America/New_York", 
        status: (typeof account.status === 'string' ? account.status as 'ACTIVE' | 'PAUSED' | 'DISABLED' : "ACTIVE"),
        created_at: new Date().toISOString(), // Default to current date
        report_count: Math.floor(Math.random() * 15) + 1, // Random report count for demo
        last_audit_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last 30 days
        total_spend: totalSpend,
        avg_roas: Math.round((Math.random() * 4 + 1.5) * 100) / 100 // Random ROAS between 1.5-5.5
      };
    });
    
    console.log("✅ Transformed accounts:", transformedAccounts);
    return transformedAccounts;
    
  } catch (error) {
    console.error("❌ Error fetching ad accounts from webhook:", error);
    
    // Try with no-cors mode as fallback
    try {
      console.log("🔄 Retrying with no-cors mode...");
      
      const fallbackUrl = userId ? `${WEBHOOK_URL}?user_id=${encodeURIComponent(userId)}` : WEBHOOK_URL;
      
      await fetch(fallbackUrl, {
        method: 'GET',
        mode: 'no-cors',
      });
      
      console.log("📊 No-CORS response received (limited info available)");
      // With no-cors, we can't read the response, so this is just to trigger the webhook
      
    } catch (noCorsError) {
      console.error("❌ No-CORS fallback also failed:", noCorsError);
    }
    
    // Check if it was a timeout
    if (error && (error as Error).name === 'AbortError') {
      console.error('⏱️ Request timed out after 8 seconds');
      throw new Error('Request timeout - webhook not responding');
    }
    
    throw error;
  }
};

// Add new ad accounts (single or multiple)
export const addAdAccounts = async (accountIds: string[]): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log("🔄 Adding ad accounts:", accountIds);
    
    const response = await fetch(ADD_ACCOUNTS_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: accountIds }),
      mode: 'cors',
    });
    
    console.log("📊 Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ Accounts added successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Error adding ad accounts:", error);
    throw error;
  }
};

// Update ad account business name
export const updateAdAccountName = async (
  accountId: string,
  businessName: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    console.log("🔄 Updating ad account name:", accountId, businessName);
    
    const response = await fetch(UPDATE_ACCOUNT_NAME_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        id: accountId,
        business_name: businessName 
      }),
      mode: 'cors',
    });
    
    console.log("📊 Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ Account name updated successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Error updating ad account name:", error);
    throw error;
  }
};

// Delete an ad account
export const deleteAdAccount = async (accountId: string): Promise<void> => {
  try {
    console.log("🔄 Deleting ad account:", accountId);
    
    // TODO: Replace with actual API endpoint
    const response = await fetch(`${WEBHOOK_URL}/delete-account/${accountId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log("✅ Account deleted successfully");
  } catch (error) {
    console.error("❌ Error deleting ad account:", error);
    throw error;
  }
};

// Interface for available accounts from webhook
export interface AvailableAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  business_name: string;
  amount_spent: string;
  balance: string;
}

// Fetch available accounts that can be added
export const fetchAvailableAccounts = async (): Promise<AvailableAccount[]> => {
  try {
    console.log("🔄 Fetching available ad accounts from webhook:", AVAILABLE_ACCOUNTS_WEBHOOK);
    
    const response = await fetch(AVAILABLE_ACCOUNTS_WEBHOOK, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    console.log("📊 Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ Available accounts fetched:", data);
    
    // Handle different possible response structures
    let availableAccounts: AvailableAccount[] = [];
    
    if (Array.isArray(data)) {
      availableAccounts = data;
    } else if (data && data.accounts && Array.isArray(data.accounts)) {
      availableAccounts = data.accounts;
    } else if (data && data.data && Array.isArray(data.data)) {
      availableAccounts = data.data;
    }
    
    return availableAccounts;
  } catch (error) {
    console.error("❌ Error fetching available ad accounts:", error);
    throw error;
  }
};