import { describe, it, expect } from 'vitest';
import { parseArgs } from '../../core/parse-args.js';

describe('parseArgs', () => {
  it('defaults to the current directory when no arguments are given', () => {
    expect(parseArgs([])).toStrictEqual({
      repositoryPath: '.',
      json: false,
      all: false,
    });
  });

  it('takes the first non-flag argument as the repository path', () => {
    expect(parseArgs(['/some/repo'])).toStrictEqual({
      repositoryPath: '/some/repo',
      json: false,
      all: false,
    });
  });

  it('takes the first of several non-flag arguments', () => {
    expect(parseArgs(['/first', '/second']).repositoryPath).toBe('/first');
  });

  it('finds the path when it follows the flag', () => {
    expect(parseArgs(['--json', '/some/repo'])).toStrictEqual({
      repositoryPath: '/some/repo',
      json: true,
      all: false,
    });
  });

  it('finds the path when it precedes the flag', () => {
    expect(parseArgs(['/some/repo', '--json'])).toStrictEqual({
      repositoryPath: '/some/repo',
      json: true,
      all: false,
    });
  });

  it('reports json true when --json is present without a path', () => {
    expect(parseArgs(['--json'])).toStrictEqual({
      repositoryPath: '.',
      json: true,
      all: false,
    });
  });

  it('reports all true only when --all is present', () => {
    expect(parseArgs(['--json', '--all'])).toStrictEqual({
      repositoryPath: '.',
      json: true,
      all: true,
    });
    expect(parseArgs(['--all']).all).toBe(true);
  });

  it('ignores unknown flags', () => {
    expect(parseArgs(['--wat', '/some/repo'])).toStrictEqual({
      repositoryPath: '/some/repo',
      json: false,
      all: false,
    });
  });

  it('treats a bare -- as a flag rather than a path', () => {
    expect(parseArgs(['--', '/some/repo']).repositoryPath).toBe('/some/repo');
  });

  it('does not mistake a path containing dashes for a flag', () => {
    expect(parseArgs(['my-repo']).repositoryPath).toBe('my-repo');
  });
});
