import { describe, it, expect } from 'vitest';
import { visualComplexity } from '../../core/visual-complexity';

export function mkEmitter(text: string) {
  const chunks = [...text];
  let done: () => void;
  return {
    onData: (listener: (chunk: string) => void) => {
      while (chunks.length > 0) {
        listener(chunks.shift()!);
      }
      done?.();
    },
    onEnd: (listener: () => void) => {
      done = listener;
    },
  };
}

describe('Visual Complexity', () => {
  it('should count peaks and lines', async () => {
    expect(await visualComplexity(mkEmitter(``))).toBe(0);

    expect(await visualComplexity(mkEmitter(`line1`))).toBe(1);

    expect(await visualComplexity(mkEmitter(`line1\nline2\n`))).toBe(2);

    expect(await visualComplexity(mkEmitter(`line1\n  line2\nline3`))).toBe(4);
    expect(await visualComplexity(mkEmitter(`line1\n  line2\n    line3`))).toBe(
      5
    );
    expect(
      await visualComplexity(
        mkEmitter(`line1\n  line2\n  line3\nline4\nline5\n  line6`)
      )
    ).toBe(8);
  });

  it('should handle chunks that span multiple lines', async () => {
    let end: () => void;
    const lines = ['li', 'ne\nli', 'ne\nline\nline\n', '  line'];
    expect(
      await visualComplexity({
        onData: listener => {
          for (const line of lines) {
            listener(line);
          }
          end();
        },
        onEnd: f => {
          end = f;
        },
      })
    ).toBe(await visualComplexity(mkEmitter(lines.join(''))));
  });
});
