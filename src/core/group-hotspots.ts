import { compileGroups, filenameToGroup } from './architectural-groups.js';
import type { Hotspot } from './hotspots.js';

export function groupHotspots(
  hotspots: Hotspot[],
  architecturalGroups: Record<string, string>
): Hotspot[] {
  const groups = compileGroups(architecturalGroups);

  const grouped = hotspots.reduce(
    (acc, curr) => {
      const key = filenameToGroup(curr.file, groups);
      if (!acc[key]) {
        acc[key] = { revisions: 0, complexity: 0 };
      }
      acc[key].revisions += curr.revisions;
      acc[key].complexity += curr.complexity;
      return acc;
    },
    {} as Record<string, { complexity: number; revisions: number }>
  );

  return Object.entries(grouped).map(([file, { complexity, revisions }]) => ({
    file,
    complexity,
    revisions,
  }));
}
