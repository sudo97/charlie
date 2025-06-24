import { describe, it, expect } from 'vitest';
import { hotspots } from '../../core/hotspots';

describe('Hotspots', () => {
  it('should return an empty array if there are no hotspots', async () => {
    const result = await hotspots({}, () => Promise.resolve(0));
    expect(result).toEqual([]);
  });

  it('should read each file', async () => {
    const files: string[] = [];

    await hotspots({ 'file1.txt': 1, 'file2.txt': 1 }, file => {
      files.push(file);
      return Promise.resolve(0);
    });

    expect(files).toEqual(['file1.txt', 'file2.txt']);
  });

  it('should return the complexity of each file and sort them by `complexity * revisions`', async () => {
    const fileSystem = {
      'file1.txt': 2,
      'file2.txt': 3,
    };

    const result = await hotspots({ 'file1.txt': 1, 'file2.txt': 1 }, file =>
      Promise.resolve(fileSystem[file])
    );

    expect(result).toEqual([
      { file: 'file2.txt', complexity: 3, revisions: 1 },
      { file: 'file1.txt', complexity: 2, revisions: 1 },
    ]);
  });

  it('should ignore files with complexity 0', async () => {
    const fileSystem = {
      'file1.txt': 0,
      'file2.txt': 3,
    };

    const result = await hotspots({ 'file1.txt': 1, 'file2.txt': 1 }, file =>
      Promise.resolve(fileSystem[file])
    );

    expect(result).toEqual([
      { file: 'file2.txt', complexity: 3, revisions: 1 },
    ]);
  });

  it('should sort hotspots by complexity * revisions in descending order', async () => {
    const fileSystem = {
      'low-complexity-high-revisions.txt': 2, // complexity: 2, revisions: 10 -> score: 20
      'high-complexity-low-revisions.txt': 5, // complexity: 5, revisions: 3 -> score: 15
      'medium-complexity-medium-revisions.txt': 3, // complexity: 3, revisions: 8 -> score: 24
    };

    const result = await hotspots(
      {
        'low-complexity-high-revisions.txt': 10,
        'high-complexity-low-revisions.txt': 3,
        'medium-complexity-medium-revisions.txt': 8,
      },
      file => Promise.resolve(fileSystem[file])
    );

    expect(result).toEqual([
      {
        file: 'medium-complexity-medium-revisions.txt',
        complexity: 3,
        revisions: 8,
      }, // score: 24
      {
        file: 'low-complexity-high-revisions.txt',
        complexity: 2,
        revisions: 10,
      }, // score: 20
      {
        file: 'high-complexity-low-revisions.txt',
        complexity: 5,
        revisions: 3,
      }, // score: 15
    ]);
  });
});
