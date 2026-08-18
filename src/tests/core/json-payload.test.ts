import { describe, it, expect } from 'vitest';
import {
  defaultLimits,
  jsonPayload,
  type Limits,
} from '../../core/json-payload.js';
import type { Hotspot } from '../../core/hotspots.js';
import type { CouplingAnalysis } from '../../core/coupling-analysis.js';

const hotspot = (file: string, complexity: number, revisions: number) => ({
  file,
  complexity,
  revisions,
});

const partner = (file: string, percentage: number) => ({
  file,
  percentage,
  revisions: 10,
});

const analysis = (
  ...entries: Array<{ file: string; soc: number; partners: string[] }>
): CouplingAnalysis => ({
  soc: entries.map(e => ({ file: e.file, soc: e.soc })),
  coupling: entries.map(e => ({
    file: e.file,
    soc: e.soc,
    coupledFiles: e.partners.map((p, i) => partner(p, 1 / (i + 1))),
  })),
});

const noLimits: Limits | undefined = undefined;

describe('jsonPayload', () => {
  it('emits exactly the hotspots and coupling keys', () => {
    const payload = jsonPayload([], analysis(), noLimits);

    expect(Object.keys(payload)).toStrictEqual(['hotspots', 'coupling']);
  });

  it('returns everything when limits are absent', () => {
    const hotspots: Hotspot[] = Array.from({ length: 40 }, (_, i) =>
      hotspot(`f${i}.ts`, i + 1, 1)
    );
    const entries = Array.from({ length: 40 }, (_, i) => ({
      file: `f${i}.ts`,
      soc: i,
      partners: Array.from({ length: 25 }, (_, j) => `p${j}.ts`),
    }));

    const payload = jsonPayload(hotspots, analysis(...entries), noLimits);

    expect(payload.hotspots).toHaveLength(40);
    expect(payload.coupling).toHaveLength(40);
    expect(payload.coupling[0]!.coupledFiles).toHaveLength(25);
  });

  it('bounds hotspots by complexity times revisions', () => {
    const hotspots = [
      hotspot('small.ts', 2, 2),
      hotspot('big.ts', 100, 100),
      hotspot('medium.ts', 10, 10),
    ];

    const payload = jsonPayload(hotspots, analysis(), {
      percentile: 0.5,
      minKept: 1,
      maxCoupledFiles: 10,
    });

    expect(payload.hotspots.map(h => h.file)).toStrictEqual([
      'big.ts',
      'medium.ts',
    ]);
  });

  it('bounds coupling by soc score', () => {
    const payload = jsonPayload(
      [],
      analysis(
        { file: 'a.ts', soc: 1, partners: ['x.ts'] },
        { file: 'b.ts', soc: 50, partners: ['x.ts'] },
        { file: 'c.ts', soc: 20, partners: ['x.ts'] }
      ),
      { percentile: 0.5, minKept: 1, maxCoupledFiles: 10 }
    );

    expect(payload.coupling.map(c => c.file)).toStrictEqual(['b.ts', 'c.ts']);
  });

  it('keeps at most maxCoupledFiles partners per file', () => {
    const payload = jsonPayload(
      [],
      analysis({
        file: 'a.ts',
        soc: 1,
        partners: ['p1.ts', 'p2.ts', 'p3.ts', 'p4.ts'],
      }),
      { percentile: 0, minKept: 0, maxCoupledFiles: 2 }
    );

    expect(payload.coupling[0]!.coupledFiles).toHaveLength(2);
  });

  it('orders coupled files by percentage, highest first', () => {
    const payload = jsonPayload(
      [],
      {
        soc: [{ file: 'a.ts', soc: 1 }],
        coupling: [
          {
            file: 'a.ts',
            soc: 1,
            coupledFiles: [
              partner('low.ts', 0.1),
              partner('high.ts', 0.9),
              partner('mid.ts', 0.5),
            ],
          },
        ],
      },
      { percentile: 0, minKept: 0, maxCoupledFiles: 2 }
    );

    expect(payload.coupling[0]!.coupledFiles.map(f => f.file)).toStrictEqual([
      'high.ts',
      'mid.ts',
    ]);
  });

  it('returns empty arrays for empty input', () => {
    expect(jsonPayload([], analysis(), defaultLimits)).toStrictEqual({
      hotspots: [],
      coupling: [],
    });
  });

  it('does not mutate its inputs', () => {
    const hotspots = [hotspot('a.ts', 1, 1), hotspot('b.ts', 9, 9)];
    const data = analysis({
      file: 'a.ts',
      soc: 1,
      partners: ['p1.ts', 'p2.ts'],
    });
    const hotspotsBefore = JSON.stringify(hotspots);
    const dataBefore = JSON.stringify(data);

    jsonPayload(hotspots, data, {
      percentile: 0.9,
      minKept: 1,
      maxCoupledFiles: 1,
    });

    expect(JSON.stringify(hotspots)).toBe(hotspotsBefore);
    expect(JSON.stringify(data)).toBe(dataBefore);
  });

  it('has defaults matching the spec', () => {
    expect(defaultLimits).toStrictEqual({
      percentile: 0.95,
      minKept: 30,
      maxCoupledFiles: 10,
    });
  });
});
