# Mock Capital Flows API

A realistic mock API server that generates capital flow data for testing the Capital Flows Dashboard.

## Features

- ✅ **Realistic Data**: Generates correlated flows across all 75+ asset buckets
- ✅ **Market Themes**: Simulates rotation themes (tech rotation, gold inflows, etc.)
- ✅ **Volatility Events**: Random market stress events
- ✅ **Historical Data**: Up to 90 days of daily flow data
- ✅ **AUM Data**: Realistic assets under management figures
- ✅ **CORS Enabled**: Ready for frontend consumption

## Quick Start

```bash
# Install dependencies
cd mock-api
npm install

# Start the server
npm start
```

Server runs on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Flow Data
```
GET /flows?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```
Returns flow data for the specified date range.

**Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

If no dates provided, returns last 90 days.

### API Info
```
GET /info
```
Returns API information and available endpoints.

## Sample Response

```json
[
  {
    "date": "2024-01-15",
    "bucket": "US Equities",
    "net_flow_usd": 1500000000,
    "aum_usd": 25000000000000,
    "price_ccy": "USD"
  }
]
```

## Dashboard Configuration

When setting up the dashboard:

1. **Base URL**: `http://localhost:3001`
2. **API Key**: `mock-api-key` (any value works)
3. Test connection to verify setup

## Data Characteristics

- **75+ Asset Buckets**: Complete taxonomy coverage
- **Flow Range**: ±2B USD typical, with themed correlations
- **Persistence**: 30% momentum carry-over between days  
- **Volatility Events**: 5% chance of market-wide events
- **AUM Values**: Realistic based on asset class size

## Market Themes Simulated

- **Tech Rotation**: Growth vs Value dynamics
- **Safe Haven Flows**: Gold and USD strength
- **Emerging Markets**: Regional flow patterns
- **Risk On/Off**: Volatility and defensive assets
- **Sector Rotation**: Energy, Financials, Tech themes

Perfect for testing dashboard functionality before connecting to real data sources!
