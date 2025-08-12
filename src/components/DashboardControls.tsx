import React from 'react';
import { DashboardFilters } from '../types';
import { Search, Settings, RefreshCw } from 'lucide-react';

interface DashboardControlsProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  onRefresh: () => void;
  onSettingsClick: () => void;
  isRefreshing?: boolean;
  lastUpdateTime?: string | null;
  hasAUMData?: boolean;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
  filters,
  onFiltersChange,
  onRefresh,
  onSettingsClick,
  isRefreshing = false,
  lastUpdateTime,
  hasAUMData = false
}) => {
  const handleFilterChange = (key: keyof DashboardFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const formatLastUpdate = (timestamp: string | null | undefined): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-black border-b border-gray-600 p-4 shadow-lg" 
         style={{ 
           background: 'linear-gradient(180deg, #111111 0%, #000000 100%)',
           boxShadow: '0 2px 8px rgba(64,64,64,0.2)'
         }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left side - Primary controls */}
          <div className="flex items-center space-x-4">
            {/* Date Window Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-subtle-amber font-mono tracking-wide">WINDOW:</label>
              <div className="flex rounded border border-gray-600">
                {(['1d', '5d', '20d'] as const).map((window) => (
                  <button
                    key={window}
                    onClick={() => handleFilterChange('dateWindow', window)}
                    className={`px-4 py-2 text-sm font-bold font-mono tracking-wider transition-all first:rounded-l last:rounded-r ${
                      filters.dateWindow === window
                        ? 'bg-subtle-amber text-black shadow-lg'
                        : 'bg-gray-900 text-subtle-amber hover:bg-gray-800 border-r border-gray-600 last:border-r-0'
                    }`}
                    style={filters.dateWindow === window ? { 
                      textShadow: '0 0 2px #000000',
                      boxShadow: '0 0 5px rgba(204,136,0,0.3)'
                    } : {}}
                  >
                    {window}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Class Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-subtle-amber font-mono tracking-wide">ASSET:</label>
              <select
                value={filters.assetClass}
                onChange={(e) => handleFilterChange('assetClass', e.target.value)}
                className="border border-gray-600 rounded bg-gray-900 text-subtle-amber px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-subtle-amber focus:border-subtle-amber"
                style={{ textShadow: '0 0 1px #cc8800' }}
              >
                <option value="All">All</option>
                <option value="Equities">Equities</option>
                <option value="Fixed Income">Fixed Income</option>
                <option value="FX">FX</option>
                <option value="Commodities">Commodities</option>
                <option value="Alternatives">Alternatives</option>
                <option value="Cash">Cash</option>
                <option value="Vol/Risk">Vol/Risk</option>
              </select>
            </div>

            {/* Normalization Toggle */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-subtle-amber font-mono tracking-wide">VIEW:</label>
              <div className="flex rounded border border-gray-600">
                <button
                  onClick={() => handleFilterChange('normalization', 'USD')}
                  className={`px-3 py-2 text-sm font-bold font-mono tracking-wider transition-all first:rounded-l last:rounded-r ${
                    filters.normalization === 'USD'
                      ? 'bg-subtle-amber text-black shadow-lg'
                      : 'bg-gray-900 text-subtle-amber hover:bg-gray-800 border-r border-gray-600'
                  }`}
                  style={filters.normalization === 'USD' ? { 
                    textShadow: '0 0 2px #000000',
                    boxShadow: '0 0 5px rgba(204,136,0,0.3)'
                  } : {}}
                >
                  USD
                </button>
                <button
                  onClick={() => handleFilterChange('normalization', 'AUM')}
                  disabled={!hasAUMData}
                  className={`px-3 py-2 text-sm font-bold font-mono tracking-wider transition-all first:rounded-l last:rounded-r ${
                    filters.normalization === 'AUM'
                      ? 'bg-subtle-amber text-black shadow-lg'
                      : hasAUMData 
                        ? 'bg-gray-900 text-subtle-amber hover:bg-gray-800' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                  style={filters.normalization === 'AUM' ? { 
                    textShadow: '0 0 2px #000000',
                    boxShadow: '0 0 5px rgba(204,136,0,0.3)'
                  } : {}}
                  title={!hasAUMData ? 'AUM data not available' : 'Show as % of AUM'}
                >
                  % AUM
                </button>
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Right side - Secondary controls */}
          <div className="flex items-center space-x-4">
            {/* Max Rows */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Rows:</label>
              <select
                value={filters.maxRows}
                onChange={(e) => handleFilterChange('maxRows', parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>

            {/* Noise Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.noiseFilterThreshold}
                onChange={(e) => handleFilterChange('noiseFilterThreshold', parseFloat(e.target.value))}
                className="w-16"
                title={`Noise threshold: ${filters.noiseFilterThreshold}`}
              />
            </div>

            {/* Last Update */}
            <div className="text-xs text-gray-500">
              Updated: {formatLastUpdate(lastUpdateTime)}
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onSettingsClick}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </button>
          </div>
        </div>

        {/* Toggle for Vol/Risk visibility */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.showVolRisk}
                onChange={(e) => handleFilterChange('showVolRisk', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show volatility/risk proxies</span>
            </label>
          </div>

          {/* Active Filters Indicator */}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {filters.assetClass !== 'All' && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {filters.assetClass}
              </span>
            )}
            {filters.searchTerm && (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                Search: "{filters.searchTerm}"
              </span>
            )}
            {filters.noiseFilterThreshold > 0 && (
              <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                Filtered
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
