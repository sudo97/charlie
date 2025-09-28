import type { CoupledPair } from './coupled-pairs';
import type { Soc } from './soc';

export type CouplingItem = {
  file: string;
  soc: number;
  coupledFiles: Array<{ file: string; percentage: number; revisions: number }>;
};

export function coupling(
  coupledPairs: CoupledPair[],
  socs: Soc[]
): CouplingItem[] {
  return socs.map(soc => ({
    file: soc.file,
    soc: soc.soc,
    coupledFiles: coupledPairs
      .filter(pair => pair.file1 === soc.file || pair.file2 === soc.file)
      .map(p => ({
        file: p.file1 === soc.file ? p.file2 : p.file1,
        percentage: p.percentage,
        revisions: p.revisions,
      })),
  }));
}
