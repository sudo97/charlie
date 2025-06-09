import { describe, it, expect } from 'vitest';
import { groupHotspots } from './group-hotspots.js';
import { Hotspot } from './hotspots.js';

describe('groupHotspots', () => {
  function createHotspot(
    file: string,
    complexity: number = 10,
    revisions: number = 10
  ) {
    return { file, complexity, revisions };
  }

  it('should return the same hotspots if no groups is provided', () => {
    const hotspots = [
      createHotspot('src/components/Button.tsx'),
      createHotspot('src/components/Input.tsx'),
      createHotspot('src/components/Text.tsx'),
    ];
    const grouped = groupHotspots(hotspots, {});
    expect(grouped).toEqual(hotspots);
  });

  it('should group hotspots by regex', () => {
    const hotspots = [
      createHotspot('src/moduleA/Button.tsx', 10, 1),
      createHotspot('src/moduleA/Input.tsx', 20, 2),
      createHotspot('src/moduleB/Text.tsx', 30, 3),
    ];
    const grouped = groupHotspots(hotspots, {
      ['^src/moduleA/']: 'moduleA',
      ['^src/moduleB/']: 'moduleB',
    });
    expect(grouped).toEqual<Hotspot[]>([
      {
        file: 'moduleA',
        complexity: 30,
        revisions: 3,
      },
      {
        file: 'moduleB',
        complexity: 30,
        revisions: 3,
      },
    ]);
  });
});
