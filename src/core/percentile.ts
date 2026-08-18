export function topN<T>(data: T[], n: number, score: (item: T) => number): T[] {
  return [...data].sort((a, b) => score(b) - score(a)).slice(0, n);
}

export function topByScore<T>(
  data: T[],
  percentile: number,
  minKept: number,
  score: (item: T) => number
): T[] {
  const fromPercentile = data.length - Math.floor(data.length * percentile);

  return topN(
    data,
    Math.min(Math.max(fromPercentile, minKept), data.length),
    score
  );
}
