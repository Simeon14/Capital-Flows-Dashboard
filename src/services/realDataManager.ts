import { FlowDataPoint } from '../types';
import { AlphaVantageAdapter, ALPHA_VANTAGE_SYMBOLS } from './adapters/alphaVantageAdapter';
import { PolygonAdapter, POLYGON_SYMBOLS } from './adapters/polygonAdapter';

export type DataProvider = 'alpha-vantage' | 'polygon' | 'mock';

interface RealDataConfig {
  provider: DataProvider;
  apiKey: string;
  symbols?: string[];
  refreshIntervalHours?: number;
}

export class RealDataManager {
  private config: RealDataConfig;
  private adapter: AlphaVantageAdapter | PolygonAdapter | null = null;
  private lastFetch: Date | null = null;
  private cachedData: FlowDataPoint[] = [];

  constructor(config: RealDataConfig) {
    this.config = config;
    this.initializeAdapter();
  }

  private initializeAdapter(): void {
    switch (this.config.provider) {
      case 'alpha-vantage':
        this.adapter = new AlphaVantageAdapter({
          apiKey: this.config.apiKey
        });
        break;
      
      case 'polygon':
        this.adapter = new PolygonAdapter({
          apiKey: this.config.apiKey
        });
        break;
      
      default:
        throw new Error(`Unsupported data provider: ${this.config.provider}`);
    }
  }

  async fetchFlowData(startDate?: string, endDate?: string): Promise<FlowDataPoint[]> {
    if (!this.adapter) {
      throw new Error('Data adapter not initialized');
    }

    // Check if we need to refresh data
    const shouldRefresh = this.shouldRefreshData();
    if (!shouldRefresh && this.cachedData.length > 0) {
      console.log('Using cached data');
      return this.filterDataByDateRange(this.cachedData, startDate, endDate);
    }

    console.log(`Fetching fresh data from ${this.config.provider}...`);
    
    try {
      let allFlows: FlowDataPoint[] = [];

      if (this.config.provider === 'alpha-vantage') {
        const adapter = this.adapter as AlphaVantageAdapter;
        
        // MUCH more conservative - only fetch 3-4 key ETFs to stay under rate limit
        console.log('Fetching core equity flows (limited to avoid rate limits)...');
        const coreSymbols = ['SPY', 'QQQ', 'GLD']; // Just 3 symbols
        const equityFlows = await adapter.fetchETFFlows(coreSymbols);
        allFlows.push(...equityFlows);

        console.log(`Fetched data for ${coreSymbols.join(', ')} - staying under rate limits`);

      } else if (this.config.provider === 'polygon') {
        const adapter = this.adapter as PolygonAdapter;
        
        console.log('Fetching equity flows...');
        const equityFlows = await adapter.fetchEquityFlows(
          this.config.symbols || POLYGON_SYMBOLS.equities
        );
        allFlows.push(...equityFlows);

        console.log('Fetching sector flows...');
        const sectorFlows = await adapter.fetchEquityFlows(
          POLYGON_SYMBOLS.sectors
        );
        allFlows.push(...sectorFlows);

        console.log('Fetching crypto flows...');
        const cryptoFlows = await adapter.fetchCryptoFlows(
          POLYGON_SYMBOLS.crypto
        );
        allFlows.push(...cryptoFlows);
      }

      // Cache the data
      this.cachedData = allFlows;
      this.lastFetch = new Date();

      console.log(`Successfully fetched ${allFlows.length} flow data points`);
      
      return this.filterDataByDateRange(allFlows, startDate, endDate);

    } catch (error) {
      console.error('Failed to fetch real data:', error);
      
      // Return cached data if available, otherwise throw
      if (this.cachedData.length > 0) {
        console.log('Falling back to cached data due to fetch error');
        return this.filterDataByDateRange(this.cachedData, startDate, endDate);
      }
      
      throw error;
    }
  }

  private shouldRefreshData(): boolean {
    if (!this.lastFetch) return true;
    
    const refreshIntervalMs = (this.config.refreshIntervalHours || 6) * 60 * 60 * 1000;
    const timeSinceLastFetch = Date.now() - this.lastFetch.getTime();
    
    return timeSinceLastFetch > refreshIntervalMs;
  }

  private filterDataByDateRange(
    data: FlowDataPoint[], 
    startDate?: string, 
    endDate?: string
  ): FlowDataPoint[] {
    if (!startDate && !endDate) return data;

    return data.filter(point => {
      if (startDate && point.date < startDate) return false;
      if (endDate && point.date > endDate) return false;
      return true;
    });
  }

  async testConnection(): Promise<boolean> {
    if (!this.adapter) {
      return false;
    }

    try {
      // Use adapter-specific test method if available
      if (this.adapter instanceof AlphaVantageAdapter) {
        return await this.adapter.testConnection();
      }
      
      // Fallback to small data fetch for other adapters
      const testData = await this.fetchFlowData();
      return testData.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  getProviderInfo(): { name: string; description: string; rateLimit: string } {
    switch (this.config.provider) {
      case 'alpha-vantage':
        return {
          name: 'Alpha Vantage',
          description: 'ETF and forex data with flow estimation',
          rateLimit: '5 calls/minute (free), higher with paid plans'
        };
      
      case 'polygon':
        return {
          name: 'Polygon.io',
          description: 'Professional equity and crypto data',
          rateLimit: '5 calls/second with Pro plan'
        };
      
      default:
        return {
          name: 'Unknown',
          description: 'Unknown provider',
          rateLimit: 'Unknown'
        };
    }
  }

  getCachedDataInfo(): { lastFetch: Date | null; dataPoints: number } {
    return {
      lastFetch: this.lastFetch,
      dataPoints: this.cachedData.length
    };
  }
}

// Factory function to create configured data manager
export function createRealDataManager(provider: DataProvider, apiKey: string): RealDataManager {
  return new RealDataManager({
    provider,
    apiKey,
    refreshIntervalHours: 6
  });
}
