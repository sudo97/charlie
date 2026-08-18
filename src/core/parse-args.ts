export type Args = {
  repositoryPath: string;
  json: boolean;
  all: boolean;
};

const isFlag = (arg: string) => arg.startsWith('--');

export function parseArgs(argv: string[]): Args {
  return {
    repositoryPath: argv.find(arg => !isFlag(arg)) ?? '.',
    json: argv.includes('--json'),
    all: argv.includes('--all'),
  };
}
