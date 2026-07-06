import { describe, expect, it } from "vitest";
import {
  getOrCreatePlaySessionToken,
  isValidPlaySessionToken,
  playSessionStorageKey,
} from "../src/lib/play-session";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("play session tokens", () => {
  it("creates a valid token for a challenge", () => {
    const storage = new MemoryStorage();
    const token = getOrCreatePlaySessionToken("abc123", storage);

    expect(isValidPlaySessionToken(token)).toBe(true);
    expect(storage.getItem(playSessionStorageKey("ABC123"))).toBe(token);
  });

  it("reuses the same token across refreshes in one browser", () => {
    const storage = new MemoryStorage();
    const first = getOrCreatePlaySessionToken("abc123", storage);
    const second = getOrCreatePlaySessionToken("abc123", storage);

    expect(second).toBe(first);
  });

  it("creates separate tokens for separate browser storage", () => {
    const first = getOrCreatePlaySessionToken("abc123", new MemoryStorage());
    const second = getOrCreatePlaySessionToken("abc123", new MemoryStorage());

    expect(first).not.toBe(second);
  });

  it("replaces missing or malformed tokens", () => {
    const storage = new MemoryStorage();
    storage.setItem(playSessionStorageKey("abc123"), "not-a-valid-token");

    const token = getOrCreatePlaySessionToken("abc123", storage);

    expect(token).not.toBe("not-a-valid-token");
    expect(isValidPlaySessionToken(token)).toBe(true);
  });
});
