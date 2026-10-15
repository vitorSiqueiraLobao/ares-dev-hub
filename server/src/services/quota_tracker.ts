export interface ModelQuotaSpec {
  modelName: string;
  maxContextWindow: number;
  dailyTokenQuota?: number;
  estimatedPromptCostPer1k?: number;
  estimatedCompletionCostPer1k?: number;
}

export interface ModelUsageRecord {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  currentContextTokens: number;
  requestCount: number;
  lastUpdated: Date;
}

export const KNOWN_MODELS: Record<string, ModelQuotaSpec> = {
  'claude-3-7-sonnet': {
    modelName: 'Claude 3.7 Sonnet',
    maxContextWindow: 200_000,
    dailyTokenQuota: 1_000_000,
  },
  'claude-3-5-sonnet': {
    modelName: 'Claude 3.5 Sonnet',
    maxContextWindow: 200_000,
    dailyTokenQuota: 1_000_000,
  },
  'gemini-3-8-flash': {
    modelName: 'Gemini 3.8 Flash',
    maxContextWindow: 1_048_576,
    dailyTokenQuota: 5_000_000,
  },
  'gemini-2-5-pro': {
    modelName: 'Gemini 2.5 Pro',
    maxContextWindow: 2_097_152,
    dailyTokenQuota: 2_000_000,
  },
};

export class QuotaTracker {
  private usage: Map<string, ModelUsageRecord> = new Map();

  constructor() {
    // Initialize default tracked models
    for (const [key] of Object.entries(KNOWN_MODELS)) {
      this.usage.set(key, {
        model: key,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        currentContextTokens: 0,
        requestCount: 0,
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Records a token usage event for a specific model.
   */
  public recordUsage(
    modelKey: string,
    promptTokens: number,
    completionTokens: number,
    currentContextTokens?: number
  ): ModelUsageRecord {
    const record = this.usage.get(modelKey) || {
      model: modelKey,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      currentContextTokens: 0,
      requestCount: 0,
      lastUpdated: new Date(),
    };

    record.promptTokens += promptTokens;
    record.completionTokens += completionTokens;
    record.totalTokens += promptTokens + completionTokens;
    record.currentContextTokens = currentContextTokens ?? promptTokens;
    record.requestCount += 1;
    record.lastUpdated = new Date();

    this.usage.set(modelKey, record);
    return record;
  }

  /**
   * Returns current telemetry and quota metrics for all models.
   */
  public getTelemetry(): Array<ModelUsageRecord & { spec: ModelQuotaSpec; contextPercent: number }> {
    return Array.from(this.usage.entries()).map(([key, record]) => {
      const spec = KNOWN_MODELS[key] || {
        modelName: key,
        maxContextWindow: 128_000,
      };

      const contextPercent = Math.min(
        100,
        Math.round((record.currentContextTokens / spec.maxContextWindow) * 100)
      );

      return {
        ...record,
        spec,
        contextPercent,
      };
    });
  }

  /**
   * Resets usage counters for a model or all models.
   */
  public reset(modelKey?: string): void {
    if (modelKey && this.usage.has(modelKey)) {
      const rec = this.usage.get(modelKey)!;
      rec.promptTokens = 0;
      rec.completionTokens = 0;
      rec.totalTokens = 0;
      rec.currentContextTokens = 0;
      rec.requestCount = 0;
      rec.lastUpdated = new Date();
    } else {
      for (const rec of this.usage.values()) {
        rec.promptTokens = 0;
        rec.completionTokens = 0;
        rec.totalTokens = 0;
        rec.currentContextTokens = 0;
        rec.requestCount = 0;
        rec.lastUpdated = new Date();
      }
    }
  }
}

export const quotaTracker = new QuotaTracker();
