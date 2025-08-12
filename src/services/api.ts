import axios from 'axios';
import { FlowDataPoint, ApiConfig } from '../types';

export class FlowDataAPI {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async fetchFlowData(startDate?: string, endDate?: string): Promise<FlowDataPoint[]> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await axios.get(`${this.baseUrl}/flows`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        params,
        timeout: 30000, // 30 second timeout
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format: expected array of flow data');
      }

      // Validate required fields
      const validatedData = response.data.map((item: any) => {
        if (!item.date || !item.bucket || typeof item.net_flow_usd !== 'number') {
          throw new Error(`Invalid data point: missing required fields in ${JSON.stringify(item)}`);
        }
        
        return {
          date: item.date,
          bucket: item.bucket,
          net_flow_usd: item.net_flow_usd,
          aum_usd: item.aum_usd || undefined,
          price_ccy: item.price_ccy || undefined,
          ccy: item.ccy || undefined,
        } as FlowDataPoint;
      });

      return validatedData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(`API Error ${error.response.status}: ${error.response.statusText}`);
        } else if (error.request) {
          throw new Error('Network error: Unable to reach API server');
        }
      }
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        timeout: 10000, // 10 second timeout for health check
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

// Singleton instance for the app
let apiInstance: FlowDataAPI | null = null;

export const getAPIInstance = (): FlowDataAPI | null => {
  return apiInstance;
};

export const initializeAPI = (config: ApiConfig): FlowDataAPI => {
  apiInstance = new FlowDataAPI(config);
  return apiInstance;
};

export const clearAPIInstance = (): void => {
  apiInstance = null;
};
