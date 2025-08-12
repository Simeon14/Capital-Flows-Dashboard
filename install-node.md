# Node.js Installation Guide

## Step 1: Download Node.js

1. **Go to**: https://nodejs.org/
2. **Download**: The **LTS version** (Long Term Support) - this is the green button
3. **Choose**: The Windows Installer (.msi) for your system:
   - Most Windows systems: "Windows Installer (x64)"
   - Older systems: "Windows Installer (x86)"

## Step 2: Install Node.js

1. **Run** the downloaded .msi file
2. **Follow** the installation wizard:
   - Accept the license agreement
   - Keep the default installation location
   - **Important**: Make sure "Add to PATH" is checked ✅
   - Install all components (Node.js runtime, npm package manager, etc.)
3. **Restart** your command prompt/PowerShell after installation

## Step 3: Verify Installation

Open a new command prompt and run:
```bash
node --version
npm --version
```

You should see version numbers like:
```
v18.19.0
9.2.0
```

## Step 4: Return to Dashboard Setup

Once Node.js is installed, come back to this directory and run:
```bash
npm install
```

Then follow the rest of the setup instructions!

## Alternative: Use Node Version Manager (Advanced)

If you want more control over Node.js versions:
1. Install **nvm-windows** from: https://github.com/coreybutler/nvm-windows
2. Use `nvm install lts` and `nvm use lts`

## Quick Download Links

- **Main Site**: https://nodejs.org/
- **Direct Download (Windows x64)**: https://nodejs.org/dist/v18.19.1/node-v18.19.1-x64.msi
- **All Downloads**: https://nodejs.org/en/download/
