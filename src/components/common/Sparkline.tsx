import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  width = 64, 
  height = 32, 
  className = '' 
}) => {
  if (!data || data.length === 0) {
    return <div className={`sparkline ${className}`} style={{ width, height }}></div>;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  if (range === 0) {
    // All values are the same - draw a flat line
    const y = height / 2;
    const pathData = `M 0 ${y} L ${width} ${y}`;
    
    return (
      <svg 
        width={width} 
        height={height} 
        className={`sparkline ${className}`}
        viewBox={`0 0 ${width} ${height}`}
      >
        <path
          d={pathData}
          stroke={data[0] >= 0 ? '#10b981' : '#ef4444'}
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    );
  }

  // Normalize data points to fit within the height
  const normalizedData = data.map(value => {
    return height - ((value - min) / range) * height;
  });

  // Create SVG path
  const pathData = normalizedData.reduce((path, y, index) => {
    const x = (index / (data.length - 1)) * width;
    return index === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
  }, '');

  // Determine color based on overall trend
  const firstValue = data[0];
  const lastValue = data[data.length - 1];
  const trendColor = lastValue >= firstValue ? '#10b981' : '#ef4444';

  return (
    <svg 
      width={width} 
      height={height} 
      className={`sparkline ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={pathData}
        stroke={trendColor}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
