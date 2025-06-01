import { describe, it, expect } from "vitest";
import { greet } from "./index";

describe("Charlie Index Functions", () => {
  it("should greet properly", () => {
    const result = greet("World");
    expect(result).toBe("Hello, World! Ready to analyze some git history?");
  });

  it("should greet with custom name", () => {
    const result = greet("Developer");
    expect(result).toBe("Hello, Developer! Ready to analyze some git history?");
  });
});
