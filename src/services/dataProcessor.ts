import { FlowDataPoint, ProcessedBucketData, ASSET_CLASS_MAPPING } from '../types';
import { format, subDays, parseISO } from 'date-fns';

export class DataProcessor {
  private data: FlowDataPoint[] = [];
  private lastUpdateTime: string | null = null;

  setData(data: FlowDataPoint[]): void {
    // Sort by date for proper processing
    this.data = data.sort((a, b) => a.date.localeCompare(b.date));
    this.lastUpdateTime = new Date().toISOString();
  }

  getData(): FlowDataPoint[] {
    return this.data;
  }

  getLastUpdateTime(): string | null {
    return this.lastUpdateTime;
  }

  /**
   * Process raw flow data into metrics for dashboard display
   */
  processFlowData(assetClassFilter: string = 'All', noiseThreshold: number = 0): ProcessedBucketData[] {
    if (this.data.length === 0) return [];

    // Get unique buckets
    const buckets = Array.from(new Set(this.data.map(d => d.bucket)));
    
    // Filter by asset class if specified
    const filteredBuckets = assetClassFilter === 'All' 
      ? buckets 
      : buckets.filter(bucket => ASSET_CLASS_MAPPING[bucket] === assetClassFilter);

    const processed: ProcessedBucketData[] = [];

    for (const bucket of filteredBuckets) {
      const bucketData = this.data.filter(d => d.bucket === bucket);
      
      if (bucketData.length === 0) continue;

      // Apply noise filter - skip buckets with very low average AUM or activity
      if (noiseThreshold > 0) {
        const avgAUM = bucketData
          .filter(d => d.aum_usd)
          .reduce((sum, d) => sum + (d.aum_usd || 0), 0) / 
          Math.max(1, bucketData.filter(d => d.aum_usd).length);
        
        const avgAbsFlow = bucketData
          .reduce((sum, d) => sum + Math.abs(d.net_flow_usd), 0) / bucketData.length;

        if (avgAUM < noiseThreshold * 1e9 || avgAbsFlow < noiseThreshold * 1e6) {
          continue;
        }
      }

      const metrics = this.calculateMetrics(bucketData);
      if (metrics) {
        processed.push(metrics);
      }
    }

    // Calculate share of flows for all processed buckets
    this.calculateShareOfFlows(processed);

    return processed;
  }

  private calculateMetrics(bucketData: FlowDataPoint[]): ProcessedBucketData | null {
    if (bucketData.length === 0) return null;

    const bucket = bucketData[0].bucket;
    const sortedData = bucketData.sort((a, b) => a.date.localeCompare(b.date));
    
    // Get latest data point for AUM
    const latestPoint = sortedData[sortedData.length - 1];
    const aum_usd = latestPoint.aum_usd;

    // Calculate 1d, 5d, 20d flows
    const flow_1d = this.getFlowForPeriod(sortedData, 1);
    const flow_5d = this.getFlowForPeriod(sortedData, 5);
    const flow_20d = this.getFlowForPeriod(sortedData, 20);

    // Calculate acceleration (change in 5d flow vs 5d ago)
    const acceleration_5d = this.calculateAcceleration(sortedData);

    // Calculate unusualness (z-score)
    const { zscore, badge } = this.calculateUnusualness(sortedData);

    // Get trend data for sparkline (last 20 days)
    const trend_data = this.getTrendData(sortedData, 20);

    // Calculate percentage of AUM if available
    const flow_1d_pct_aum = aum_usd ? (flow_1d / aum_usd) * 100 : undefined;
    const flow_5d_pct_aum = aum_usd ? (flow_5d / aum_usd) * 100 : undefined;

    return {
      bucket,
      flow_1d,
      flow_5d,
      flow_20d,
      acceleration_5d,
      share_of_flows_5d: 0, // Will be calculated later
      unusualness_zscore: zscore,
      unusualness_badge: badge,
      trend_data,
      aum_usd,
      flow_1d_pct_aum,
      flow_5d_pct_aum,
    };
  }

  private getFlowForPeriod(data: FlowDataPoint[], days: number): number {
    if (data.length === 0) return 0;
    
    // Get the last 'days' data points
    const recentData = data.slice(-days);
    return recentData.reduce((sum, d) => sum + d.net_flow_usd, 0);
  }

