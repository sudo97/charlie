import { describe, it, expect } from 'vitest';
import { couplingAnalysis } from '../../core/coupling-analysis.js';
import type { LogItem } from '../../core/git-log.js';

const commit = (hash: string, ...files: string[]): LogItem => ({
  hash,
  date: '2026-01-01',
  author: 'Someone',
  message: 'a message',
  fileEntries: files.map(fileName => ({ fileName, added: 1, removed: 1 })),
});

describe('couplingAnalysis', () => {
  it('returns soc entries ordered by score, highest first', () => {
    const logItems = [
      commit('1', 'a.ts', 'b.ts'),
      commit('2', 'a.ts', 'b.ts'),
      commit('3', 'a.ts', 'c.ts'),
    ];

    const { soc } = couplingAnalysis(logItems);

    expect(soc.map(s => s.file)).toStrictEqual(['a.ts', 'b.ts', 'c.ts']);
    expect(soc.map(s => s.soc)).toStrictEqual([3, 2, 1]);
  });

  it('returns one coupling entry per soc entry, in the same order', () => {
    const { soc, coupling } = couplingAnalysis([
      commit('1', 'a.ts', 'b.ts'),
      commit('2', 'a.ts', 'c.ts'),
    ]);

    expect(coupling.map(c => c.file)).toStrictEqual(soc.map(s => s.file));
    expect(coupling.map(c => c.soc)).toStrictEqual(soc.map(s => s.soc));
  });

  it('lists both sides of a pair, once under each file', () => {
    const { coupling } = couplingAnalysis([commit('1', 'a.ts', 'b.ts')]);

    const a = coupling.find(c => c.file === 'a.ts')!;
    const b = coupling.find(c => c.file === 'b.ts')!;

    expect(a.coupledFiles.map(f => f.file)).toStrictEqual(['b.ts']);
    expect(b.coupledFiles.map(f => f.file)).toStrictEqual(['a.ts']);
  });

  it('reports the coupling percentage of a pair', () => {
    const { coupling } = couplingAnalysis([
      commit('1', 'a.ts', 'b.ts'),
      commit('2', 'a.ts'),
    ]);

    const a = coupling.find(c => c.file === 'a.ts')!;

    expect(a.coupledFiles[0]).toStrictEqual({
      file: 'b.ts',
      percentage: 0.5,
      revisions: 2,
    });
  });

  it('returns empty arrays for an empty log', () => {
    expect(couplingAnalysis([])).toStrictEqual({ soc: [], coupling: [] });
  });

  it('returns empty arrays when no commit touches more than one file', () => {
    expect(
      couplingAnalysis([commit('1', 'a.ts'), commit('2', 'b.ts')])
    ).toStrictEqual({ soc: [], coupling: [] });
  });

  it('does not bound its output', () => {
    const files = Array.from({ length: 40 }, (_, i) => `f${i}.ts`);

    const { soc, coupling } = couplingAnalysis([commit('1', ...files)]);

    expect(soc).toHaveLength(40);
    expect(coupling).toHaveLength(40);
    expect(coupling[0]!.coupledFiles).toHaveLength(39);
  });
});
