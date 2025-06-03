import { spawn } from "child_process";
import type { GitLogEmitter } from "./git-log.js";

export function createGitLogEmitter(repositoryPath: string): GitLogEmitter {
  const lastYear = new Date();

  lastYear.setFullYear(lastYear.getFullYear() - 1);

  const gitArgs = [
    "log",
    "--all",
    "--numstat",
    "--date=short",
    "--pretty=format:'--%h--%ad--%aN'",
    "--no-renames",
    `--after=${lastYear.toJSON()}`,
  ];

  const gitProcess = spawn("git", gitArgs, { cwd: repositoryPath });

  return {
    onData: (listener) => {
      gitProcess.stdout.on("data", listener);
    },
    onError: (listener) => {
      gitProcess.on("error", listener);
    },
    onErrorData: (listener) => {
      gitProcess.stderr.on("data", listener);
    },
    onClose: (listener) => {
      gitProcess.on("close", listener);
    },
  };
}
