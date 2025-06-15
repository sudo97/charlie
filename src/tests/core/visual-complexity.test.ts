import { describe, it, expect } from 'vitest';
import { visualComplexity } from '../../core/visual-complexity';

describe('Visual Complexity', () => {
  it('should return 0 if the file is empty', () => {
    const result = visualComplexity('');
    expect(result).toBe(0);
  });

  it('should count non-epmty lines', () => {
    expect(visualComplexity(`line1\nline2`)).toBe(2);
    expect(visualComplexity(`line1\nline2\nline3`)).toBe(3);
    expect(visualComplexity(`line1\nline2\n\nline4`)).toBe(3);
  });

  it('should count peaks', () => {
    expect(visualComplexity(`line1\n  line2\nline3`)).toBe(4);
    expect(visualComplexity(`line1\n  line2\n    line3`)).toBe(5);
    expect(
      visualComplexity(`line1\n  line2\n  line3\nline4\nline5\n  line6`)
    ).toBe(8);
  });
});
