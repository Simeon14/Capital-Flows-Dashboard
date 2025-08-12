import React from 'react';
import { ProcessedBucketData, METRIC_DEFINITIONS } from '../../types';
import { FlowAmount } from '../common/FlowAmount';
import { UnusualnessBadge } from '../common/UnusualnessBadge';
import { Sparkline } from '../common/Sparkline';
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';

interface AccelerationLeaderboardProps {
  title: string;
  data: ProcessedBucketData[];
  maxRows: number;
  onRowClick: (bucket: ProcessedBucketData) => void;
  loading?: boolean;
  type: 'accelerators' | 'decelerators';
}

export const AccelerationLeaderboard: React.FC<AccelerationLeaderboardProps> = ({
  title,
  data,
  maxRows,
  onRowClick,
  loading = false,
  type
}) => {
  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          {type === 'accelerators' ? (
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
          )}
          {title}
        </h3>
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
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          {type === 'accelerators' ? (
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
          )}
          {title}
        </h3>
        <div className="text-center py-8 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const displayedData = data.slice(0, maxRows);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          {type === 'accelerators' ? (
            <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
          )}
          {title}
        </h3>
        <div 
          className="group relative cursor-help"
          title={METRIC_DEFINITIONS['Acceleration (5d)']}
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
              <th className="text-right">Acceleration (5d)</th>
              <th className="text-right">Current Flow (5d)</th>
              <th className="text-center">Activity</th>
              <th className="text-center">Trend</th>
            </tr>
          </thead>
          <tbody>
            {displayedData.map((item, index) => {
              const isInflow = item.flow_5d > 0;
              const accelerationDirection = item.acceleration_5d > 0 ? 'up' : 'down';
              
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
                    <div className="flex items-center justify-end space-x-1">
                      {accelerationDirection === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <FlowAmount amount={item.acceleration_5d} />
                    </div>
                  </td>
                  
                  <td className="text-right">
                    <FlowAmount amount={item.flow_5d} />
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
