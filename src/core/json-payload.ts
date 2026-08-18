import type { CouplingAnalysis, CouplingItem } from './coupling-analysis.js';
import type { Hotspot } from './hotspots.js';
import { topByScore, topN } from './percentile.js';

export type Limits = {
  percentile: number;
  minKept: number;
  maxCoupledFiles: number;
};

export type JsonPayload = {
  hotspots: Hotspot[];
  coupling: CouplingItem[];
};

export const defaultLimits: Limits = {
  percentile: 0.95,
  minKept: 30,
  maxCoupledFiles: 10,
};

function boundCoupling(
  analysis: CouplingAnalysis,
  limits: Limits
): CouplingItem[] {
  const kept = new Set(
    topByScore(analysis.soc, limits.percentile, limits.minKept, s => s.soc).map(
      s => s.file
    )
  );

  return analysis.coupling
    .filter(item => kept.has(item.file))
    .map(item => ({
      ...item,
      coupledFiles: topN(
        item.coupledFiles,
        limits.maxCoupledFiles,
        f => f.percentage
      ),
    }));
}

export function jsonPayload(
  hotspots: Hotspot[],
  analysis: CouplingAnalysis,
  limits: Limits | undefined
): JsonPayload {
  if (!limits) {
    return { hotspots, coupling: analysis.coupling };
  }

  return {
    hotspots: topByScore(
      hotspots,
      limits.percentile,
      limits.minKept,
      h => h.complexity * h.revisions
    ),
    coupling: boundCoupling(analysis, limits),
  };
}
