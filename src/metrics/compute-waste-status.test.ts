import { classifyComputeWaste, sumSessionTokens } from './compute-waste-status.js';
import { handleGetComputeWaste } from '../tools/extended-analytics-tools.js';
import { createApiHandler } from '../dashboard/routes/api-handler.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RetryDetector } from './retry-detector.js';
import type { AntiPatternDetector } from './anti-patterns.js';
import type { CostTracker } from './cost-tracker.js';

function makeTotals(totalInputTokens: number) {
  return {
    totalInputTokens,
    totalOutputTokens: 0,
    totalThinkingTokens: 0,
    totalCacheReadTokens: 0,
    totalCacheCreationTokens: 0,
  };
}

describe('classifyComputeWaste', () => {
  it('uses the waste ratio when session tokens are known', () => {
    expect(classifyComputeWaste(5_000, 1_000_000).status).toBe('clean');
    expect(classifyComputeWaste(15_000, 1_000_000).status).toBe('moderate');
    expect(classifyComputeWaste(60_000, 1_000_000).status).toBe('needs_attention');
  });

  it('falls back to absolute thresholds without session tokens', () => {
    expect(classifyComputeWaste(100, 0)).toEqual({ status: 'clean', wasteRatio: null });
    expect(classifyComputeWaste(600, 0).status).toBe('moderate');
    expect(classifyComputeWaste(2_000, 0).status).toBe('needs_attention');
  });

  it('sums every token bucket', () => {
    expect(sumSessionTokens(undefined)).toBe(0);
    expect(sumSessionTokens({ totalInputTokens: 1, totalCacheReadTokens: 2 })).toBe(3);
  });
});

describe('compute-waste status parity between MCP tool and dashboard route', () => {
  function fakeRes(): { res: ServerResponse; body: () => string } {
    let body = '';
    const res = {
      writeHead: () => res,
      setHeader: () => res,
      end: (chunk?: string) => {
        body = chunk ?? '';
      },
    } as unknown as ServerResponse;
    return { res, body: () => body };
  }

  it.each([
    [115_000, 23_000_000],
    [115_000, 1_000_000],
    [20_000, 1_000_000],
    [600, 0],
  ])('agrees for %d wasted tokens over %d session tokens', async (wasted, sessionTokens) => {
    const retryDetector = {
      getMetrics: () => ({ totalTokensWasted: wasted }),
    } as unknown as RetryDetector;
    const antiPatternDetector = {
      getCurrentPatterns: () => [],
      getTotalAntiPatternWaste: () => 0,
    } as unknown as AntiPatternDetector;
    const costTracker =
      sessionTokens > 0 ? { getMetrics: () => makeTotals(sessionTokens) } : undefined;

    const mcp = JSON.parse(
      handleGetComputeWaste(
        retryDetector,
        antiPatternDetector,
        costTracker as unknown as CostTracker,
      ).content[0]!.text,
    ) as { status: string; waste_ratio: number | null };

    const handler = createApiHandler({
      retryDetector,
      antiPatternDetector,
      costTracker,
    } as unknown as Parameters<typeof createApiHandler>[0]);
    const { res, body } = fakeRes();
    await handler({ method: 'GET', url: '/api/compute-waste' } as IncomingMessage, res);
    const api = JSON.parse(body()) as { status: string; waste_ratio: number | null };

    expect(api.status).toBe(mcp.status);
    expect(api.waste_ratio).toBe(mcp.waste_ratio);
  });
});
