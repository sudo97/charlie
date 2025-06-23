import type { Revisions } from './revisions.js';
import {
  visualComplexity,
  type VisualComplexityEmitter,
} from './visual-complexity.js';

export type Hotspot = {
  file: string;
  complexity: number;
  revisions: number;
};

export async function hotspots(
  revisions: Revisions,
  fileReader: (file: string) => VisualComplexityEmitter
): Promise<Hotspot[]> {
  const hotspots: Hotspot[] = [];
  for (const file of Object.keys(revisions)) {
    const complexityEmitter = fileReader(file);
    const complexity = await visualComplexity(complexityEmitter);
    hotspots.push({ file, complexity, revisions: revisions[file]! });
  }
  return hotspots
    .sort((a, b) => b.complexity * b.revisions - a.complexity * a.revisions)
    .filter(h => h.complexity > 0);
}