  private calculateAcceleration(data: FlowDataPoint[]): number {
    if (data.length < 10) return 0; // Need at least 10 days for meaningful acceleration

    // Current 5d flow
    const current5d = this.getFlowForPeriod(data, 5);
    
    // 5d flow from 5 days ago
    const dataUpTo5DaysAgo = data.slice(0, -5);
    const previous5d = this.getFlowForPeriod(dataUpTo5DaysAgo, 5);

    return current5d - previous5d;
  }

  private calculateUnusualness(data: FlowDataPoint[]): { zscore: number; badge: 'Normal' | 'Elevated' | 'Extreme' } {
    if (data.length < 20) return { zscore: 0, badge: 'Normal' };

    const current5d = this.getFlowForPeriod(data, 5);
    
    // Calculate 5d flows for historical periods (rolling windows)
    const historical5dFlows: number[] = [];
    for (let i = 5; i <= data.length; i++) {
      const windowData = data.slice(i - 5, i);
      const flow5d = windowData.reduce((sum, d) => sum + d.net_flow_usd, 0);
      historical5dFlows.push(flow5d);
    }

    if (historical5dFlows.length < 10) return { zscore: 0, badge: 'Normal' };

    // Calculate mean and standard deviation
    const mean = historical5dFlows.reduce((sum, f) => sum + f, 0) / historical5dFlows.length;
    const variance = historical5dFlows.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / historical5dFlows.length;
    const stdDev = Math.sqrt(variance);

    const zscore = stdDev > 0 ? (current5d - mean) / stdDev : 0;
    
    let badge: 'Normal' | 'Elevated' | 'Extreme';
    const absZscore = Math.abs(zscore);
    if (absZscore > 2) {
      badge = 'Extreme';
    } else if (absZscore > 1) {
      badge = 'Elevated';
    } else {
      badge = 'Normal';
    }

    return { zscore, badge };
  }

  private getTrendData(data: FlowDataPoint[], days: number): number[] {
    if (data.length === 0) return [];
    
    const recentData = data.slice(-days);
    return recentData.map(d => d.net_flow_usd);
  }

  private calculateShareOfFlows(processed: ProcessedBucketData[]): void {
    // Calculate total absolute 5d flows
    const totalAbsFlow = processed.reduce((sum, p) => sum + Math.abs(p.flow_5d), 0);
    
    if (totalAbsFlow === 0) return;

    // Update share of flows for each bucket
    processed.forEach(p => {
      p.share_of_flows_5d = (Math.abs(p.flow_5d) / totalAbsFlow) * 100;
    });
  }

  /**
   * Get top flows for the flow tape
   */
  getFlowTapeData(processed: ProcessedBucketData[], maxItems: number = 20): Array<{
    bucket: string;
    flow_1d: number;
    percentChange: number;
    badge: string;
  }> {
    return processed
      .filter(p => Math.abs(p.flow_1d) > 0)
      .sort((a, b) => Math.abs(b.flow_1d) - Math.abs(a.flow_1d))
      .slice(0, maxItems)
      .map(p => ({
        bucket: p.bucket,
        flow_1d: p.flow_1d,
        percentChange: p.flow_5d !== 0 ? ((p.flow_1d - (p.flow_5d - p.flow_1d) / 4) / Math.abs((p.flow_5d - p.flow_1d) / 4)) * 100 : 0,
        badge: p.unusualness_badge,
      }));
  }

  /**
   * Generate summary statistics for AI narrative
   */
  getSummaryStats(processed: ProcessedBucketData[]): {
    topInflows: ProcessedBucketData[];
    topOutflows: ProcessedBucketData[];
    topAccelerators: ProcessedBucketData[];
    elevatedBuckets: ProcessedBucketData[];
    totalInflows: number;
    totalOutflows: number;
  } {
    const inflows = processed.filter(p => p.flow_5d > 0).sort((a, b) => b.flow_5d - a.flow_5d);
    const outflows = processed.filter(p => p.flow_5d < 0).sort((a, b) => a.flow_5d - b.flow_5d);
    const accelerators = processed.filter(p => p.acceleration_5d > 0).sort((a, b) => b.acceleration_5d - a.acceleration_5d);
    const elevated = processed.filter(p => p.unusualness_badge === 'Elevated' || p.unusualness_badge === 'Extreme');

    return {
      topInflows: inflows.slice(0, 3),
      topOutflows: outflows.slice(0, 3),
      topAccelerators: accelerators.slice(0, 3),
      elevatedBuckets: elevated,
      totalInflows: inflows.reduce((sum, p) => sum + p.flow_5d, 0),
      totalOutflows: Math.abs(outflows.reduce((sum, p) => sum + p.flow_5d, 0)),
    };
  }
}
