import type { CoupledPair } from './coupled-pairs';
import type { Soc } from './soc';

export type CouplingItem = {
  file: string;
  soc: number;
  coupledFiles: Array<{ file: string; percentage: number; revisions: number }>;
};

type Partner = { file: string; percentage: number; revisions: number };

function indexByFile(coupledPairs: CoupledPair[]): Map<string, Partner[]> {
  const index = new Map<string, Partner[]>();

  const add = (file: string, partner: Partner) => {
    const partners = index.get(file);
    if (partners) {
      partners.push(partner);
    } else {
      index.set(file, [partner]);
    }
  };

  for (const pair of coupledPairs) {
    const { file1, file2, percentage, revisions } = pair;
    add(file1, { file: file2, percentage, revisions });
    if (file2 !== file1) {
      add(file2, { file: file1, percentage, revisions });
    }
  }

  return index;
}

export function coupling(
  coupledPairs: CoupledPair[],
  socs: Soc[]
): CouplingItem[] {
  const partnersByFile = indexByFile(coupledPairs);

  return socs.map(soc => ({
    file: soc.file,
    soc: soc.soc,
    coupledFiles: partnersByFile.get(soc.file) ?? [],
  }));
}
