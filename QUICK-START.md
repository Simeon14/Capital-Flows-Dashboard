# 🚀 Quick Start Guide

Since you have Node.js working in your terminal, here's the fastest way to get everything running:

## Method 1: Use the Batch Files (Easiest)

1. **Start the Mock API**:
   - Double-click `start-mock-api.bat`
   - Wait for "Mock Capital Flows API running on http://localhost:3001"

2. **Start the Dashboard** (in a new terminal):
   - Double-click `start-dashboard.bat` 
   - Wait for "Dashboard starting on http://localhost:3000"

## Method 2: Manual Commands

**Terminal 1 (Mock API):**
```bash
cd D:\py\md\mock-api
npm install
npm start
```

**Terminal 2 (Dashboard):**
```bash
cd D:\py\md
npm install
npm start
```

## Method 3: Your Working Terminal

Since Node.js works in your terminal, just run:
```bash
# First terminal - Mock API
cd mock-api
npm install && npm start

# Second terminal - Dashboard
npm install && npm start
```

## Once Both Are Running...

1. **Dashboard opens**: http://localhost:3000
2. **Click "Configure API"**
3. **Enter**:
   - Base URL: `http://localhost:3001`
   - API Key: `mock-api-key` (any value)
4. **Test Connection** ✅
5. **Save Configuration**

## You'll See:

✅ **Realistic flow data** across 75+ assets  
✅ **Top inflows/outflows** leaderboards  
✅ **Flow tape** with scrolling highlights  
✅ **Accelerators** and momentum analysis  
✅ **Interactive charts** - click any asset  
✅ **AI summaries** (if you add OpenAI key)  

## Troubleshooting

- **Port 3001 busy?** Change PORT in `mock-api/server.js`
- **Dashboard won't start?** Make sure mock API is running first
- **CORS errors?** Both should run on localhost

The mock API generates realistic market data with themes like tech rotation, safe haven flows, and volatility events!
