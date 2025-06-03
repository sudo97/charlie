import type { Revisions } from "./revisions.js";
import { visualComplexity } from "./visual-complexity.js";

export type Hotspot = {
  file: string;
  complexity: number;
  revisions: number;
};

export async function hotspots(
  revisions: Revisions,
  fileReader: (file: string) => Promise<string>
): Promise<Hotspot[]> {
  const hotspots: Hotspot[] = [];
  for (const file of Object.keys(revisions)) {
    const contents = await fileReader(file);
    const complexity = visualComplexity(contents);
    hotspots.push({ file, complexity, revisions: revisions[file]! });
  }
  return hotspots.sort(
    (a, b) => b.complexity * b.revisions - a.complexity * a.revisions
  );
}
