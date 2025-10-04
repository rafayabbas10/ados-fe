import { AdAccount } from "@/types";

const WEBHOOK_URL = "https://n8n.srv931040.hstgr.cloud/webhook/f3f494b6-3082-41b6-aa75-844c49fcfcb8";

export const fetchAdAccounts = async (): Promise<AdAccount[]> => {
  try {
    console.log("🔄 Fetching ad accounts from webhook:", WEBHOOK_URL);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors', // Try CORS first
    });
    
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
      
      await fetch(WEBHOOK_URL, {
        method: 'GET',
        mode: 'no-cors',
      });
      
      console.log("📊 No-CORS response received (limited info available)");
      // With no-cors, we can't read the response, so this is just to trigger the webhook
      
    } catch (noCorsError) {
      console.error("❌ No-CORS fallback also failed:", noCorsError);
    }
    
    throw error;
  }
};
