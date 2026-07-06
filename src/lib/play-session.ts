import { customAlphabet } from "nanoid";

const TOKEN_PREFIX = "dfps_";
const TOKEN_RANDOM_PART = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 24);
const TOKEN_PATTERN = /^dfps_[0-9a-z]{24}$/;

export function playSessionStorageKey(challengeCode: string) {
  return `df_play_session_${challengeCode.trim().toUpperCase()}`;
}

export function isValidPlaySessionToken(value: string | null | undefined): value is string {
  return Boolean(value && TOKEN_PATTERN.test(value));
}

export function createPlaySessionToken() {
  return `${TOKEN_PREFIX}${TOKEN_RANDOM_PART()}`;
}

export function getOrCreatePlaySessionToken(challengeCode: string, storage: Storage) {
  const key = playSessionStorageKey(challengeCode);
  const existing = storage.getItem(key);
  if (isValidPlaySessionToken(existing)) return existing;

  const token = createPlaySessionToken();
  storage.setItem(key, token);
  return token;
}
