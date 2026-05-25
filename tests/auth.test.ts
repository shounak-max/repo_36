import { describe, expect, it } from "vitest";
import { generatePlaintextApiKey, parseApiKeyId } from "@/lib/auth";

describe("API key format", () => {
  it("generates parseable one-time plaintext keys", () => {
    const { id, plaintextKey } = generatePlaintextApiKey();

    expect(plaintextKey.startsWith(`tm_${id}.`)).toBe(true);
    expect(parseApiKeyId(plaintextKey)).toBe(id);
  });

  it("rejects malformed keys", () => {
    expect(parseApiKeyId("not-a-real-key")).toBeNull();
  });
});
