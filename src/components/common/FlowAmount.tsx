import React from 'react';

interface FlowAmountProps {
  amount: number;
  showSign?: boolean;
  showCurrency?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const FlowAmount: React.FC<FlowAmountProps> = ({ 
  amount, 
  showSign = true, 
  showCurrency = true,
  className = '',
  style
}) => {
  const formatAmount = (value: number): string => {
    const absValue = Math.abs(value);
    let formatted: string;
    
    if (absValue >= 1e9) {
      formatted = (absValue / 1e9).toFixed(1) + 'B';
    } else if (absValue >= 1e6) {
      formatted = (absValue / 1e6).toFixed(0) + 'M';
    } else if (absValue >= 1e3) {
      formatted = (absValue / 1e3).toFixed(0) + 'K';
    } else {
      formatted = absValue.toFixed(0);
    }
    
    if (showSign) {
      formatted = (value >= 0 ? '+' : '-') + formatted;
    }
    
    if (showCurrency) {
      formatted = '$' + formatted;
    }
    
    return formatted;
  };

  const getColorClass = (value: number): string => {
    if (value > 0) return 'flow-positive';
    if (value < 0) return 'flow-negative';
    return 'flow-neutral';
  };

  return (
    <span 
      className={`text-currency ${getColorClass(amount)} ${className}`}
      style={style}
    >
      {formatAmount(amount)}
    </span>
  );
};
