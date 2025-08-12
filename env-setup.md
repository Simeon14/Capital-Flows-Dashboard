# Environment Setup for OpenAI API Key

## Step 1: Create .env.local file

Create a new file called `.env.local` in the root directory (`D:\py\md\.env.local`) with this content:

```
# OpenAI API Key for AI summaries
REACT_APP_OPENAI_API_KEY=your-actual-openai-key-here

# Data Provider - Choose ONE:
# Alpha Vantage (recommended for free start)
REACT_APP_ALPHA_VANTAGE_KEY=your-alpha-vantage-key-here

# OR Polygon.io (professional grade)
# REACT_APP_POLYGON_KEY=your-polygon-key-here
```

## Step 2: Add your real API keys

Replace the placeholder values with your actual API keys:

```
# OpenAI for AI summaries
REACT_APP_OPENAI_API_KEY=sk-proj-abc123defg456...

# Alpha Vantage for real market data
REACT_APP_ALPHA_VANTAGE_KEY=ABC123DEF456
```

## Step 3: Update the AI Service

The app will automatically read from the environment variable. No code changes needed!

## Security Notes

✅ `.env.local` is already in `.gitignore` - won't be committed to git  
✅ Environment variables are more secure than localStorage  
✅ Prefix `REACT_APP_` makes it available to React  

## Alternative: Command Line

You can also create the file from command line:

```bash
echo REACT_APP_OPENAI_API_KEY=your-key-here > .env.local
```

## Restart Required

After creating `.env.local`, restart the dashboard:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm start
```

The AI summaries will now use your real OpenAI key automatically!
