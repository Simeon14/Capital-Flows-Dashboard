import React, { useState } from 'react';
import { DataProvider } from '../services/realDataManager';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface RealDataSettingsProps {
  onProviderSelect: (provider: DataProvider, apiKey: string) => Promise<boolean>;
}

export const RealDataSettings: React.FC<RealDataSettingsProps> = ({
  onProviderSelect
}) => {
  const [selectedProvider, setSelectedProvider] = useState<DataProvider>('alpha-vantage');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');

  const providerInfo: Record<Exclude<DataProvider, 'mock'>, {
    name: string;
    description: string;
    cost: string;
    coverage: string;
    signup: string;
    pros: string[];
    cons: string[];
  }> = {
    'alpha-vantage': {
      name: 'Alpha Vantage',
      description: 'Free tier available, good for ETF and forex data',
      cost: 'Free (500 calls/day) + $25/month',
      coverage: 'Global stocks, ETFs, forex, crypto, commodities',
      signup: 'https://www.alphavantage.co/support/#api-key',
      pros: ['Free tier available', 'Easy to get started', 'Good documentation'],
      cons: ['Rate limited', 'Estimated flows only', 'No direct fund flow data']
    },
    'polygon': {
      name: 'Polygon.io',
      description: 'Professional-grade market data with institutional features',
      cost: '$99/month for real-time',
      coverage: 'US equities, options, crypto with high quality',
      signup: 'https://polygon.io/pricing',
      pros: ['High-quality data', 'Real-time available', 'Good for institutions'],
      cons: ['More expensive', 'Primarily US markets', 'Still estimated flows']
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult('error');
      setTestMessage('Please enter an API key');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setTestMessage('');

    try {
      const success = await onProviderSelect(selectedProvider, apiKey.trim());
      
      if (success) {
        setTestResult('success');
        setTestMessage('Connection successful! Data fetching will begin.');
      } else {
        setTestResult('error');
        setTestMessage('Connection test failed. Please check your API key.');
      }
    } catch (error) {
      setTestResult('error');
      setTestMessage(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const currentInfo = selectedProvider === 'mock' 
    ? providerInfo['alpha-vantage'] 
    : providerInfo[selectedProvider as Exclude<DataProvider, 'mock'>];

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Choose Data Provider
        </h4>
        
        <div className="space-y-3">
          {Object.entries(providerInfo).map(([key, info]) => (
            <div key={key} className="relative">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  value={key}
                  checked={selectedProvider === key as DataProvider}
                  onChange={(e) => setSelectedProvider(e.target.value as DataProvider)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{info.name}</div>
                  <div className="text-sm text-gray-600">{info.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Cost:</span> {info.cost}
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Details */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h5 className="font-medium text-blue-900 mb-2">{currentInfo.name} Details</h5>
            
            <div className="text-sm text-blue-800 space-y-2">
              <div>
                <span className="font-medium">Coverage:</span> {currentInfo.coverage}
              </div>
              
              <div>
                <span className="font-medium">Get API Key:</span>{' '}
                <a 
                  href={currentInfo.signup} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  {currentInfo.signup}
                </a>
              </div>

              <div>
                <span className="font-medium">Pros:</span> {currentInfo.pros.join(', ')}
              </div>
              
              <div>
                <span className="font-medium">Limitations:</span> {currentInfo.cons.join(', ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {currentInfo.name} API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`Enter your ${currentInfo.name} API key`}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Test Connection */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleTest}
          disabled={!apiKey.trim() || testing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {testing ? 'Testing Connection...' : 'Test & Enable Real Data'}
        </button>
        
        {testResult && (
          <div className="flex items-center space-x-1">
            {testResult === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-xs ${
              testResult === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {testMessage}
            </span>
          </div>
        )}
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 rounded-lg p-4">
        <h5 className="font-medium text-yellow-900 mb-2">Important Notes</h5>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Real APIs estimate flows from price/volume data - not actual fund flows</li>
          <li>• Rate limits apply - data fetching may take several minutes</li>
          <li>• For true fund flow data, consider professional providers like EPFR or Refinitiv</li>
          <li>• Data is cached for 6 hours to respect API limits</li>
        </ul>
      </div>
    </div>
  );
};
