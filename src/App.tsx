import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DashboardFilters, 
  ProcessedBucketData, 
  ApiConfig, 
  AISummary,
  ASSET_CLASS_MAPPING 
} from './types';
import { DataProcessor } from './services/dataProcessor';
import { FlowDataAPI, initializeAPI, getAPIInstance, clearAPIInstance } from './services/api';
import { AISummaryService } from './services/aiSummary';
import { RealDataManager, DataProvider, createRealDataManager } from './services/realDataManager';

// Components
import { DashboardControls } from './components/DashboardControls';
import { FlowLeaderboard } from './components/leaderboards/FlowLeaderboard';
import { AccelerationLeaderboard } from './components/leaderboards/AccelerationLeaderboard';
import { FlowTape } from './components/FlowTape';
import { AISummaryCard } from './components/AISummaryCard';
import { DetailDrawer } from './components/DetailDrawer';
import { SettingsModal } from './components/SettingsModal';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Initialize services
const dataProcessor = new DataProcessor();
const aiSummaryService = new AISummaryService();

function App() {
  // State management
  const [filters, setFilters] = useState<DashboardFilters>({
    dateWindow: '5d',
    assetClass: 'All',
    normalization: 'USD',
    maxRows: 10,
    showVolRisk: true,
    searchTerm: '',
    noiseFilterThreshold: 0,
  });

  const [apiConfig, setApiConfig] = useState<ApiConfig | null>(() => {
    const saved = localStorage.getItem('flowDashboard_apiConfig');
    return saved ? JSON.parse(saved) : null;
  });

  const [openAIKey, setOpenAIKey] = useState<string>(() => {
    return localStorage.getItem('flowDashboard_openaiKey') || '';
  });

  const [realDataManager, setRealDataManager] = useState<RealDataManager | null>(null);
  const [dataProvider, setDataProvider] = useState<DataProvider>(() => {
    console.log('=== INITIAL DATA PROVIDER SELECTION ===');
    
    // FIRST: Check localStorage (user's explicit choice in settings)
    const savedProvider = localStorage.getItem('flowDashboard_dataProvider') as DataProvider;
    console.log('localStorage provider:', savedProvider);
    if (savedProvider && ['alpha-vantage', 'polygon', 'mock'].includes(savedProvider)) {
      console.log('Using localStorage provider:', savedProvider);
      return savedProvider;
    }
    
    // SECOND: Check environment variable
    const explicitProvider = process.env.REACT_APP_DATA_PROVIDER as DataProvider;
    console.log('Environment provider:', explicitProvider);
    if (explicitProvider && ['alpha-vantage', 'polygon', 'mock'].includes(explicitProvider)) {
      console.log('Using environment provider:', explicitProvider);
      return explicitProvider;
    }
    
    // THIRD: Auto-detect from API keys
    const alphaKey = process.env.REACT_APP_ALPHA_VANTAGE_KEY;
    const polygonKey = process.env.REACT_APP_POLYGON_KEY;
    console.log('Alpha Vantage key exists:', !!alphaKey);
    console.log('Polygon key exists:', !!polygonKey);
    
    if (alphaKey) {
      console.log('Auto-detected: alpha-vantage (from key)');
      return 'alpha-vantage';
    }
    if (polygonKey) {
      console.log('Auto-detected: polygon (from key)');
      return 'polygon';
    }
    
    // FALLBACK: Default to mock
    console.log('Using fallback: mock');
    return 'mock';
  });

  const [processedData, setProcessedData] = useState<ProcessedBucketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  const [aiSummary, setAISummary] = useState<AISummary | null>(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

  const [selectedBucket, setSelectedBucket] = useState<ProcessedBucketData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Initialize OpenAI service when key is available or from environment
  useEffect(() => {
    // Try environment variable first, then localStorage
    const envKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (envKey) {
      aiSummaryService.initialize(envKey);
    } else if (openAIKey) {
      aiSummaryService.initialize(openAIKey);
    }
  }, [openAIKey]);

  // Filter and sort data based on current filters
  const filteredData = useMemo(() => {
    let filtered = [...processedData];

    // Apply asset class filter
    if (filters.assetClass !== 'All') {
      filtered = filtered.filter(item => 
        ASSET_CLASS_MAPPING[item.bucket] === filters.assetClass
      );
    }

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.bucket.toLowerCase().includes(searchLower)
      );
    }

    // Apply vol/risk filter
    if (!filters.showVolRisk) {
      filtered = filtered.filter(item =>
        ASSET_CLASS_MAPPING[item.bucket] !== 'Vol/Risk'
      );
    }

    return filtered;
  }, [processedData, filters]);

  // Separate data into inflows and outflows
  const { inflows, outflows, accelerators, decelerators } = useMemo(() => {
    const getFlowValue = (item: ProcessedBucketData): number => {
      switch (filters.dateWindow) {
        case '1d': return item.flow_1d;
        case '20d': return item.flow_20d;
        default: return item.flow_5d;
      }
    };

    const inflows = filteredData
      .filter(item => getFlowValue(item) > 0)
      .sort((a, b) => getFlowValue(b) - getFlowValue(a));

    const outflows = filteredData
      .filter(item => getFlowValue(item) < 0)
      .sort((a, b) => getFlowValue(a) - getFlowValue(b));

    const accelerators = filteredData
      .filter(item => item.acceleration_5d > 0)
      .sort((a, b) => b.acceleration_5d - a.acceleration_5d);

    const decelerators = filteredData
      .filter(item => item.acceleration_5d < 0)
      .sort((a, b) => a.acceleration_5d - b.acceleration_5d);

    return { inflows, outflows, accelerators, decelerators };
  }, [filteredData, filters.dateWindow]);

  // Flow tape data
  const flowTapeData = useMemo(() => {
    return dataProcessor.getFlowTapeData(filteredData, 20);
  }, [filteredData]);

  // Fetch data from API or Real Data Manager
  const fetchData = useCallback(async () => {
    console.log('Fetching data with provider:', dataProvider);
    setLoading(true);
    setError(null);

    try {
      let data;

      if (dataProvider === 'mock') {
        // Use mock API
        const api = getAPIInstance();
        console.log('Mock API instance:', !!api);
        if (!api) {
          setError('Mock API not configured. Please check settings or switch to real data.');
          return;
        }

        // Calculate date range (get last 90 days for sufficient historical data)
        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 90);

        console.log('Fetching from mock API...');
        data = await api.fetchFlowData(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );
      } else {
        // Use real data manager
        console.log('Real data manager:', !!realDataManager);
        if (!realDataManager) {
          setError('Real data provider not configured. Please check settings.');
          return;
        }

        console.log('Fetching from real data manager...');
        data = await realDataManager.fetchFlowData();
      }

      dataProcessor.setData(data);
      const processed = dataProcessor.processFlowData(
        filters.assetClass,
        filters.noiseFilterThreshold
      );
      
      setProcessedData(processed);
      setLastUpdateTime(dataProcessor.getLastUpdateTime());

      // Only generate AI summary if we don't have one yet
      if (aiSummaryService.isInitialized() && processed.length > 0 && !aiSummary) {
        generateAISummary(processed);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [filters.assetClass, filters.noiseFilterThreshold, dataProvider, realDataManager]);

  // Generate AI summary
  const generateAISummary = useCallback(async (data?: ProcessedBucketData[]) => {
    if (!aiSummaryService.isInitialized()) {
      setAIError('OpenAI API key not configured');
      return;
    }

    const currentData = data || processedData;
    if (currentData.length === 0) {
      setAIError('No data available for summary');
      return;
    }

    setAILoading(true);
    setAIError(null);

    try {
      const summaryStats = dataProcessor.getSummaryStats(currentData);
      const summary = await aiSummaryService.generateSummary(summaryStats);
      setAISummary(summary);
    } catch (err) {
      setAIError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setAILoading(false);
    }
  }, [processedData]);

  // Handle API configuration
  const handleConfigSave = useCallback((config: ApiConfig) => {
    setApiConfig(config);
    localStorage.setItem('flowDashboard_apiConfig', JSON.stringify(config));
    initializeAPI(config);
  }, []);

  const handleConfigTest = useCallback(async (config: ApiConfig): Promise<boolean> => {
    try {
      const testAPI = new FlowDataAPI(config);
      return await testAPI.testConnection();
    } catch {
      return false;
    }
  }, []);

  const handleOpenAIKeySave = useCallback((key: string) => {
    setOpenAIKey(key);
    localStorage.setItem('flowDashboard_openaiKey', key);
    if (key) {
      aiSummaryService.initialize(key);
    }
  }, []);

  // Handle real data provider setup
  const handleRealDataSetup = useCallback(async (provider: DataProvider, apiKey: string): Promise<boolean> => {
    try {
      const manager = createRealDataManager(provider, apiKey);
      const success = await manager.testConnection();
      
      if (success) {
        setRealDataManager(manager);
        setDataProvider(provider);
        localStorage.setItem('flowDashboard_dataProvider', provider);
        localStorage.setItem(`flowDashboard_${provider}Key`, apiKey);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Real data setup failed:', error);
      return false;
    }
  }, []);

  // Handle data provider change
  const handleDataProviderChange = useCallback((provider: DataProvider) => {
    console.log('Changing data provider to:', provider);
    setDataProvider(provider);
    localStorage.setItem('flowDashboard_dataProvider', provider);
    
    // Clear any existing data to force refresh
    setProcessedData([]);
    setError(null);
    setLastUpdateTime(null);
    
    // Reset managers based on provider
    if (provider === 'mock') {
      setRealDataManager(null);
      console.log('Switched to mock data - real data manager cleared');
    } else {
      // For real data providers, clear the API config
      console.log('Switched to real data provider:', provider);
    }
    
    // Force immediate re-initialization
    window.location.reload();
  }, []);

  // Handle bucket selection for detail drawer
  const handleBucketClick = useCallback((bucket: ProcessedBucketData) => {
    setSelectedBucket(bucket);
    setDrawerOpen(true);
  }, []);

  // Initialize API or Real Data Manager on mount
  useEffect(() => {
    console.log('Initializing data source:', dataProvider);
    
    if (dataProvider === 'mock') {
      if (apiConfig) {
        console.log('Using mock API with config:', apiConfig);
        initializeAPI(apiConfig);
      } else {
        console.log('Mock provider selected but no API config found');
        setError('Mock API not configured. Please check settings.');
      }
    } else {
      // Try environment variables first, then localStorage
      const envKey = dataProvider === 'alpha-vantage' 
        ? process.env.REACT_APP_ALPHA_VANTAGE_KEY
        : dataProvider === 'polygon'
        ? process.env.REACT_APP_POLYGON_KEY
        : null;
      
      const savedKey = localStorage.getItem(`flowDashboard_${dataProvider}Key`);
      const apiKey = envKey || savedKey;
      
      console.log('Real data provider:', dataProvider, 'Key found:', !!apiKey);
      
      if (apiKey) {
        const manager = createRealDataManager(dataProvider, apiKey);
        setRealDataManager(manager);
        console.log('Real data manager created');
      } else {
        console.log('No API key found for real data provider');
        setError(`${dataProvider} API key not found. Please check environment variables or settings.`);
      }
    }
  }, [apiConfig, dataProvider]);

  // Fetch data when configuration is ready
  useEffect(() => {
    console.log('Data fetch effect triggered:', { dataProvider, hasApiConfig: !!apiConfig, hasRealDataManager: !!realDataManager });
    
    if (dataProvider === 'mock' && apiConfig) {
      console.log('Triggering mock data fetch');
      fetchData();
    } else if (dataProvider !== 'mock' && realDataManager) {
      console.log('Triggering real data fetch');
      fetchData();
    } else {
      console.log('Not fetching data - missing configuration');
    }
  }, [apiConfig, realDataManager, dataProvider, fetchData]);

  // Reprocess data when filters change (except search which is handled in useMemo)
  useEffect(() => {
    if (dataProcessor.getData().length > 0) {
      const processed = dataProcessor.processFlowData(
        filters.assetClass,
        filters.noiseFilterThreshold
      );
      setProcessedData(processed);
    }
  }, [filters.assetClass, filters.noiseFilterThreshold]);

  // Check if we have AUM data for normalization toggle
  const hasAUMData = useMemo(() => {
    return processedData.some(item => item.aum_usd !== undefined);
  }, [processedData]);

  // Show initial setup if no API config
  if (!apiConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6">
            Capital Flows Dashboard
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Configure your API connection to get started
          </p>
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Configure API
          </button>
        </div>

        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          apiConfig={null}
          onConfigSave={handleConfigSave}
          onConfigTest={handleConfigTest}
          openAIKey={openAIKey}
          onOpenAIKeySave={handleOpenAIKeySave}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Controls */}
      <DashboardControls
        filters={filters}
        onFiltersChange={setFilters}
        onRefresh={fetchData}
        onSettingsClick={() => setSettingsOpen(true)}
        isRefreshing={loading}
        lastUpdateTime={lastUpdateTime}
        hasAUMData={hasAUMData}
      />

      {/* Flow Tape */}
      <FlowTape data={flowTapeData} loading={loading} />

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* AI Summary */}
          <div className="lg:col-span-1">
            <AISummaryCard
              summary={aiSummary}
              loading={aiLoading}
              error={aiError}
              onRetry={() => generateAISummary()}
            />
          </div>

          {/* Main Leaderboards */}
          <div className="lg:col-span-3 space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <FlowLeaderboard
                title="Top Inflows"
                data={inflows}
                maxRows={filters.maxRows}
                filters={filters}
                onRowClick={handleBucketClick}
                loading={loading}
              />
              
              <FlowLeaderboard
                title="Top Outflows"
                data={outflows}
                maxRows={filters.maxRows}
                filters={filters}
                onRowClick={handleBucketClick}
                loading={loading}
              />
            </div>
          </div>
        </div>

        {/* Acceleration Leaderboards */}
        <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
          <AccelerationLeaderboard
            title="Accelerators"
            data={accelerators}
            maxRows={filters.maxRows}
            onRowClick={handleBucketClick}
            loading={loading}
            type="accelerators"
          />
          
          <AccelerationLeaderboard
            title="Decelerators"
            data={decelerators}
            maxRows={filters.maxRows}
            onRowClick={handleBucketClick}
            loading={loading}
            type="decelerators"
          />
        </div>
      </div>

      {/* Detail Drawer */}
      <DetailDrawer
        bucketData={selectedBucket}
        rawData={dataProcessor.getData()}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiConfig={apiConfig}
        onConfigSave={handleConfigSave}
        onConfigTest={handleConfigTest}
        openAIKey={openAIKey}
        onOpenAIKeySave={handleOpenAIKeySave}
        onRealDataSetup={handleRealDataSetup}
        currentDataProvider={dataProvider}
        onDataProviderChange={handleDataProviderChange}
      />
    </div>
  );
}

export default App;
