const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Asset buckets from your taxonomy
const ASSET_BUCKETS = [
  // Equities
  'US Equities', 'DM ex-US Equities', 'EM Equities', 'North America', 'Europe', 
  'Japan', 'Asia ex-Japan', 'Latin America', 'Growth', 'Value', 'Small Cap',
  'High Dividend', 'Low Volatility', 'Technology', 'Financials', 'Energy',
  'Industrials', 'Consumer Discretionary', 'Consumer Staples', 'Health Care',
  'Utilities', 'Real Estate (REITs)',
  
  // Fixed Income
  'US Treasuries (Short)', 'US Treasuries (Intermediate)', 'US Treasuries (Long)',
  'DM Sovereign ex-US', 'EM Sovereign (Local)', 'EM Sovereign (Hard)',
  'US Investment Grade Credit', 'US High Yield Credit', 'DM High Yield Credit',
  'EM Corporate Debt', 'US TIPS', 'Global Inflation-Linked', 'Convertible Bonds',
  'Municipal Bonds',
  
  // FX
  'USD Index (DXY)', 'JPY', 'CHF', 'EUR', 'GBP', 'AUD', 'CAD', 'CNH/CNY',
  'KRW', 'MXN', 'BRL', 'ZAR', 'TRY', 'IDR', 'INR',
  
  // Commodities
  'Gold', 'Silver', 'Platinum', 'Palladium', 'Crude Oil (WTI)', 'Crude Oil (Brent)',
  'Natural Gas', 'Gasoline', 'Heating Oil', 'Copper', 'Aluminum', 'Nickel',
  'Zinc', 'Corn', 'Wheat', 'Soybeans', 'Coffee', 'Cotton', 'Sugar', 'Cocoa',
  'Bloomberg Commodity Index', 'GSCI',
  
  // Alternatives
  'Bitcoin (BTC)', 'Ethereum (ETH)', 'Large Cap Altcoins', 'Stablecoin Market Cap',
  'Private Equity Index', 'Private Credit Index', 'Hedge Funds Index',
  
  // Cash
  'USD Cash / MMF', 'EUR Cash', 'JPY Cash', 'Global Cash Proxy',
  
  // Vol/Risk
  'VIX', 'V2X', 'MOVE', 'CVIX', 'Commodity Vol Index'
];

// Generate realistic AUM values
const generateAUM = (bucket) => {
  const baseValues = {
    'US Equities': 25000e9,
    'Technology': 8000e9,
    'Gold': 4000e9,
    'Bitcoin (BTC)': 1000e9,
    'VIX': 500e9
  };
  
  const base = baseValues[bucket] || (Math.random() * 5000e9 + 100e9);
  return Math.round(base);
};

// Generate realistic flow data
const generateFlowData = (startDate, endDate) => {
  const data = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Create some market themes for realistic correlations
  const themes = {
    techRotation: Math.random() - 0.5,
    goldInflows: Math.random() - 0.5,
    emergingMarkets: Math.random() - 0.5,
    dollarStrength: Math.random() - 0.5,
    riskOff: Math.random() - 0.5
  };
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    
    const dateStr = d.toISOString().split('T')[0];
    
    // Add some market-wide volatility events
    const volatilityEvent = Math.random() < 0.05 ? (Math.random() - 0.5) * 3 : 0;
    
    ASSET_BUCKETS.forEach(bucket => {
      let baseFlow = (Math.random() - 0.5) * 2e9; // Base ±2B range
      
      // Apply thematic correlations
      if (bucket.includes('Technology') || bucket.includes('Growth')) {
        baseFlow += themes.techRotation * 1e9;
      }
      if (bucket === 'Gold' || bucket === 'Silver') {
        baseFlow += themes.goldInflows * 800e6;
      }
      if (bucket.includes('EM') || bucket.includes('Asia')) {
        baseFlow += themes.emergingMarkets * 600e6;
      }
      if (bucket.includes('USD') || bucket === 'USD Index (DXY)') {
        baseFlow += themes.dollarStrength * 400e6;
      }
      if (bucket.includes('VIX') || bucket.includes('Vol')) {
        baseFlow += themes.riskOff * 200e6;
      }
      
      // Add volatility events
      baseFlow += volatilityEvent * Math.random() * 500e6;
      
      // Add some persistence (yesterday's flow influences today)
      const persistence = 0.3;
      if (Math.random() < persistence) {
        baseFlow *= 1.2; // Slight momentum
      }
      
      // Round to millions
      const netFlow = Math.round(baseFlow / 1e6) * 1e6;
      
      data.push({
        date: dateStr,
        bucket: bucket,
        net_flow_usd: netFlow,
        aum_usd: generateAUM(bucket),
        price_ccy: 'USD'
      });
    });
  }
  
  return data;
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main flows endpoint
app.get('/flows', (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Default to last 90 days if no dates provided
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    console.log(`Generating flow data from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    const data = generateFlowData(startDate, endDate);
    
    res.json(data);
  } catch (error) {
    console.error('Error generating flow data:', error);
    res.status(500).json({ error: 'Failed to generate flow data' });
  }
});

// API info endpoint
app.get('/info', (req, res) => {
  res.json({
    name: 'Mock Capital Flows API',
    version: '1.0.0',
    endpoints: {
      '/health': 'Health check',
      '/flows': 'Flow data (supports start_date and end_date query params)',
      '/info': 'API information'
    },
    buckets: ASSET_BUCKETS.length,
    sample_request: '/flows?start_date=2024-01-01&end_date=2024-01-31'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock Capital Flows API running on http://localhost:${PORT}`);
  console.log(`📊 Serving data for ${ASSET_BUCKETS.length} asset buckets`);
  console.log(`🔗 Test endpoint: http://localhost:${PORT}/health`);
  console.log(`📈 Flow data: http://localhost:${PORT}/flows`);
});
