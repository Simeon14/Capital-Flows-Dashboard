import React from 'react';

interface UnusualnessBadgeProps {
  badge: 'Normal' | 'Elevated' | 'Extreme';
  zscore?: number;
  showTooltip?: boolean;
}

export const UnusualnessBadge: React.FC<UnusualnessBadgeProps> = ({ 
  badge, 
  zscore, 
  showTooltip = true 
}) => {
  const badgeClasses = {
    'Normal': 'badge-normal',
    'Elevated': 'badge-elevated', 
    'Extreme': 'badge-extreme'
  };

  const title = showTooltip && zscore !== undefined 
    ? `Z-score: ${zscore.toFixed(2)} (${badge})` 
    : badge;

  return (
    <span 
      className={badgeClasses[badge]}
      title={title}
    >
      {badge}
    </span>
  );
};
