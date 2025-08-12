# Global Cross-Asset Capital Flows Dashboard

A comprehensive, single-screen dashboard that shows **where capital is flowing right now** across global assets with AI-powered insights.

## Features

### 📊 Real-time Flow Analytics
- **Top Inflows/Outflows**: Ranked leaderboards showing where money is moving
- **Accelerators/Decelerators**: Momentum analysis of flow changes
- **Flow Tape**: Ticker-style feed of latest highlights
- **Time Windows**: 1-day, 5-day, and 20-day flow analysis

### 🤖 AI-Powered Insights
- **Daily Summaries**: GPT-4 generated rotation narratives
- **Key Highlights**: Bullet points of important flow themes
- **Cross-asset Linkages**: AI identifies relationships between asset movements

### 🎯 Advanced Metrics
- **Unusualness Scoring**: Z-score based activity levels (Normal/Elevated/Extreme)
- **Share of Flows**: Percentage of total market flows
- **Acceleration**: Change in flow momentum
- **Trend Analysis**: 20-day sparklines for visual patterns

### 🔧 Comprehensive Controls
- **Asset Class Filtering**: Equities, Fixed Income, FX, Commodities, Alternatives, Cash, Vol/Risk
- **Normalization Options**: USD amounts or % of AUM
- **Search & Filter**: Find specific assets or reduce noise
- **Customizable Display**: Adjustable row counts and volatility proxy visibility

### 📈 Detailed Analysis
- **Interactive Drill-down**: Click any asset for detailed 60-day charts
- **Statistical Context**: Percentile rankings and historical comparisons
- **Flow Composition**: Daily vs multi-day flow breakdowns

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js + React Chart.js 2
- **AI Integration**: OpenAI GPT-4 API
- **Data Processing**: Custom metrics calculation engine
- **State Management**: React hooks + local storage

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Flow data API endpoint
- OpenAI API key (optional, for AI summaries)

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd capital-flows-dashboard
npm install
```

2. **Start the development server**:
```bash
npm start
```

3. **Configure your data source**:
   - Click "Configure API" on the initial screen
   - Enter your flow data API base URL and API key
   - Test the connection
   - Optionally add OpenAI API key for AI summaries

### API Requirements

Your flow data API should provide:

**Endpoint**: `GET /flows`

**Required Parameters**:
- `start_date` (ISO format)
- `end_date` (ISO format)

**Response Format**:
```json
[
  {
    "date": "2024-01-15",
    "bucket": "US Equities", 
    "net_flow_usd": 1500000000,
    "aum_usd": 2500000000000,
    "price_ccy": "USD"
  }
]
```

**Required Fields**:
- `date`: ISO date string
- `bucket`: Asset/bucket name (must match taxonomy)
- `net_flow_usd`: Flow amount in USD (positive = inflow, negative = outflow)

**Optional Fields**:
- `aum_usd`: Assets under management for % normalization
- `price_ccy`: Price currency
- `ccy`: Base currency

**Health Check**: `GET /health` (should return 200)

## Asset Taxonomy

The dashboard supports these asset buckets:

### Equities
US Equities • DM ex-US Equities • EM Equities • North America • Europe • Japan • Asia ex-Japan • Latin America • Growth • Value • Small Cap • High Dividend • Low Volatility • Technology • Financials • Energy • Industrials • Consumer Discretionary • Consumer Staples • Health Care • Utilities • Real Estate (REITs)

### Fixed Income  
US Treasuries (Short/Intermediate/Long) • DM Sovereign ex-US • EM Sovereign (Local/Hard) • US Investment Grade Credit • US High Yield Credit • DM High Yield Credit • EM Corporate Debt • US TIPS • Global Inflation-Linked • Convertible Bonds • Municipal Bonds

### Currencies/FX
USD Index (DXY) • JPY • CHF • EUR • GBP • AUD • CAD • CNH/CNY • KRW • MXN • BRL • ZAR • TRY • IDR • INR

### Commodities
Gold • Silver • Platinum • Palladium • Crude Oil (WTI/Brent) • Natural Gas • Gasoline • Heating Oil • Copper • Aluminum • Nickel • Zinc • Corn • Wheat • Soybeans • Coffee • Cotton • Sugar • Cocoa • Bloomberg Commodity Index • GSCI

### Alternatives
Bitcoin (BTC) • Ethereum (ETH) • Large Cap Altcoins • Stablecoin Market Cap • Private Equity Index • Private Credit Index • Hedge Funds Index

### Cash/Money Markets
USD Cash/MMF • EUR Cash • JPY Cash • Global Cash Proxy

### Volatility/Risk Proxies  
VIX • V2X • MOVE • CVIX • Commodity Vol Index

## Usage Guide

### Navigation
1. **Main View**: Side-by-side inflow/outflow leaderboards with AI summary
2. **Controls**: Top bar with time window, asset class, and normalization toggles  
3. **Flow Tape**: Scrolling ticker showing latest highlights
4. **Accelerators**: Separate section showing momentum changes
5. **Detail Drawer**: Click any asset for comprehensive analysis

### Key Metrics
- **Flow (Xd)**: Net flow sum over X trading days
- **Acceleration**: Change in 5d flow vs previous 5d period
- **Share %**: Asset's portion of total absolute flows
- **Unusualness**: Statistical significance vs historical (Normal/Elevated/Extreme)

### Filtering Options
- **Asset Class**: Focus on specific categories
- **Search**: Find particular assets quickly
- **Noise Filter**: Hide low-activity assets
- **Vol/Risk Toggle**: Include/exclude volatility proxies

## Configuration

### Local Storage
The app stores configuration in browser local storage:
- `flowDashboard_apiConfig`: API connection settings
- `flowDashboard_openaiKey`: OpenAI API key

### Environment Variables
None required - all configuration via UI.

## Performance

- **Target Load Time**: <2 seconds for ~200 buckets × 260 days
- **Data Processing**: Client-side metrics calculation
- **Caching**: Browser localStorage for configuration
- **Updates**: Manual refresh (no auto-polling)

## Error Handling

- **API Errors**: Graceful fallback with last known data
- **Missing Data**: Zero-fill for gaps
- **Invalid Data**: Validation with clear error messages
- **Network Issues**: Offline-friendly with cached state
- **AI Failures**: Fallback summary generation

## Development

### Available Scripts

- `npm start`: Development server
- `npm build`: Production build  
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App

### Project Structure
```
src/
├── components/          # UI components
│   ├── common/         # Reusable components
│   ├── leaderboards/   # Data tables
│   └── ...
├── services/           # API and data processing
├── types/              # TypeScript definitions
└── App.tsx            # Main application
```

### Key Services
- `DataProcessor`: Metrics calculation engine
- `FlowDataAPI`: API client with error handling
- `AISummaryService`: OpenAI integration

## Troubleshooting

### Common Issues

**"API not configured"**
- Ensure API base URL and key are set in Settings
- Test connection using the "Test Connection" button

**"No data available"**  
- Check API endpoint returns data for date range
- Verify data format matches expected schema

**"AI summary failed"**
- Confirm OpenAI API key is valid and has credits
- Check browser console for detailed error messages

**Charts not loading**
- Ensure sufficient historical data (minimum 20 days)
- Check browser console for Chart.js errors

### Debug Mode
Set `NODE_ENV=development` for additional error details and debugging information.

## License

This project is licensed under the MIT License.

## Support

For issues, feature requests, or questions:
1. Check this README for common solutions
2. Review browser console for error details  
3. Verify API configuration and test connection
4. Contact your development team with specific error messages
