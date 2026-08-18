/**
 * @file Tests for the coupling metric which combines coupled pairs and SOC (Sum of Coupling).
 * Each file is analyzed for its SOC score and associated coupled files.
 */
import { describe, it, expect } from 'vitest';
import type { CoupledPair } from '../../core/coupled-pairs.js';
import type { Soc } from '../../core/soc.js';
import { coupling } from '../../core/coupling.js';

describe('coupling', () => {
  it('should return an empty array if there are no coupled pairs and no socs', () => {
    const pairs: CoupledPair[] = [];

    const socs: Soc[] = [];

    const result = coupling(pairs, socs);

    expect(result).toEqual([]);
  });

  it('should map SOC to pairs', () => {
    const pairs: CoupledPair[] = [
      {
        file1: 'file1.txt',
        file2: 'file2.txt',
        percentage: 0.5,
        revisions: 10,
      },
    ];

    const socs: Soc[] = [
      {
        file: 'file1.txt',
        soc: 10,
      },
    ];

    const result = coupling(pairs, socs);

    expect(result).toEqual([
      {
        file: 'file1.txt',
        soc: 10,
        coupledFiles: [{ file: 'file2.txt', percentage: 0.5, revisions: 10 }],
      },
    ]);
  });

  it('should list a file under both sides of a pair', () => {
    const pairs: CoupledPair[] = [
      { file1: 'a.txt', file2: 'b.txt', percentage: 0.5, revisions: 10 },
    ];
    const socs: Soc[] = [
      { file: 'a.txt', soc: 2 },
      { file: 'b.txt', soc: 2 },
    ];

    expect(coupling(pairs, socs).map(item => item.coupledFiles)).toEqual([
      [{ file: 'b.txt', percentage: 0.5, revisions: 10 }],
      [{ file: 'a.txt', percentage: 0.5, revisions: 10 }],
    ]);
  });

  // A file can appear twice in one commit's numstat, which produces a pair
  // with file1 === file2. Counting it once is the long-standing behaviour;
  // an index keyed on both sides will double it unless it guards.
  it('should count a self-coupled pair once', () => {
    const pairs: CoupledPair[] = [
      { file1: 'a.txt', file2: 'a.txt', percentage: 1, revisions: 2 },
    ];
    const socs: Soc[] = [{ file: 'a.txt', soc: 1 }];

    expect(coupling(pairs, socs)[0]!.coupledFiles).toEqual([
      { file: 'a.txt', percentage: 1, revisions: 2 },
    ]);
  });

  it('should preserve the order pairs arrive in', () => {
    const pairs: CoupledPair[] = [
      { file1: 'a.txt', file2: 'z.txt', percentage: 0.1, revisions: 1 },
      { file1: 'm.txt', file2: 'a.txt', percentage: 0.9, revisions: 2 },
      { file1: 'a.txt', file2: 'c.txt', percentage: 0.5, revisions: 3 },
    ];
    const socs: Soc[] = [{ file: 'a.txt', soc: 3 }];

    expect(
      coupling(pairs, socs)[0]!.coupledFiles.map(f => f.file)
    ).toStrictEqual(['z.txt', 'm.txt', 'c.txt']);
  });

  it('should give a file with no pairs an empty coupledFiles list', () => {
    const socs: Soc[] = [{ file: 'lonely.txt', soc: 0 }];

    expect(coupling([], socs)).toEqual([
      { file: 'lonely.txt', soc: 0, coupledFiles: [] },
    ]);
  });
});
