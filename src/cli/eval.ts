import { exec } from "child_process";

/**
 * Executes a shell command and returns the output
 * @param command The command to execute
 * @returns Promise with stdout and stderr
 */
export async function runCommand(
  command: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
}

// Example usage:
// await runCommand('ls -la');
// await runCommand('git status');
