import OpenAI from 'openai';
import { ProcessedBucketData, AISummary } from '../types';

export class AISummaryService {
  private openai: OpenAI | null = null;
  private apiKey: string | null = null;

  initialize(apiKey?: string): void {
    // Use provided key or environment variable
    const key = apiKey || process.env.REACT_APP_OPENAI_API_KEY;
    
    if (!key) {
      console.warn('No OpenAI API key provided');
      return;
    }
    
    this.apiKey = key;
    this.openai = new OpenAI({
      apiKey: key,
      dangerouslyAllowBrowser: true, // For client-side usage
    });
  }

  isInitialized(): boolean {
    return this.openai !== null && this.apiKey !== null;
  }

  async generateSummary(summaryStats: {
    topInflows: ProcessedBucketData[];
    topOutflows: ProcessedBucketData[];
    topAccelerators: ProcessedBucketData[];
    elevatedBuckets: ProcessedBucketData[];
    totalInflows: number;
    totalOutflows: number;
  }): Promise<AISummary> {
    if (!this.openai) {
      throw new Error('AI service not initialized');
    }

    try {
      const prompt = this.buildPrompt(summaryStats);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a financial markets analyst generating concise daily summaries of capital flow rotations. 

TONE: Analytical, neutral, crisp. No trade recommendations or forward-looking claims.

OUTPUT FORMAT: Return a JSON object with:
- "narrative": 2-5 sentence paragraph summarizing the key rotation themes
- "highlights": Array of exactly 3 bullet points (each 10-15 words max)

CONTENT GUIDELINES:
- Focus on top 2-3 inflow themes and top 1-2 outflow themes
- Highlight any accelerators crossing elevated thresholds  
- Include one plausible cross-asset linkage if evident
- Use specific dollar amounts and percentiles when provided
- Avoid jargon; write for informed but busy readers`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('Empty response from AI service');
      }

      try {
        const parsed = JSON.parse(response);
        
        if (!parsed.narrative || !Array.isArray(parsed.highlights)) {
          throw new Error('Invalid response format from AI service');
        }

        return {
          narrative: parsed.narrative,
          highlights: parsed.highlights.slice(0, 3), // Ensure max 3 highlights
          timestamp: new Date().toISOString(),
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          narrative: response.split('\n')[0] || response.substring(0, 200),
          highlights: [
            "AI summary generation encountered formatting issues",
            "Please check API configuration",
            "Raw response received but not properly formatted"
          ],
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('AI Summary generation failed:', error);
      
      // Return a fallback summary based on the data
      return this.generateFallbackSummary(summaryStats);
    }
  }

  private buildPrompt(summaryStats: {
    topInflows: ProcessedBucketData[];
    topOutflows: ProcessedBucketData[];
    topAccelerators: ProcessedBucketData[];
    elevatedBuckets: ProcessedBucketData[];
    totalInflows: number;
    totalOutflows: number;
  }): string {
    const formatCurrency = (amount: number): string => {
      const absAmount = Math.abs(amount);
      if (absAmount >= 1e9) {
        return `$${(absAmount / 1e9).toFixed(1)}B`;
      } else if (absAmount >= 1e6) {
        return `$${(absAmount / 1e6).toFixed(0)}M`;
      } else {
        return `$${absAmount.toFixed(0)}`;
      }
    };

    let prompt = "Generate a capital flows rotation summary based on the following 5-day data:\n\n";

    // Top inflows
    if (summaryStats.topInflows.length > 0) {
      prompt += "TOP INFLOWS (5-day):\n";
      summaryStats.topInflows.forEach((item, i) => {
        prompt += `${i + 1}. ${item.bucket}: ${formatCurrency(item.flow_5d)} (${item.unusualness_badge}, ${item.unusualness_zscore.toFixed(1)} z-score)\n`;
      });
      prompt += "\n";
    }

    // Top outflows
    if (summaryStats.topOutflows.length > 0) {
      prompt += "TOP OUTFLOWS (5-day):\n";
      summaryStats.topOutflows.forEach((item, i) => {
        prompt += `${i + 1}. ${item.bucket}: ${formatCurrency(item.flow_5d)} (${item.unusualness_badge}, ${item.unusualness_zscore.toFixed(1)} z-score)\n`;
      });
      prompt += "\n";
    }

    // Accelerators
    if (summaryStats.topAccelerators.length > 0) {
      prompt += "TOP ACCELERATORS (5-day acceleration):\n";
      summaryStats.topAccelerators.forEach((item, i) => {
        prompt += `${i + 1}. ${item.bucket}: +${formatCurrency(item.acceleration_5d)} acceleration (${item.unusualness_badge})\n`;
      });
      prompt += "\n";
    }

    // Elevated/Extreme buckets
    if (summaryStats.elevatedBuckets.length > 0) {
      prompt += "ELEVATED/EXTREME ACTIVITY:\n";
      summaryStats.elevatedBuckets.forEach(item => {
        prompt += `- ${item.bucket}: ${item.unusualness_badge} (${item.unusualness_zscore.toFixed(1)} z-score)\n`;
      });
      prompt += "\n";
    }

    // Summary stats
    prompt += `AGGREGATE FLOWS:\n`;
    prompt += `Total Inflows: ${formatCurrency(summaryStats.totalInflows)}\n`;
    prompt += `Total Outflows: ${formatCurrency(summaryStats.totalOutflows)}\n`;

    return prompt;
  }

  private generateFallbackSummary(summaryStats: {
    topInflows: ProcessedBucketData[];
    topOutflows: ProcessedBucketData[];
    topAccelerators: ProcessedBucketData[];
    elevatedBuckets: ProcessedBucketData[];
    totalInflows: number;
    totalOutflows: number;
  }): AISummary {
    const formatCurrency = (amount: number): string => {
      const absAmount = Math.abs(amount);
      if (absAmount >= 1e9) {
        return `$${(absAmount / 1e9).toFixed(1)}B`;
      } else if (absAmount >= 1e6) {
        return `$${(absAmount / 1e6).toFixed(0)}M`;
      } else {
        return `$${absAmount.toFixed(0)}`;
      }
    };

    const topInflow = summaryStats.topInflows[0];
    const topOutflow = summaryStats.topOutflows[0];
    const topAccel = summaryStats.topAccelerators[0];

    let narrative = "Capital flows showed ";
    
    if (topInflow && topOutflow) {
      narrative += `rotation into ${topInflow.bucket} (${formatCurrency(topInflow.flow_5d)}) and out of ${topOutflow.bucket} (${formatCurrency(topOutflow.flow_5d)}). `;
    } else if (topInflow) {
      narrative += `strong inflows into ${topInflow.bucket} (${formatCurrency(topInflow.flow_5d)}). `;
    } else if (topOutflow) {
      narrative += `notable outflows from ${topOutflow.bucket} (${formatCurrency(topOutflow.flow_5d)}). `;
    } else {
      narrative += "minimal activity across major asset classes. ";
    }

    if (topAccel) {
      narrative += `${topAccel.bucket} showed accelerating momentum with ${formatCurrency(topAccel.acceleration_5d)} in additional flows.`;
    }

    const highlights = [
      topInflow ? `${topInflow.bucket} led inflows at ${formatCurrency(topInflow.flow_5d)}` : "Limited inflow activity",
      topOutflow ? `${topOutflow.bucket} saw outflows of ${formatCurrency(topOutflow.flow_5d)}` : "Minimal outflow pressure",
      summaryStats.elevatedBuckets.length > 0 
        ? `${summaryStats.elevatedBuckets.length} buckets showing elevated activity` 
        : "Normal flow patterns across assets"
    ];

    return {
      narrative: narrative.trim(),
      highlights,
      timestamp: new Date().toISOString(),
    };
  }
}
