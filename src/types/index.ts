// Core data types for the Capital Flows Dashboard

export interface FlowDataPoint {
  date: string; // ISO date
  bucket: string;
  net_flow_usd: number;
  aum_usd?: number;
  price_ccy?: string;
  ccy?: string;
}

export interface ProcessedBucketData {
  bucket: string;
  flow_1d: number;
  flow_5d: number;
  flow_20d: number;
  acceleration_5d: number;
  share_of_flows_5d: number;
  unusualness_zscore: number;
  unusualness_badge: 'Normal' | 'Elevated' | 'Extreme';
  trend_data: number[]; // Last 20 days for sparkline
  aum_usd?: number;
  flow_1d_pct_aum?: number;
  flow_5d_pct_aum?: number;
}

export interface DashboardFilters {
  dateWindow: '1d' | '5d' | '20d';
  assetClass: 'All' | 'Equities' | 'Fixed Income' | 'FX' | 'Commodities' | 'Alternatives' | 'Cash' | 'Vol/Risk';
  normalization: 'USD' | 'AUM';
  maxRows: number;
  showVolRisk: boolean;
  searchTerm: string;
  noiseFilterThreshold: number;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
}

export interface AISummary {
  narrative: string;
  highlights: string[];
  timestamp: string;
}

// Asset class categorization
export const ASSET_CLASS_MAPPING: Record<string, string> = {
  // Equities
  'US Equities': 'Equities',
  'DM ex-US Equities': 'Equities',
  'EM Equities': 'Equities',
  'North America': 'Equities',
  'Europe': 'Equities',
  'Japan': 'Equities',
  'Asia ex-Japan': 'Equities',
  'Latin America': 'Equities',
  'Growth': 'Equities',
  'Value': 'Equities',
  'Small Cap': 'Equities',
  'High Dividend': 'Equities',
  'Low Volatility': 'Equities',
  'Technology': 'Equities',
  'Financials': 'Equities',
  'Energy': 'Equities',
  'Industrials': 'Equities',
  'Consumer Discretionary': 'Equities',
  'Consumer Staples': 'Equities',
  'Health Care': 'Equities',
  'Utilities': 'Equities',
  'Real Estate (REITs)': 'Equities',

  // Fixed Income
  'US Treasuries (Short)': 'Fixed Income',
  'US Treasuries (Intermediate)': 'Fixed Income',
  'US Treasuries (Long)': 'Fixed Income',
  'DM Sovereign ex-US': 'Fixed Income',
  'EM Sovereign (Local)': 'Fixed Income',
  'EM Sovereign (Hard)': 'Fixed Income',
  'US Investment Grade Credit': 'Fixed Income',
  'US High Yield Credit': 'Fixed Income',
  'DM High Yield Credit': 'Fixed Income',
  'EM Corporate Debt': 'Fixed Income',
  'US TIPS': 'Fixed Income',
  'Global Inflation-Linked': 'Fixed Income',
  'Convertible Bonds': 'Fixed Income',
  'Municipal Bonds': 'Fixed Income',

  // FX
  'USD Index (DXY)': 'FX',
  'JPY': 'FX',
  'CHF': 'FX',
  'EUR': 'FX',
  'GBP': 'FX',
  'AUD': 'FX',
  'CAD': 'FX',
  'CNH/CNY': 'FX',
  'KRW': 'FX',
  'MXN': 'FX',
  'BRL': 'FX',
  'ZAR': 'FX',
  'TRY': 'FX',
  'IDR': 'FX',
  'INR': 'FX',

  // Commodities
  'Gold': 'Commodities',
  'Silver': 'Commodities',
  'Platinum': 'Commodities',
  'Palladium': 'Commodities',
  'Crude Oil (WTI)': 'Commodities',
  'Crude Oil (Brent)': 'Commodities',
  'Natural Gas': 'Commodities',
  'Gasoline': 'Commodities',
  'Heating Oil': 'Commodities',
  'Copper': 'Commodities',
  'Aluminum': 'Commodities',
  'Nickel': 'Commodities',
  'Zinc': 'Commodities',
  'Corn': 'Commodities',
  'Wheat': 'Commodities',
  'Soybeans': 'Commodities',
  'Coffee': 'Commodities',
  'Cotton': 'Commodities',
  'Sugar': 'Commodities',
  'Cocoa': 'Commodities',
  'Bloomberg Commodity Index': 'Commodities',
  'GSCI': 'Commodities',

  // Alternatives
  'Bitcoin (BTC)': 'Alternatives',
  'Ethereum (ETH)': 'Alternatives',
  'Large Cap Altcoins': 'Alternatives',
  'Stablecoin Market Cap': 'Alternatives',
  'Private Equity Index': 'Alternatives',
  'Private Credit Index': 'Alternatives',
  'Hedge Funds Index': 'Alternatives',

  // Cash
  'USD Cash / MMF': 'Cash',
  'EUR Cash': 'Cash',
  'JPY Cash': 'Cash',
  'Global Cash Proxy': 'Cash',

  // Vol/Risk
  'VIX': 'Vol/Risk',
  'V2X': 'Vol/Risk',
  'MOVE': 'Vol/Risk',
  'CVIX': 'Vol/Risk',
  'Commodity Vol Index': 'Vol/Risk',
};

export const METRIC_DEFINITIONS: Record<string, string> = {
  'Flow (1d)': 'Net flow for the latest trading day',
  'Flow (5d)': 'Rolling sum of net flows for last 5 trading days',
  'Flow (20d)': 'Rolling sum of net flows for last 20 trading days',
  'Acceleration (5d)': 'Change in 5d flow vs 5d ago (positive = speeding up)',
  'Share of Flows (5d)': "Bucket's 5d flow as % of total absolute flows",
  'Unusualness': 'Standardized 5d flow vs ~1 year history for this bucket'
};
