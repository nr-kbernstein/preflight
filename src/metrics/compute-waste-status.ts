/**
 * Shared compute-waste classification — the MCP tool
 * (nr_observe_get_compute_waste) and the dashboard's GET /api/compute-waste
 * route both call this so the same inputs always land on the same status.
 */

export type ComputeWasteStatus = 'clean' | 'moderate' | 'needs_attention';

export interface SessionTokenTotals {
  readonly totalInputTokens?: number;
  readonly totalOutputTokens?: number;
  readonly totalThinkingTokens?: number;
  readonly totalCacheReadTokens?: number;
  readonly totalCacheCreationTokens?: number;
}

export interface ComputeWasteClassification {
  readonly status: ComputeWasteStatus;
  readonly wasteRatio: number | null;
}

// Ratio-based thresholds so "needs_attention" scales with session size
// instead of a fixed token count — a modern session can legitimately
// consume millions of tokens, so an absolute floor like 2,000 tokens fires
// almost unconditionally and trains developers to ignore the signal. Hand-
// picked judgment calls, not derived from data.
const NEEDS_ATTENTION_WASTE_RATIO = 0.05;
const MODERATE_WASTE_RATIO = 0.01;
// Fallback absolute thresholds, used only when a session token total isn't
// available (no CostTracker passed in) so the status doesn't silently
// disappear.
const FALLBACK_NEEDS_ATTENTION_TOKENS = 2000;
const FALLBACK_MODERATE_TOKENS = 500;

export function sumSessionTokens(metrics: SessionTokenTotals | undefined): number {
  if (!metrics) return 0;
  return (
    (metrics.totalInputTokens ?? 0) +
    (metrics.totalOutputTokens ?? 0) +
    (metrics.totalThinkingTokens ?? 0) +
    (metrics.totalCacheReadTokens ?? 0) +
    (metrics.totalCacheCreationTokens ?? 0)
  );
}

export function classifyComputeWaste(
  totalTokensWasted: number,
  totalSessionTokens: number,
): ComputeWasteClassification {
  const wasteRatio = totalSessionTokens > 0 ? totalTokensWasted / totalSessionTokens : null;
  if (wasteRatio !== null) {
    const status =
      wasteRatio >= NEEDS_ATTENTION_WASTE_RATIO
        ? 'needs_attention'
        : wasteRatio >= MODERATE_WASTE_RATIO
          ? 'moderate'
          : 'clean';
    return { status, wasteRatio };
  }
  const status =
    totalTokensWasted >= FALLBACK_NEEDS_ATTENTION_TOKENS
      ? 'needs_attention'
      : totalTokensWasted >= FALLBACK_MODERATE_TOKENS
        ? 'moderate'
        : 'clean';
  return { status, wasteRatio: null };
}
