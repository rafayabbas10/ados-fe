export interface VariableSelectorOptions {
  avatar: string[];
  market_awareness: string[];
  angle: string[];
  format: string[];
  theme: string[];
  tonality: string[];
}

export const fetchVariableSelectorOptions = async (accountId: string): Promise<VariableSelectorOptions> => {
  try {
    console.log("🔄 Fetching variable selector options for account:", accountId);
    
    const response = await fetch(`https://n8n.srv931040.hstgr.cloud/webhook/157452ba-c10f-4a04-acab-8bfa4e188e04?accountId=${accountId}`, {
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

    // Check if response has content before parsing JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.warn("⚠️ Empty response body, returning empty options");
      return {
        avatar: [],
        market_awareness: [],
        angle: [],
        format: [],
        theme: [],
        tonality: []
      };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError);
      console.error("Response text:", text);
      throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
    
    console.log("✅ Raw webhook response:", data);
    
    // Transform the array of objects into a single object with all keys
    const options: VariableSelectorOptions = {
      avatar: [],
      market_awareness: [],
      angle: [],
      format: [],
      theme: [],
      tonality: []
    };

    // The response has a "value" property containing the array
    const dataArray = data.value || data;
    
    // The response is an array of objects, each with a single key
    if (Array.isArray(dataArray)) {
      dataArray.forEach((item: Record<string, string[]>) => {
        Object.keys(item).forEach((key) => {
          if (key in options) {
            options[key as keyof VariableSelectorOptions] = item[key];
          }
        });
      });
    }

    console.log("✅ Transformed options:", options);
    return options;
  } catch (error) {
    console.error('❌ Error fetching variable selector options:', error);
    
    // Try with no-cors mode as fallback
    try {
      console.log("🔄 Retrying with no-cors mode...");
      
      await fetch(`https://n8n.srv931040.hstgr.cloud/webhook/157452ba-c10f-4a04-acab-8bfa4e188e04?accountId=${accountId}`, {
        method: 'GET',
        mode: 'no-cors',
      });
      
      console.log("📊 No-CORS response received (limited info available)");
      // With no-cors, we can't read the response, return empty options
      return {
        avatar: [],
        market_awareness: [],
        angle: [],
        format: [],
        theme: [],
        tonality: []
      };
      
    } catch (noCorsError) {
      console.error("❌ No-CORS fallback also failed:", noCorsError);
    }
    
    throw error;
  }
};

