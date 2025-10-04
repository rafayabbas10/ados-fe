import { AuditReport, ReportAd, ReportSummary } from "@/types";

const REPORTS_WEBHOOK_URL = "https://n8n.srv931040.hstgr.cloud/webhook/2d09cdfb-c6ec-4151-b2c4-f2329271f300";
const REPORT_DETAILS_WEBHOOK_URL = "https://n8n.srv931040.hstgr.cloud/webhook/02015775-5acd-450a-8d24-8edc7021284a";
const REPORT_ADS_WEBHOOK_URL = "https://n8n.srv931040.hstgr.cloud/webhook/dc6da962-a93b-42b1-ae97-ac182a3726db";
const REPORT_SUMMARY_WEBHOOK_URL = "https://n8n.srv931040.hstgr.cloud/webhook/c9123ffc-2fe9-408c-a782-76d15b8fa358";

export const fetchReportsByAccountId = async (accountId: string): Promise<AuditReport[]> => {
  try {
    console.log("🔄 Fetching reports for account:", accountId);
    
    const accountParam = accountId.startsWith('act_') ? accountId : `act_${accountId}`;
    const url = `${REPORTS_WEBHOOK_URL}?account_id=${accountParam}`;
    console.log("🔄 Webhook URL:", url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    console.log("📊 Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("✅ Webhook response:", data);
    
    // Handle case where webhook returns a message instead of reports array
    if (!Array.isArray(data)) {
      console.log("⚠️ Response is not an array, webhook may still be processing");
      return [];
    }
    
    // Handle case where webhook returns "No audit reports created" message
    if (data.length > 0 && data[0].output) {
      console.log("⚠️ No audit reports created for this account");
      return [];
    }
    
    return data;
    
  } catch (error) {
    console.error("❌ Error fetching reports:", error);
    throw error;
  }
};

export const fetchReportDetails = async (reportId: string): Promise<AuditReport | null> => {
  try {
    console.log("🔄 Fetching report details for:", reportId);
    
    const url = `${REPORT_DETAILS_WEBHOOK_URL}?report_id=${reportId}`;
    console.log("🔄 Webhook URL:", url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    console.log("📊 Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("✅ Report details response:", data);
    
    // Return first item if array, otherwise return data
    return Array.isArray(data) ? data[0] : data;
    
  } catch (error) {
    console.error("❌ Error fetching report details:", error);
    throw error;
  }
};

export const fetchReportAds = async (reportId: string): Promise<ReportAd[]> => {
  try {
    console.log("🔄 Fetching ads for report:", reportId);
    
    const url = `${REPORT_ADS_WEBHOOK_URL}?report_id=${reportId}&_ts=${Date.now()}`;
    console.log("🔄 Webhook URL:", url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    console.log("📊 Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("✅ Report ads raw response:", data);

    // Normalize various possible response shapes
    const candidates = [
      data,
      (data && (data.data || data.output || data.result || data.results || data.items || data.ads))
    ];

    const firstArray = candidates.find((c) => Array.isArray(c)) as ReportAd[] | undefined;

    if (!firstArray) {
      console.log("⚠️ Ads response did not contain an array. Returning empty list.");
      return [];
    }

    // Coerce numeric fields in case the API returns strings
    return firstArray.map((ad) => ({
      ...ad,
      id: (ad as any).id || (ad as any).ad_id || (ad as any).facebook_ad_id || (ad as any).name,
      facebook_ad_id: (ad as any).facebook_ad_id || (ad as any).ad_id || (ad as any).id,
      spend: Number((ad as any).spend) || 0,
      roas: Number((ad as any).roas) || 0,
      aov: Number((ad as any).aov) || 0,
      thumbstop: Number((ad as any).thumbstop) || 0,
      hold_rate: Number((ad as any).hold_rate) || 0,
      ctr: Number((ad as any).ctr) || 0,
      cpa: Number((ad as any).cpa) || 0,
      ad_type: (ad as any).ad_type || "unknown",
    }));
    
  } catch (error) {
    console.error("❌ Error fetching report ads:", error);
    throw error;
  }
};

export const fetchReportSummary = async (reportId: string): Promise<ReportSummary | null> => {
  try {
    console.log("🔄 Fetching summary for report:", reportId);
    
    const url = `${REPORT_SUMMARY_WEBHOOK_URL}?report_id=${reportId}`;
    console.log("🔄 Webhook URL:", url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    console.log("📊 Response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("✅ Report summary response:", data);
    
    // Return first item if array, otherwise return data
    return Array.isArray(data) ? data[0] : data;
    
  } catch (error) {
    console.error("❌ Error fetching report summary:", error);
    throw error;
  }
};
