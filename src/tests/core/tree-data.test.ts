import { describe, it, expect } from 'vitest';
import { treeData } from '../../core/tree-data';
import { Hotspot } from '../../core/hotspots';

describe('treeData', () => {
  it('should return the tree data', () => {
    {
      const hotspots: Hotspot[] = [
        { file: 'file1.txt', complexity: 1, revisions: 1 },
        { file: 'file2.txt', complexity: 2, revisions: 2 },
      ];
      const result = treeData(hotspots);

      expect(result).toEqual({
        name: 'Root',
        children: [
          { name: 'file1.txt', complexity: 1, revisions: 1 },
          { name: 'file2.txt', complexity: 2, revisions: 2 },
        ],
      });
    }
    {
      const hotspots: Hotspot[] = [
        { file: 'file1.txt', complexity: 1, revisions: 1 },
      ];
      const result = treeData(hotspots);

      expect(result).toEqual({
        name: 'Root',
        children: [{ name: 'file1.txt', complexity: 1, revisions: 1 }],
      });
    }
  });

  it('should handle folders', () => {
    const hotspots: Hotspot[] = [
      { file: 'src/file1.txt', complexity: 1, revisions: 1 },
      { file: 'src/file2.txt', complexity: 2, revisions: 2 },
      { file: 'src/other/file3.txt', complexity: 3, revisions: 3 },
      { file: 'entirely/other/folder/file4.txt', complexity: 4, revisions: 4 },
    ];

    const result = treeData(hotspots);

    expect(result).toEqual({
      name: 'Root',
      children: [
        {
          name: 'src',
          children: [
            { name: 'file1.txt', complexity: 1, revisions: 1 },
            { name: 'file2.txt', complexity: 2, revisions: 2 },
            {
              name: 'other',
              children: [{ name: 'file3.txt', complexity: 3, revisions: 3 }],
            },
          ],
        },
        {
          name: 'entirely',
          children: [
            {
              name: 'other',
              children: [
                {
                  name: 'folder',
                  children: [
                    { name: 'file4.txt', complexity: 4, revisions: 4 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });
});
