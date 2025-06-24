import type { Revisions } from './revisions.js';

export type Hotspot = {
  file: string;
  complexity: number;
  revisions: number;
};

export async function hotspots(
  revisions: Revisions,
  visualComplexity: (file: string) => Promise<number>
): Promise<Hotspot[]> {
  const hotspots: Hotspot[] = [];
  for (const file of Object.keys(revisions)) {
    const complexity = await visualComplexity(file);
    hotspots.push({ file, complexity, revisions: revisions[file]! });
  }
  return hotspots
    .sort((a, b) => b.complexity * b.revisions - a.complexity * a.revisions)
    .filter(h => h.complexity > 0);
}
