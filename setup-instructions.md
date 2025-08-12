# Complete Setup Instructions

## Step 1: Install Node.js (if not already installed)

1. Download Node.js from https://nodejs.org/
2. Install the LTS version (includes npm)
3. Verify installation: `node --version` and `npm --version`

## Step 2: Set up the Mock API

```bash
# Navigate to mock API directory
cd mock-api

# Install dependencies  
npm install

# Start the mock API server
npm start
```

The API will run on `http://localhost:3001`

## Step 3: Set up the Dashboard

```bash  
# In a new terminal, navigate back to main directory
cd ..

# Install dashboard dependencies
npm install

# Start the dashboard
npm start
```

The dashboard will open at `http://localhost:3000`

## Step 4: Configure the Dashboard

1. Click "Configure API" on the welcome screen
2. Enter:
   - **Base URL**: `http://localhost:3001`
   - **API Key**: `mock-api-key` (any value works)
3. Click "Test Connection" - should show success
4. Optionally add OpenAI API key for AI summaries
5. Click "Save Configuration"

## Step 5: Explore the Dashboard

You'll immediately see:
- ✅ Realistic flow data across 75+ asset buckets
- ✅ Top inflows/outflows leaderboards  
- ✅ Accelerators and decelerators
- ✅ Flow tape with live highlights
- ✅ Interactive charts and drill-downs
- ✅ AI summaries (if OpenAI key provided)

## Troubleshooting

**"npm not found"**: Install Node.js first
**"Connection failed"**: Ensure mock API is running on port 3001
**"CORS error"**: Both servers should be running locally

## Next Steps

Once you're happy with the dashboard:

1. **Real Data Integration**: Replace mock API with Alpha Vantage or other provider
2. **Deployment**: Build for production with `npm run build`
3. **Customization**: Modify asset buckets or add new metrics
4. **AI Enhancement**: Add custom prompts or additional analysis
