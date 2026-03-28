import { describe, it, expect } from "vitest";
import { generateUuid } from "../src/index";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateUuid", () => {
  it("should return a valid v4 UUID", () => {
    const uuid = generateUuid();

    expect(uuid).toMatch(UUID_REGEX);
  });

  it("should return a unique value each time", () => {
    const a = generateUuid();
    const b = generateUuid();

    expect(a).not.toBe(b);
  });
});
