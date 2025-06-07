import type { LogItem } from "./revisions.js";

export type Soc = {
  file: string;
  soc: number;
};

export function soc(gitRevisions: LogItem[]): Soc[] {
  const socs = new Map<string, number>();

  for (const revision of gitRevisions) {
    if (revision.fileEntries.length > 1) {
      for (const file of revision.fileEntries) {
        socs.set(file.fileName, (socs.get(file.fileName) || 0) + 1);
      }
    }
  }

  return Array.from(socs.entries())
    .map(([file, soc]) => ({ file, soc }))
    .sort((a, b) => b.soc - a.soc);
}

export function socPercentile(data: Soc[], percentile: number): Soc[] {
  // TODO: Sorting and filtering should be done in the backend.
  // Probably allow fine-tuning the thresholds with .charlie.config.json file.
  // Sort data by SOC in descending order

  const percentile80Index = Math.floor(data.length * percentile);

  return [...data]
    .sort((a, b) => b.soc - a.soc)
    .slice(0, data.length - percentile80Index);
}
