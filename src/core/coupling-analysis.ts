import type { LogItem } from './git-log.js';
import { coupledPairs } from './coupled-pairs.js';
import { coupling, type CouplingItem } from './coupling.js';
import { soc, type Soc } from './soc.js';

export type { CouplingItem, Soc };

export type CouplingAnalysis = {
  soc: Soc[];
  coupling: CouplingItem[];
};

export function couplingAnalysis(logItems: LogItem[]): CouplingAnalysis {
  const socs = soc(logItems);

  return {
    soc: socs,
    coupling: coupling(coupledPairs(logItems), socs),
  };
}
