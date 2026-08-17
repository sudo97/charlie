import { describe, it, expect } from 'vitest';
import { topByScore, topN } from '../../core/percentile.js';

type Item = { name: string; value: number };

const items = (...values: number[]): Item[] =>
  values.map(value => ({ name: `n${value}`, value }));

const score = (item: Item) => item.value;

describe('topN', () => {
  it('keeps the n highest-scoring entries, highest first', () => {
    expect(topN(items(3, 9, 1, 7), 2, score).map(score)).toStrictEqual([9, 7]);
  });

  it('keeps everything when n exceeds the data length', () => {
    expect(topN(items(3, 1), 10, score).map(score)).toStrictEqual([3, 1]);
  });

  it('keeps nothing when n is zero', () => {
    expect(topN(items(3, 1), 0, score)).toStrictEqual([]);
  });

  it('does not mutate its input', () => {
    const data = items(3, 9, 1);
    const before = [...data];

    topN(data, 2, score);

    expect(data).toStrictEqual(before);
  });
});

describe('topByScore', () => {
  it('keeps the top fraction implied by the percentile', () => {
    const data = items(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

    expect(topByScore(data, 0.9, 0, score).map(score)).toStrictEqual([10]);
    expect(topByScore(data, 0.8, 0, score).map(score)).toStrictEqual([10, 9]);
  });

  it('orders results by score, highest first', () => {
    const data = items(3, 9, 1, 7);

    expect(topByScore(data, 0, 0, score).map(score)).toStrictEqual([
      9, 7, 3, 1,
    ]);
  });

  it('keeps at least minKept entries when the percentile would keep fewer', () => {
    const data = items(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

    expect(topByScore(data, 0.9, 4, score).map(score)).toStrictEqual([
      10, 9, 8, 7,
    ]);
  });

  it('does not let minKept reduce what the percentile keeps', () => {
    const data = items(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

    expect(topByScore(data, 0.5, 2, score)).toHaveLength(5);
  });

  it('keeps everything when the data is shorter than minKept', () => {
    const data = items(1, 2, 3);

    expect(topByScore(data, 0.9, 30, score).map(score)).toStrictEqual([
      3, 2, 1,
    ]);
  });

  it('keeps everything at percentile 0', () => {
    expect(topByScore(items(1, 2, 3), 0, 0, score)).toHaveLength(3);
  });

  it('keeps nothing at percentile 1 with no floor', () => {
    expect(topByScore(items(1, 2, 3), 1, 0, score)).toStrictEqual([]);
  });

  it('returns an empty array for empty data', () => {
    expect(topByScore([], 0.9, 30, score)).toStrictEqual([]);
  });

  it('does not mutate its input', () => {
    const data = items(3, 9, 1);
    const before = [...data];

    topByScore(data, 0, 0, score);

    expect(data).toStrictEqual(before);
  });
});
