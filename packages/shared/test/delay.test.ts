import { describe, it, expect } from "vitest";
import { delay } from "../src/index";

describe("delay", () => {
  it("should resolve after the specified time", async () => {
    const start = performance.now();
    await delay(50);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it("should resolve with undefined", async () => {
    const result = await delay(1);

    expect(result).toBeUndefined();
  });
});
