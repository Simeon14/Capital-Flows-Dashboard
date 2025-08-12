import axios from 'axios';
import { FlowDataPoint } from '../../types';

interface PolygonConfig {
  apiKey: string;
  baseUrl?: string;
}

export class PolygonAdapter {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: PolygonConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.polygon.io';
  }

  /**
   * Fetch aggregate data and estimate flows from institutional-grade data
   */
  async fetchEquityFlows(symbols: string[], days: number = 90): Promise<FlowDataPoint[]> {
    const flows: FlowDataPoint[] = [];
    const fromDate = this.getDateDaysAgo(days);
    const toDate = this.getDateDaysAgo(1);
    
    for (const symbol of symbols) {
      try {
        const data = await this.fetchAggregates(symbol, fromDate, toDate);
        const estimatedFlows = this.estimateFlowsFromAggregates(symbol, data);
        flows.push(...estimatedFlows);
      } catch (error) {
        console.warn(`Failed to fetch Polygon data for ${symbol}:`, error);
        continue;
      }
      
      // Polygon Pro allows higher rate limits
      await this.delay(200); // 5 requests per second
    }
    
    return flows;
  }

  /**
   * Fetch crypto data for digital asset flows
   */
  async fetchCryptoFlows(symbols: string[]): Promise<FlowDataPoint[]> {
    const flows: FlowDataPoint[] = [];
    const fromDate = this.getDateDaysAgo(90);
    const toDate = this.getDateDaysAgo(1);
    
    for (const symbol of symbols) {
      try {
        const data = await this.fetchCryptoAggregates(symbol, fromDate, toDate);
        const estimatedFlows = this.estimateCryptoFlows(symbol, data);
        flows.push(...estimatedFlows);
      } catch (error) {
        console.warn(`Failed to fetch crypto data for ${symbol}:`, error);
        continue;
      }
      
      await this.delay(200);
    }
    
    return flows;
  }

  private async fetchAggregates(symbol: string, from: string, to: string): Promise<any> {
    const response = await axios.get(
      `${this.baseUrl}/v2/aggs/ticker/${symbol}/range/1/day/${from}/${to}`,
      {
        params: {
          apikey: this.apiKey,
          adjusted: true,
          sort: 'asc'
        },
        timeout: 30000
      }
    );

    if (response.data.status !== 'OK') {
      throw new Error(`Polygon API error: ${response.data.error || 'Unknown error'}`);
    }

    return response.data.results || [];
  }

  private async fetchCryptoAggregates(symbol: string, from: string, to: string): Promise<any> {
    const response = await axios.get(
      `${this.baseUrl}/v2/aggs/ticker/X:${symbol}USD/range/1/day/${from}/${to}`,
      {
        params: {
          apikey: this.apiKey,
          adjusted: true,
          sort: 'asc'
        },
        timeout: 30000
      }
    );

    if (response.data.status !== 'OK') {
      throw new Error(`Polygon crypto API error: ${response.data.error || 'Unknown error'}`);
    }

    return response.data.results || [];
  }

  private estimateFlowsFromAggregates(symbol: string, aggregates: any[]): FlowDataPoint[] {
    const flows: FlowDataPoint[] = [];
    
    for (let i = 1; i < aggregates.length; i++) {
      const current = aggregates[i];
      const previous = aggregates[i - 1];
      
      const currentPrice = current.c; // close price
      const previousPrice = previous.c;
      const volume = current.v;
      const vwap = current.vw; // volume weighted average price
      
      // More sophisticated flow estimation using VWAP and institutional indicators
      const priceChange = currentPrice - previousPrice;
      const priceChangePercent = priceChange / previousPrice;
      const volumeWeight = Math.log(volume + 1) / 20; // Log scale for volume impact
      
      // Flow estimation with better institutional proxy
      const institutionalFlow = priceChangePercent * vwap * volume * 0.05 * volumeWeight;
      
      const date = new Date(current.t).toISOString().split('T')[0];
      
      flows.push({
        date: date,
        bucket: this.mapSymbolToBucket(symbol),
        net_flow_usd: institutionalFlow,
        aum_usd: this.estimateAUM(symbol, currentPrice, volume),
        price_ccy: 'USD'
      });
    }
    
    return flows;
  }

  private estimateCryptoFlows(symbol: string, aggregates: any[]): FlowDataPoint[] {
    const flows: FlowDataPoint[] = [];
    
    for (let i = 1; i < aggregates.length; i++) {
      const current = aggregates[i];
      const previous = aggregates[i - 1];
      
      const currentPrice = current.c;
      const previousPrice = previous.c;
      const volume = current.v;
      
      // Crypto flow estimation - more volatile, different scaling
      const priceChange = currentPrice - previousPrice;
      const priceChangePercent = priceChange / previousPrice;
      
      // Scale for crypto market dynamics
      const cryptoFlow = priceChangePercent * volume * currentPrice * 0.01;
      
      const date = new Date(current.t).toISOString().split('T')[0];
      
      flows.push({
        date: date,
        bucket: this.mapCryptoToBucket(symbol),
        net_flow_usd: cryptoFlow,
        aum_usd: volume * currentPrice * 10, // Different AUM estimation for crypto
        price_ccy: 'USD'
      });
    }
    
    return flows;
  }

  private mapSymbolToBucket(symbol: string): string {
    const mapping: Record<string, string> = {
      'SPY': 'US Equities',
      'QQQ': 'Technology',
      'IWM': 'Small Cap',
      'EFA': 'DM ex-US Equities', 
      'EEM': 'EM Equities',
      'VTI': 'US Equities',
      'VTEB': 'Municipal Bonds',
      'BND': 'US Investment Grade Credit',
      'HYG': 'US High Yield Credit',
      'TLT': 'US Treasuries (Long)',
      'SHY': 'US Treasuries (Short)',
      'IEF': 'US Treasuries (Intermediate)',
      'TIP': 'US TIPS',
      'GLD': 'Gold',
      'SLV': 'Silver',
      'USO': 'Crude Oil (WTI)',
      'UNG': 'Natural Gas',
      'VNQ': 'Real Estate (REITs)',
      'XLF': 'Financials',
      'XLE': 'Energy',
      'XLK': 'Technology',
      'XLV': 'Health Care',
      'XLU': 'Utilities',
      'XLI': 'Industrials',
      'XLY': 'Consumer Discretionary',
      'XLP': 'Consumer Staples',
      'ARKK': 'Growth',
      'VTV': 'Value',
      'VUG': 'Growth'
    };
    
    return mapping[symbol] || symbol;
  }

  private mapCryptoToBucket(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTC': 'Bitcoin (BTC)',
      'ETH': 'Ethereum (ETH)',
      'ADA': 'Large Cap Altcoins',
      'SOL': 'Large Cap Altcoins',
      'MATIC': 'Large Cap Altcoins',
      'AVAX': 'Large Cap Altcoins',
      'DOT': 'Large Cap Altcoins'
    };
    
    return mapping[symbol] || 'Large Cap Altcoins';
  }

  private estimateAUM(symbol: string, price: number, volume: number): number {
    // Estimate AUM based on typical ETF characteristics
    const baseMultipliers: Record<string, number> = {
      'SPY': 400e9,
      'QQQ': 200e9,
      'IWM': 60e9,
      'EFA': 80e9,
      'EEM': 25e9,
      'VTI': 300e9,
      'BND': 90e9,
      'TLT': 50e9,
      'GLD': 60e9
    };
    
    return baseMultipliers[symbol] || (volume * price * 100);
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Pre-configured symbol lists for Polygon
export const POLYGON_SYMBOLS = {
  equities: ['SPY', 'QQQ', 'IWM', 'EFA', 'EEM', 'VTI', 'ARKK', 'VTV', 'VUG'],
  sectors: ['XLF', 'XLE', 'XLK', 'XLV', 'XLU', 'XLI', 'XLY', 'XLP'],
  bonds: ['BND', 'HYG', 'TLT', 'SHY', 'IEF', 'TIP', 'VTEB'],
  commodities: ['GLD', 'SLV', 'USO', 'UNG', 'DBA'],
  crypto: ['BTC', 'ETH', 'ADA', 'SOL', 'MATIC', 'AVAX'],
  reits: ['VNQ', 'SCHH', 'REET']
};
