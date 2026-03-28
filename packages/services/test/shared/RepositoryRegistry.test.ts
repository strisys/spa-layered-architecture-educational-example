import { describe, it, expect } from "vitest";
import { RepositoryRegistry } from "../../src/index";

describe("RepositoryRegistry", () => {
  it("should return the same instance from current", () => {
    const first = RepositoryRegistry.current();
    const second = RepositoryRegistry.current();
    expect(first).toBe(second);
  });
});
