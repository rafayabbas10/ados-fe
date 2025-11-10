import { Brief } from "@/types";

const ALL_BRIEFS_WEBHOOK_URL = "https://n8n.srv931040.hstgr.cloud/webhook/all-briefs";

export const fetchBriefsByAccountId = async (accountId: string): Promise<Brief[]> => {
  try {
    console.log("🔄 Fetching briefs for account:", accountId);
    
    // Add account_id as query parameter
    const url = `${ALL_BRIEFS_WEBHOOK_URL}?account_id=${accountId}`;
    console.log("🔄 Webhook URL:", url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log("📊 Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseText = await response.text();
    console.log("📄 Raw response text:", responseText);
    
    if (!responseText || responseText.trim() === '') {
      console.log("⚠️ Empty response from briefs webhook");
      return [];
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log("✅ Briefs webhook response:", data);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON response:", parseError);
      return [];
    }
    
    if (Array.isArray(data)) {
      return data as Brief[];
    }
    
    return [];
    
  } catch (error) {
    console.error("❌ Error fetching briefs:", error);
    throw error;
  }
};

