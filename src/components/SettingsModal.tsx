import React, { useState, useEffect } from 'react';
import { ApiConfig } from '../types';
import { DataProvider } from '../services/realDataManager';
import { RealDataSettings } from './RealDataSettings';
import { X, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiConfig: ApiConfig | null;
  onConfigSave: (config: ApiConfig) => void;
  onConfigTest: (config: ApiConfig) => Promise<boolean>;
  openAIKey?: string;
  onOpenAIKeySave: (key: string) => void;
  onRealDataSetup?: (provider: DataProvider, apiKey: string) => Promise<boolean>;
  currentDataProvider?: DataProvider;
  onDataProviderChange?: (provider: DataProvider) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiConfig,
  onConfigSave,
  onConfigTest,
  openAIKey = '',
  onOpenAIKeySave,
  onRealDataSetup,
  currentDataProvider = 'mock',
  onDataProviderChange
}) => {
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [aiKey, setAIKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAIKey, setShowAIKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'mock-api' | 'real-data'>('mock-api');

  useEffect(() => {
    if (isOpen) {
      setBaseUrl(apiConfig?.baseUrl || '');
      setApiKey(apiConfig?.apiKey || '');
      setAIKey(openAIKey || '');
      setTestResult(null);
      setTestMessage('');
    }
  }, [isOpen, apiConfig, openAIKey]);

  const handleTestConnection = async () => {
    if (!baseUrl.trim() || !apiKey.trim()) {
      setTestResult('error');
      setTestMessage('Please enter both base URL and API key');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setTestMessage('');

    try {
      const config: ApiConfig = {
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim()
      };

      const success = await onConfigTest(config);
      
      if (success) {
        setTestResult('success');
        setTestMessage('Connection successful!');
      } else {
        setTestResult('error');
        setTestMessage('Connection failed. Please check your configuration.');
      }
    } catch (error) {
      setTestResult('error');
      setTestMessage(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const config: ApiConfig = {
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim()
    };

    onConfigSave(config);
    onOpenAIKeySave(aiKey.trim());
    onClose();
  };

  const isFormValid = baseUrl.trim() && apiKey.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Settings
            </h3>
            <button
              onClick={onClose}
              className="rounded-md p-2 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('mock-api')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'mock-api'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mock API
              </button>
              <button
                onClick={() => setActiveTab('real-data')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'real-data'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Real Data
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Data Provider Selector */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-3">
                Current Data Source
              </h4>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="provider-mock"
                    name="dataProvider"
                    value="mock"
                    checked={currentDataProvider === 'mock'}
                    onChange={(e) => onDataProviderChange?.(e.target.value as DataProvider)}
                  />
                  <label htmlFor="provider-mock" className="text-sm font-medium text-blue-800">
                    Mock Data (Recommended)
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="provider-alpha-vantage"
                    name="dataProvider"
                    value="alpha-vantage"
                    checked={currentDataProvider === 'alpha-vantage'}
                    onChange={(e) => onDataProviderChange?.(e.target.value as DataProvider)}
                  />
                  <label htmlFor="provider-alpha-vantage" className="text-sm font-medium text-blue-800">
                    Alpha Vantage (Real Data)
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="provider-polygon"
                    name="dataProvider"
                    value="polygon"
                    checked={currentDataProvider === 'polygon'}
                    onChange={(e) => onDataProviderChange?.(e.target.value as DataProvider)}
                  />
                  <label htmlFor="provider-polygon" className="text-sm font-medium text-blue-800">
                    Polygon.io (Pro)
                  </label>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-blue-700">
                Current: <strong>{currentDataProvider}</strong>
                {currentDataProvider === 'mock' && ' - Full dashboard with simulated market data'}
                {currentDataProvider === 'alpha-vantage' && ' - Real market data (25 requests/day limit)'}
                {currentDataProvider === 'polygon' && ' - Professional real-time data'}
              </div>
            </div>

            {activeTab === 'mock-api' && (
              <>
                {/* API Configuration */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">
                    Mock Flow Data API Configuration
                  </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base URL
                  </label>
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Test Connection */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleTestConnection}
                    disabled={!isFormValid || testing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {testing ? 'Testing...' : 'Test Connection'}
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
              </div>
            </div>

            {/* OpenAI Configuration */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                OpenAI Configuration (Optional)
              </h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showAIKey ? "text" : "password"}
                    value={aiKey}
                    onChange={(e) => setAIKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAIKey(!showAIKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showAIKey ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Required for AI-generated rotation summaries
                </p>
              </div>
            </div>

                {/* Data Format Info */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Expected Data Format
                  </h4>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div><strong>Endpoint:</strong> GET /flows</div>
                    <div><strong>Required fields:</strong> date (ISO), bucket (string), net_flow_usd (number)</div>
                    <div><strong>Optional fields:</strong> aum_usd, price_ccy, ccy</div>
                    <div><strong>Health check:</strong> GET /health (should return 200)</div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'real-data' && onRealDataSetup && (
              <RealDataSettings onProviderSelect={onRealDataSetup} />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isFormValid}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
