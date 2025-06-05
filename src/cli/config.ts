import { z } from "zod/v4-mini";

const configSchema = z.object({
  include: z.optional(z.array(z.string())),
  exclude: z.optional(z.array(z.string())),
});

export type Config = {
  include: RegExp[];
  exclude: RegExp[];
};

export function parseConfig(config: string): Config {
  const parsed = configSchema.parse(JSON.parse(config));
  return {
    include: (parsed.include ?? []).map((pattern) => new RegExp(pattern)),
    exclude: (parsed.exclude ?? []).map((pattern) => new RegExp(pattern)),
  };
}
