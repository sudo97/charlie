import { describe, it, expect } from 'vitest';
import { parseConfig, Config } from '../../cli/config.js';

describe('parseConfig', () => {
  it('should parse a config', () => {
    const config: Config = parseConfig('{}');
    const expectedDate = new Date();
    expectedDate.setFullYear(expectedDate.getFullYear() - 1);
    expect(config.after).toBeInstanceOf(Date);
    expect(config.after.getTime()).toBe(expectedDate.getTime());
    expect(config.include).toStrictEqual([]);
    expect(config.exclude).toStrictEqual([]);
  });
});
