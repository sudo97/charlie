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
});
