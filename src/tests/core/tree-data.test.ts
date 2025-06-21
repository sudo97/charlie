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
        path: '',
        children: [
          {
            name: 'file1.txt',
            path: '/file1.txt',
            complexity: 1,
            revisions: 1,
          },
          {
            name: 'file2.txt',
            path: '/file2.txt',
            complexity: 2,
            revisions: 2,
          },
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
        path: '',
        children: [
          {
            name: 'file1.txt',
            complexity: 1,
            revisions: 1,
            path: '/file1.txt',
          },
        ],
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
      path: '',
      children: [
        {
          name: 'src',
          path: '/src',
          children: [
            {
              name: 'file1.txt',
              complexity: 1,
              revisions: 1,
              path: '/src/file1.txt',
            },
            {
              name: 'file2.txt',
              complexity: 2,
              revisions: 2,
              path: '/src/file2.txt',
            },
            {
              name: 'other',
              path: '/src/other',
              children: [
                {
                  name: 'file3.txt',
                  complexity: 3,
                  revisions: 3,
                  path: '/src/other/file3.txt',
                },
              ],
            },
          ],
        },
        {
          name: 'entirely',
          path: '/entirely',
          children: [
            {
              name: 'other',
              path: '/entirely/other',
              children: [
                {
                  name: 'folder',
                  path: '/entirely/other/folder',
                  children: [
                    {
                      name: 'file4.txt',
                      complexity: 4,
                      revisions: 4,
                      path: '/entirely/other/folder/file4.txt',
                    },
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
