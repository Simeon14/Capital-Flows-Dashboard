import React, { useEffect, useState } from 'react';
import { FlowAmount } from './common/FlowAmount';

interface FlowTapeItem {
  bucket: string;
  flow_1d: number;
  percentChange: number;
  badge: string;
}

interface FlowTapeProps {
  data: FlowTapeItem[];
  loading?: boolean;
}

export const FlowTape: React.FC<FlowTapeProps> = ({ data, loading = false }) => {
  const [displayData, setDisplayData] = useState<FlowTapeItem[]>([]);

  useEffect(() => {
    if (data && data.length > 0) {
      // Duplicate data to create seamless loop effect
      const repeatedData = [...data, ...data, ...data];
      setDisplayData(repeatedData);
    }
  }, [data]);

  if (loading) {
    return (
      <div className="bg-gray-800 text-white py-3 overflow-hidden">
        <div className="flex items-center space-x-8 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2 whitespace-nowrap">
              <div className="bg-gray-600 rounded h-4 w-24"></div>
              <div className="bg-gray-600 rounded h-4 w-16"></div>
              <div className="bg-gray-600 rounded h-4 w-8"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 text-white py-3 overflow-hidden">
        <div className="text-center text-gray-400">
          No flow data available
        </div>
      </div>
    );
  }

  const formatPercentChange = (change: number): string => {
    if (Math.abs(change) < 0.1) return '~0%';
    return `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`;
  };

  const getBadgeColor = (badge: string): string => {
    switch (badge) {
      case 'Extreme': return 'text-red-300';
      case 'Elevated': return 'text-yellow-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="bg-black border-y border-gray-700 py-4 overflow-hidden relative">
      {/* Subtle scan lines effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-800 to-transparent opacity-10 pointer-events-none"
           style={{
             backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(64,64,64,0.1) 2px, rgba(64,64,64,0.1) 4px)',
           }}></div>
      
      <div className="animate-marquee flex items-center space-x-12 relative z-10">
        {/* First set of data */}
        {displayData.map((item, index) => (
          <div 
            key={`${item.bucket}-${index}`}
            className="flex items-center space-x-4 whitespace-nowrap text-sm font-mono"
          >
            <span className="font-bold text-terminal-amber tracking-wider uppercase"
                  style={{ textShadow: '0 0 10px #ffb000' }}>
              {item.bucket}
            </span>
            
            <span className="text-gray-500 text-sm">•</span>
            
            <FlowAmount 
              amount={item.flow_1d}
              className="text-white font-bold tracking-wider"
              style={{ textShadow: '0 0 8px currentColor' }}
            />
            
            <span className="text-gray-500 text-sm">•</span>
            
            <span className={`text-xs font-bold tracking-wide ${
              item.percentChange > 0 ? 'text-terminal-green' : 
              item.percentChange < 0 ? 'text-red-400' : 'text-gray-400'
            }`}
                  style={{ textShadow: '0 0 5px currentColor' }}>
              {formatPercentChange(item.percentChange)} vs 5d avg
            </span>
            
            {item.badge !== 'Normal' && (
              <>
                <span className="text-gray-500 text-sm">•</span>
                <span className={`text-xs px-3 py-1 rounded border-2 font-bold tracking-wide ${getBadgeColor(item.badge)} 
                  ${item.badge === 'Extreme' ? 'border-red-500 bg-red-900' : 
                    item.badge === 'Elevated' ? 'border-yellow-500 bg-yellow-900' : 'border-gray-500 bg-gray-800'}`}
                      style={{ textShadow: '0 0 5px currentColor' }}>
                  {item.badge.toUpperCase()}
                </span>
              </>
            )}
          </div>
        ))}
        
        {/* Duplicate set for seamless loop */}
        {displayData.map((item, index) => (
          <div 
            key={`${item.bucket}-${index}-duplicate`}
            className="flex items-center space-x-4 whitespace-nowrap text-sm font-mono"
          >
            <span className="font-bold text-terminal-amber tracking-wider uppercase"
                  style={{ textShadow: '0 0 10px #ffb000' }}>
              {item.bucket}
            </span>
            
            <span className="text-gray-500 text-sm">•</span>
            
            <FlowAmount 
              amount={item.flow_1d}
              className="text-white font-bold tracking-wider"
              style={{ textShadow: '0 0 8px currentColor' }}
            />
            
            <span className="text-gray-500 text-sm">•</span>
            
            <span className={`text-xs font-bold tracking-wide ${
              item.percentChange > 0 ? 'text-terminal-green' : 
              item.percentChange < 0 ? 'text-red-400' : 'text-gray-400'
            }`}
                  style={{ textShadow: '0 0 5px currentColor' }}>
              {formatPercentChange(item.percentChange)} vs 5d avg
            </span>
            
            {item.badge !== 'Normal' && (
              <>
                <span className="text-gray-500 text-sm">•</span>
                <span className={`text-xs px-3 py-1 rounded border-2 font-bold tracking-wide ${getBadgeColor(item.badge)} 
                  ${item.badge === 'Extreme' ? 'border-red-500 bg-red-900' : 
                    item.badge === 'Elevated' ? 'border-yellow-500 bg-yellow-900' : 'border-gray-500 bg-gray-800'}`}
                      style={{ textShadow: '0 0 5px currentColor' }}>
                  {item.badge.toUpperCase()}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
