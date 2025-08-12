import React, { useMemo } from 'react';
import { ProcessedBucketData, FlowDataPoint, ASSET_CLASS_MAPPING } from '../types';
import { FlowAmount } from './common/FlowAmount';
import { UnusualnessBadge } from './common/UnusualnessBadge';
import { X, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DetailDrawerProps {
  bucketData: ProcessedBucketData | null;
  rawData: FlowDataPoint[];
  isOpen: boolean;
  onClose: () => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  bucketData,
  rawData,
  isOpen,
  onClose
}) => {
  const chartData = useMemo(() => {
    if (!bucketData || !rawData) return null;

    // Get last 60 days of data for this bucket
    const bucketFlowData = rawData
      .filter(d => d.bucket === bucketData.bucket)
      .slice(-60)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (bucketFlowData.length === 0) return null;

    return {
      labels: bucketFlowData.map(d => d.date),
      datasets: [
        {
          label: 'Daily Flow (USD)',
          data: bucketFlowData.map(d => d.net_flow_usd),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
          pointRadius: 2,
          pointHoverRadius: 4,
          borderWidth: 2,
        },
      ],
    };
  }, [bucketData, rawData]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `${bucketData?.bucket} - Daily Flow History (60 days)`,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            const absValue = Math.abs(value);
            let formatted: string;
            
            if (absValue >= 1e9) {
              formatted = (absValue / 1e9).toFixed(1) + 'B';
            } else if (absValue >= 1e6) {
              formatted = (absValue / 1e6).toFixed(0) + 'M';
            } else {
              formatted = absValue.toFixed(0);
            }
            
            formatted = (value >= 0 ? '+$' : '-$') + formatted;
            return `Flow: ${formatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'category',
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Flow (USD)',
        },
        ticks: {
          callback: (value) => {
            const numValue = typeof value === 'number' ? value : 0;
            const absValue = Math.abs(numValue);
            
            if (absValue >= 1e9) {
              return (numValue >= 0 ? '+$' : '-$') + (absValue / 1e9).toFixed(1) + 'B';
            } else if (absValue >= 1e6) {
              return (numValue >= 0 ? '+$' : '-$') + (absValue / 1e6).toFixed(0) + 'M';
            } else {
              return (numValue >= 0 ? '+$' : '-$') + absValue.toFixed(0);
            }
          },
        },
      },
    },
  };

  const getPercentileDescription = (zscore: number): string => {
    const absZscore = Math.abs(zscore);
    if (absZscore > 2) {
      return `${zscore > 0 ? 'Above' : 'Below'} 98th percentile - extreme activity`;
    } else if (absZscore > 1.5) {
      return `${zscore > 0 ? 'Above' : 'Below'} 93rd percentile - highly elevated`;
    } else if (absZscore > 1) {
      return `${zscore > 0 ? 'Above' : 'Below'} 84th percentile - elevated`;
    } else if (absZscore > 0.5) {
      return `${zscore > 0 ? 'Above' : 'Below'} 69th percentile - moderately elevated`;
    } else {
      return 'Within normal range for this asset';
    }
  };

  if (!isOpen || !bucketData) return null;

  const assetClass = ASSET_CLASS_MAPPING[bucketData.bucket] || 'Unknown';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {bucketData.bucket}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {assetClass} • Asset Details
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">1-Day Flow</div>
                <FlowAmount amount={bucketData.flow_1d} className="text-lg font-semibold" />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">5-Day Flow</div>
                <FlowAmount amount={bucketData.flow_5d} className="text-lg font-semibold" />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">20-Day Flow</div>
                <FlowAmount amount={bucketData.flow_20d} className="text-lg font-semibold" />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Acceleration (5d)</div>
                <div className="flex items-center space-x-1">
                  {bucketData.acceleration_5d > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <FlowAmount amount={bucketData.acceleration_5d} className="text-lg font-semibold" />
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Share of Total Flows (5d)</div>
                    <div className="text-lg font-semibold">
                      {bucketData.share_of_flows_5d.toFixed(1)}%
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Activity Level</div>
                    <UnusualnessBadge 
                      badge={bucketData.unusualness_badge}
                      zscore={bucketData.unusualness_zscore}
                    />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Z-score</div>
                    <div className="text-sm font-medium">
                      {bucketData.unusualness_zscore.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {bucketData.aum_usd && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Assets Under Management</div>
                  <FlowAmount 
                    amount={bucketData.aum_usd} 
                    showSign={false}
                    className="text-lg font-semibold" 
                  />
                  {bucketData.flow_5d_pct_aum && (
                    <div className="text-xs text-gray-500 mt-1">
                      5d flow: {bucketData.flow_5d_pct_aum.toFixed(2)}% of AUM
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Context Description */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">Activity Context</h4>
              <p className="text-sm text-blue-800">
                {getPercentileDescription(bucketData.unusualness_zscore)}
              </p>
            </div>

            {/* Chart */}
            {chartData && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div style={{ height: '300px' }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
