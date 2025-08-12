import React from 'react';
import { ProcessedBucketData, DashboardFilters, METRIC_DEFINITIONS } from '../../types';
import { FlowAmount } from '../common/FlowAmount';
import { UnusualnessBadge } from '../common/UnusualnessBadge';
import { Sparkline } from '../common/Sparkline';
import { HelpCircle } from 'lucide-react';

interface FlowLeaderboardProps {
  title: string;
  data: ProcessedBucketData[];
  maxRows: number;
  filters: DashboardFilters;
  onRowClick: (bucket: ProcessedBucketData) => void;
  loading?: boolean;
}

export const FlowLeaderboard: React.FC<FlowLeaderboardProps> = ({
  title,
  data,
  maxRows,
  filters,
  onRowClick,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="space-y-3">
          {Array.from({ length: maxRows }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="skeleton h-4 w-32"></div>
              <div className="skeleton h-4 w-16"></div>
              <div className="skeleton h-4 w-12"></div>
              <div className="skeleton h-4 w-16"></div>
              <div className="skeleton h-8 w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const displayedData = data.slice(0, maxRows);

  const getFlowValue = (item: ProcessedBucketData): number => {
    switch (filters.dateWindow) {
      case '1d': return item.flow_1d;
      case '20d': return item.flow_20d;
      default: return item.flow_5d;
    }
  };

  const getFlowValuePctAUM = (item: ProcessedBucketData): number | undefined => {
    switch (filters.dateWindow) {
      case '1d': return item.flow_1d_pct_aum;
      default: return item.flow_5d_pct_aum;
    }
  };

  const shouldShowAUMToggle = data.some(item => item.aum_usd !== undefined);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div 
          className="group relative cursor-help"
          title={METRIC_DEFINITIONS[`Flow (${filters.dateWindow})`]}
        >
          <HelpCircle className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-8">#</th>
              <th>Asset / Bucket</th>
              <th className="text-right">
                Flow ({filters.dateWindow})
                {filters.normalization === 'AUM' && shouldShowAUMToggle && ' % AUM'}
              </th>
              <th className="text-right">Flow (1d)</th>
              <th className="text-right">Share %</th>
              <th className="text-center">Activity</th>
              <th className="text-center">Trend</th>
            </tr>
          </thead>
          <tbody>
            {displayedData.map((item, index) => {
              const primaryFlow = filters.normalization === 'AUM' && shouldShowAUMToggle 
                ? getFlowValuePctAUM(item) 
                : getFlowValue(item);
              
              return (
                <tr 
                  key={item.bucket}
                  onClick={() => onRowClick(item)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="text-gray-500 font-medium">
                    {index + 1}
                  </td>
                  
                  <td className="font-medium text-gray-900 max-w-48">
                    <div className="truncate" title={item.bucket}>
                      {item.bucket}
                    </div>
                  </td>
                  
                  <td className="text-right">
                    {filters.normalization === 'AUM' && shouldShowAUMToggle && primaryFlow !== undefined ? (
                      <span className={`text-currency ${primaryFlow > 0 ? 'flow-positive' : primaryFlow < 0 ? 'flow-negative' : 'flow-neutral'}`}>
                        {primaryFlow >= 0 ? '+' : ''}{primaryFlow.toFixed(2)}%
                      </span>
                    ) : (
                      <FlowAmount amount={getFlowValue(item)} />
                    )}
                  </td>
                  
                  <td className="text-right text-gray-600">
                    <FlowAmount amount={item.flow_1d} />
                  </td>
                  
                  <td className="text-right text-gray-600">
                    <span className="text-currency">
                      {item.share_of_flows_5d.toFixed(1)}%
                    </span>
                  </td>
                  
                  <td className="text-center">
                    <UnusualnessBadge 
                      badge={item.unusualness_badge}
                      zscore={item.unusualness_zscore}
                    />
                  </td>
                  
                  <td className="text-center">
                    <Sparkline 
                      data={item.trend_data}
                      width={64}
                      height={24}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {data.length > maxRows && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Showing top {maxRows} of {data.length} assets
        </div>
      )}
    </div>
  );
};
