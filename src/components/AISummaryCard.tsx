import React from 'react';
import { AISummary } from '../types';
import { Brain, AlertCircle, Clock } from 'lucide-react';

interface AISummaryCardProps {
  summary: AISummary | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({
  summary,
  loading = false,
  error = null,
  onRetry
}) => {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">AI Rotation Summary</h3>
        </div>
        
        <div className="space-y-3">
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-5/6"></div>
          <div className="skeleton h-4 w-4/5"></div>
          
          <div className="mt-4 space-y-2">
            <div className="skeleton h-3 w-3/4"></div>
            <div className="skeleton h-3 w-2/3"></div>
            <div className="skeleton h-3 w-4/5"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold">AI Rotation Summary</h3>
        </div>
        
        <div className="text-red-600 text-sm mb-4">
          {error}
        </div>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="card p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-600">AI Rotation Summary</h3>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">No summary available</div>
          <div className="text-xs mt-1">Load data to generate AI insights</div>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">AI Rotation Summary</h3>
        </div>
        
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{formatTimestamp(summary.timestamp)}</span>
        </div>
      </div>

      {/* Main narrative */}
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed">
          {summary.narrative}
        </p>
      </div>

      {/* Key highlights */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Key Highlights:</h4>
        <ul className="space-y-1">
          {summary.highlights.map((highlight, index) => (
            <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer note */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          AI-generated summary based on current flow data. Not investment advice.
        </p>
      </div>
    </div>
  );
};
