import { describe, it, expect } from "vitest";
import { produceGitLog, type GitLogEmitter } from "./git-log.js";

describe("git-log parser", () => {
  it("should produce an empty array if the git log is empty", async () => {
    const mockGitLogEmitter: GitLogEmitter = {
      onData: (listener) => {
        listener("");
      },
      onError: () => {},
      onErrorData: () => {},
      onClose: (listener) => {
        listener(0);
      },
    };

    const logItems = await produceGitLog(mockGitLogEmitter);
    expect(logItems).toEqual([]);
  });

  it("should reject if the git log emits an error", async () => {
    const mockGitLogEmitter: GitLogEmitter = {
      onData: () => {},
      onError: (listener) => {
        listener(new Error("abc"));
      },
      onErrorData: () => {},
      onClose: () => {},
    };

    await expect(produceGitLog(mockGitLogEmitter)).rejects.toThrow("abc");
  });

  it("should reject if process ends with non 0", async () => {
    const mockGitLogEmitter: GitLogEmitter = {
      onData: () => {},
      onError: () => {},
      onErrorData: () => {},
      onClose: (listener) => {
        listener(1);
      },
    };

    await expect(produceGitLog(mockGitLogEmitter)).rejects.toThrow();
  });

  it("should produce a log item for each commit", async () => {
    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    let done: (code: number) => void;

    const mockGitLogEmitter: GitLogEmitter = {
      onData: (listener) => {
        (async () => {
          listener("'--123456--2024-01-01--John");
          await sleep(10);
          listener(" Doe'\n");
          await sleep(10);
          listener("1 1 file.txt\n");
          await sleep(10);
          listener("\n");
          listener("\n");
          done(0);
        })();
      },
      onError: () => {},
      onErrorData: () => {},
      onClose: (listener) => {
        done = listener;
      },
    };

    const logItems = await produceGitLog(mockGitLogEmitter);

    expect(logItems).toEqual([
      {
        hash: "123456",
        date: "2024-01-01",
        author: "John Doe",
        fileEntries: [{ fileName: "file.txt", added: 1, removed: 1 }],
      },
    ]);
  });
});
