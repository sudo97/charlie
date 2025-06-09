import type { Hotspot } from './hotspots.js';

export function groupHotspots(
  hotspots: Hotspot[],
  groups: Record<string, string>
): Hotspot[] {
  if (Object.keys(groups).length === 0) {
    return hotspots;
  }

  const groupRegexes = Object.entries(groups).map(([key, value]) => ({
    regex: new RegExp(key),
    group: value,
  }));

  const grouped = hotspots.reduce(
    (acc, curr) => {
      const group = groupRegexes.find(group => group.regex.test(curr.file));
      if (group) {
        const key = group.group;
        if (!acc[key]) {
          acc[key] = { revisions: 0, complexity: 0 };
        }
        acc[key].revisions += curr.revisions;
        acc[key].complexity += curr.complexity;
      }
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
