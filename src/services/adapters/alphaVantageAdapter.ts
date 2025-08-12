import axios from 'axios';
import { FlowDataPoint } from '../../types';

interface AlphaVantageConfig {
  apiKey: string;
  baseUrl?: string;
}

export class AlphaVantageAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: AlphaVantageConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://www.alphavantage.co/query';
  }

  /**
   * Fetch ETF data and estimate flows from volume and price changes
   */
  async fetchETFFlows(symbols: string[], days: number = 90): Promise<FlowDataPoint[]> {
    const flows: FlowDataPoint[] = [];
    
    for (const symbol of symbols) {
      try {
        const data = await this.fetchTimeSeriesDaily(symbol);
        const estimatedFlows = this.estimateFlowsFromPriceVolume(symbol, data);
        flows.push(...estimatedFlows);
      } catch (error) {
        console.warn(`Failed to fetch data for ${symbol}:`, error);
        continue;
      }
      
      // Rate limiting - Alpha Vantage allows 5 calls per minute on free tier
      await this.delay(12000); // 12 second delay between calls
    }
    
    return flows;
  }

  /**
   * Fetch forex data for currency flow estimation
   */
  async fetchForexFlows(pairs: string[]): Promise<FlowDataPoint[]> {
    const flows: FlowDataPoint[] = [];
    
    for (const pair of pairs) {
      try {
        const data = await this.fetchForexDaily(pair);
        const estimatedFlows = this.estimateForexFlows(pair, data);
        flows.push(...estimatedFlows);
      } catch (error) {
        console.warn(`Failed to fetch forex data for ${pair}:`, error);
        continue;
      }
      
      await this.delay(12000);
    }
    
    return flows;
  }

  private async fetchTimeSeriesDaily(symbol: string): Promise<any> {
    const response = await axios.get(this.baseUrl, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: symbol,
        apikey: this.apiKey,
        outputsize: 'full'
      },
      timeout: 30000
    });

    if (response.data['Error Message']) {
      throw new Error(`Alpha Vantage error: ${response.data['Error Message']}`);
    }

    if (response.data['Note']) {
      throw new Error('API call frequency limit reached');
    }

    return response.data['Time Series (Daily)'];
  }

  private async fetchForexDaily(pair: string): Promise<any> {
    const response = await axios.get(this.baseUrl, {
      params: {
        function: 'FX_DAILY',
        from_symbol: pair.slice(0, 3),
        to_symbol: pair.slice(3, 6),
        apikey: this.apiKey,
        outputsize: 'full'
      },
      timeout: 30000
    });

    if (response.data['Error Message']) {
      throw new Error(`Alpha Vantage error: ${response.data['Error Message']}`);
    }

    return response.data['Time Series (FX Daily)'];
  }

  private estimateFlowsFromPriceVolume(symbol: string, timeSeriesData: any): FlowDataPoint[] {
    const flows: FlowDataPoint[] = [];
    const dates = Object.keys(timeSeriesData).sort();
    
    for (let i = 1; i < dates.length; i++) {
      const currentDate = dates[i];
      const previousDate = dates[i - 1];
      
      const current = timeSeriesData[currentDate];
      const previous = timeSeriesData[previousDate];
      
      const currentPrice = parseFloat(current['4. close']);
      const previousPrice = parseFloat(previous['4. close']);
      const volume = parseFloat(current['5. volume']);
      
      // Estimate flow as volume weighted by price change direction
      const priceChange = currentPrice - previousPrice;
      const priceChangePercent = priceChange / previousPrice;
      
      // Flow estimation: positive price moves with high volume = inflows
      const estimatedFlow = priceChangePercent * volume * currentPrice * 0.1; // Scale factor
      
      flows.push({
        date: currentDate,
        bucket: this.mapSymbolToBucket(symbol),
        net_flow_usd: estimatedFlow,
        aum_usd: volume * currentPrice * 50, // Rough AUM estimation
        price_ccy: 'USD'
      });
    }
    
    return flows.slice(-90); // Last 90 days
  }

  private estimateForexFlows(pair: string, timeSeriesData: any): FlowDataPoint[] {
    const flows: FlowDataPoint[] = [];
    const dates = Object.keys(timeSeriesData).sort();
    
    for (let i = 1; i < dates.length; i++) {
      const currentDate = dates[i];
      const previousDate = dates[i - 1];
      
      const current = timeSeriesData[currentDate];
      const previous = timeSeriesData[previousDate];
      
      const currentRate = parseFloat(current['4. close']);
      const previousRate = parseFloat(previous['4. close']);
      
      // Estimate flow based on currency strength changes
      const rateChange = currentRate - previousRate;
      const rateChangePercent = rateChange / previousRate;
      
      // Base flow on typical daily FX volumes (scaled)
      const estimatedFlow = rateChangePercent * 10e9; // $10B base volume
      
      flows.push({
        date: currentDate,
        bucket: pair.slice(0, 3), // Currency code
        net_flow_usd: estimatedFlow,
        price_ccy: 'USD'
      });
    }
    
    return flows.slice(-90);
  }

  private mapSymbolToBucket(symbol: string): string {
    // Map ETF symbols to dashboard buckets
    const mapping: Record<string, string> = {
      'SPY': 'US Equities',
      'QQQ': 'Technology',
      'IWM': 'Small Cap',
      'EFA': 'DM ex-US Equities',
      'EEM': 'EM Equities',
      'VTI': 'US Equities',
      'BND': 'US Investment Grade Credit',
      'TLT': 'US Treasuries (Long)',
      'GLD': 'Gold',
      'SLV': 'Silver',
      'USO': 'Crude Oil (WTI)',
      'VNQ': 'Real Estate (REITs)',
      'XLF': 'Financials',
      'XLE': 'Energy',
      'XLK': 'Technology',
      'XLV': 'Health Care',
      'XLU': 'Utilities',
      'XLI': 'Industrials',
      'XLY': 'Consumer Discretionary',
      'XLP': 'Consumer Staples'
    };
    
    return mapping[symbol] || symbol;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Simple connection test - just fetch one symbol
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: 'SPY',
          apikey: this.apiKey,
          outputsize: 'compact'
        },
        timeout: 10000
      });

      // Check for common error responses
      if (response.data['Error Message']) {
        console.error('Alpha Vantage error:', response.data['Error Message']);
        return false;
      }

      if (response.data['Note']) {
        console.error('Alpha Vantage rate limit:', response.data['Note']);
        return false;
      }

      if (response.data['Information']) {
        console.error('Alpha Vantage info:', response.data['Information']);
        return false;
      }

      // Check if we got valid time series data
      const timeSeriesData = response.data['Time Series (Daily)'];
      return timeSeriesData && Object.keys(timeSeriesData).length > 0;
    } catch (error) {
      console.error('Alpha Vantage connection test failed:', error);
      return false;
    }
  }
}

// Pre-configured symbol lists for different asset classes
export const ALPHA_VANTAGE_SYMBOLS = {
  equities: ['SPY', 'QQQ', 'IWM', 'EFA', 'EEM', 'VTI'],
  sectors: ['XLF', 'XLE', 'XLK', 'XLV', 'XLU', 'XLI', 'XLY', 'XLP'],
  bonds: ['BND', 'TLT', 'HYG', 'EMB', 'TIP'],
  commodities: ['GLD', 'SLV', 'USO', 'UNG', 'DBA'],
  forex: ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD'],
  reits: ['VNQ', 'SCHH']
};
