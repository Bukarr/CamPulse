import { ReportCategory } from '../types';

export interface ReportData {
  category: string;
  severity: string;
  location_hint: string;
  sentiment: string;
}

/**
 * NestJS-style Service for handling maintenance report parsing and extraction via Gemma 4 API.
 */
export class AIParsingService {
  private gemmaApiUrl: string;

  constructor() {
    // Read from process.env if available, otherwise fallback
    this.gemmaApiUrl = (typeof process !== 'undefined' && process.env && process.env.GEMMA_API_URL) || '';
  }

  /**
   * Communicates with GEMMA_API_URL using a system-prompted JSON extraction schema
   * to parse categories, severities, location hints, and sentiments.
   * If local AI instance fails or is unreachable, returns fallback values ('General' category, default severity).
   */
  async parseReport(rawText: string): Promise<ReportData> {
    const defaultData: ReportData = {
      category: 'General',
      severity: 'medium',
      location_hint: '',
      sentiment: 'neutral'
    };

    if (!this.gemmaApiUrl) {
      console.warn('[AIParsingService] GEMMA_API_URL not configured. Returning fallback ReportData.');
      return defaultData;
    }

    try {
      console.log(`[AIParsingService] Direct routing request to self-hosted Gemma 4 at: ${this.gemmaApiUrl}`);
      const systemInstruction = `You are the Gemma 4 campus maintenance intake engine for Ahmadu Bello University, Zaria.
Analyze the user's free-text maintenance report and extract the following fields:
- category: MUST be one of: "broken_lights", "plumbing", "wifi_outage", "security", "structural", or "others".
- severity: MUST be one of: "low", "medium", "high", or "urgent".
- location_hint: Extract any specific location indicators (e.g. "near hostel gate", "Suleiman hall Block C"). Max 50 characters.
- sentiment: MUST be one of: "frustrated", "neutral", "calm", or "angry".

Return ONLY a strict JSON object matching this schema, without any markdown formatting or block quotes:
{
  "category": "broken_lights" | "plumbing" | "wifi_outage" | "security" | "structural" | "others",
  "severity": "low" | "medium" | "high" | "urgent",
  "location_hint": "string",
  "sentiment": "frustrated" | "neutral" | "calm" | "angry"
}`;

      const endpoint = this.gemmaApiUrl.trim();
      let targetUrl = endpoint;
      let body: any = {};
      const headers: any = { 'Content-Type': 'application/json' };

      if (endpoint.includes('/v1')) {
        targetUrl = endpoint.endsWith('/') ? `${endpoint}chat/completions` : `${endpoint}/chat/completions`;
        body = {
          model: 'gemma4',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: rawText }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        };
      } else if (endpoint.includes(':11434') || endpoint.includes('/api/generate')) {
        targetUrl = endpoint.endsWith('/api/generate') ? endpoint : `${endpoint}/api/generate`;
        body = {
          model: 'gemma',
          prompt: `System: ${systemInstruction}\nUser: ${rawText}`,
          stream: false,
          format: 'json',
          options: { temperature: 0.1 }
        };
      } else {
        body = {
          prompt: `System: ${systemInstruction}\nUser: ${rawText}`,
          temperature: 0.1,
          jsonMode: true
        };
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: typeof AbortSignal !== 'undefined' ? AbortSignal.timeout(10000) : undefined
      });

      if (!response.ok) {
        throw new Error(`Gemma AI API returned non-OK status: ${response.status}`);
      }

      const data = await response.json();
      let resultText = '';

      if (data.choices && data.choices[0] && data.choices[0].message) {
        resultText = data.choices[0].message.content;
      } else if (data.response) {
        resultText = data.response;
      } else if (data.text) {
        resultText = data.text;
      } else if (typeof data === 'string') {
        resultText = data;
      } else {
        resultText = JSON.stringify(data);
      }

      // Clean potential markdown wrapper
      let jsonStr = resultText.trim();
      if (jsonStr.includes('```')) {
        const matches = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
        if (matches && matches[1]) {
          jsonStr = matches[1].trim();
        }
      }

      const aiData = JSON.parse(jsonStr);
      return {
        category: aiData.category || defaultData.category,
        severity: aiData.severity || defaultData.severity,
        location_hint: aiData.location_hint || defaultData.location_hint,
        sentiment: aiData.sentiment || defaultData.sentiment
      };

    } catch (err) {
      console.error('[AIParsingService Error] Connection to local Gemma 4 failed. Using fallback:', err);
      return defaultData;
    }
  }
}
