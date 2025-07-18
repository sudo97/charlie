import { z } from 'zod/v4-mini';
import * as path from 'path';
import * as fs from 'fs/promises';

const configSchema = z.object({
  include: z.optional(z.array(z.string())),
  exclude: z.optional(z.array(z.string())),
  after: z.optional(z.iso.date()),
  architecturalGroups: z.optional(z.record(z.string(), z.string())),
});

export type Config = {
  include: RegExp[];
  exclude: RegExp[];
  after: Date;
  architecturalGroups: Record<string, string>;
};

export function parseConfig(config: string): Config {
  const parsed = configSchema.parse(JSON.parse(config));
  let after: Date;

  if (!parsed.after) {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    after = lastYear;
  } else {
    after = new Date(parsed.after);
  }

  return {
    include: (parsed.include ?? []).map(pattern => new RegExp(pattern)),
    exclude: (parsed.exclude ?? []).map(pattern => new RegExp(pattern)),
    after,
    architecturalGroups: parsed.architecturalGroups ?? {},
  };
}

export async function readConfigFile(repositoryPath: string): Promise<Config> {
  return parseConfig(
    await fs
      .readFile(path.join(repositoryPath, '.charlie.config.json'), 'utf8')
      .catch(() => '{}')
  );
}
