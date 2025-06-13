import { describe, it, expect } from 'vitest';
import { gitHistoryWordCount, wordCount } from './word-count.ts';
import { LogItem } from './git-log.ts';

describe('word count', () => {
  it('should return an empty object if the text is empty', () => {
    expect(wordCount('')).toEqual({});
  });

  it('should count words in a sentence', () => {
    expect(wordCount('b a b')).toEqual({ a: 1, b: 2 });
  });

  it('should use lowercase', () => {
    expect(wordCount('A')).toEqual({ a: 1 });
  });

  it('should ignore punctuation', () => {
    expect(wordCount('a,b')).toEqual({ a: 1, b: 1 });
  });

  it('should ignore numbers', () => {
    expect(wordCount('123')).toEqual({});
  });

  it('should ignore special characters', () => {
    expect(wordCount('a!b')).toEqual({ a: 1, b: 1 });
  });
});

describe('git history word count', () => {
  it('should return an empty object if the log items are empty', () => {
    expect(gitHistoryWordCount([])).toEqual({});
  });

  it('should count words in the log items', () => {
    expect(
      gitHistoryWordCount([
        { message: 'a b' },
        { message: 'b c' },
      ] as Array<LogItem>)
    ).toEqual({ a: 1, b: 2, c: 1 });
  });
});
