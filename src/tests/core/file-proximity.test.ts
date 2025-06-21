import { describe, it, expect } from 'vitest';
import { calculateFileProximity } from '../../core/file-proximity.js';

describe('File Proximity', () => {
  it('same file should have proximity 0', () => {
    const proximity = calculateFileProximity(
      'src/core/file-proximity.test.ts',
      'src/core/file-proximity.test.ts'
    );

    expect(proximity).toBe(0);
  });

  it('files in the same directory have proximity 2', () => {
    const proximity = calculateFileProximity(
      'src/core/file-proximity.test.ts',
      'src/core/file-proximity.ts'
    );

    expect(proximity).toBe(2);
  });

  it('files in a parent directory have proximity 3', () => {
    const proximity = calculateFileProximity(
      'src/core/tests/file-proximity.test.ts',
      'src/core/file-proximity.js'
    );

    expect(proximity).toBe(3);
  });

  it('files in sibling directory have proximity 4', () => {
    const proximity = calculateFileProximity(
      'src/core/a/file1',
      'src/core/b/file2'
    );

    expect(proximity).toBe(4);
  });
});
