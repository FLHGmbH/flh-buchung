import { createChallenge } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";
import { CappedMap, create, deriveHmacKeySecret, randomInt } from "altcha-lib/frameworks/hono";

function hmacSecret() {
  const set = process.env.ALTCHA_HMAC_KEY?.trim() ?? "";
  if (set.length >= 16) return set;
  if (process.env.VERCEL || process.env.NODE_ENV === "production") return "";
  return "dev-altcha-hmac-key";
}

const secret = hmacSecret();
const keySecret = secret ? await deriveHmacKeySecret(secret) : "";

// ponytail: process-local replay store. A second Vercel instance can accept the same payload once. Move the store to Redis if that shows up.
const store = new CappedMap<string, boolean>({ maxSize: 1_000 });
const altcha = secret
  ? create({
      hmacSignatureSecret: secret,
      hmacKeySignatureSecret: keySecret,
      deriveKey,
      store,
    })
  : null;

function challengeOptions() {
  return {
    algorithm: "PBKDF2/SHA-256" as const,
    // cost 2000 and a counter under 4000 finishes in about a second on a phone. The library sample (5000 × 10000) stalls the form.
    cost: 2_000,
    counter: randomInt(4_000, 2_000),
    expiresAt: new Date(Date.now() + 20 * 60_000),
  };
}

export function altchaReady() {
  return altcha != null;
}

export async function newChallenge() {
  if (!secret) return null;
  return createChallenge({
    deriveKey,
    hmacSignatureSecret: secret,
    hmacKeySignatureSecret: keySecret,
    ...challengeOptions(),
  });
}

export async function altchaOk(payload: unknown) {
  if (!altcha) return false;
  if (typeof payload !== "string" || payload.length < 20 || payload.length > 16_384) return false;
  try {
    const result = await altcha.verify(payload, deriveKey, secret, keySecret, store);
    return result.verification?.verified === true;
  } catch {
    return false;
  }
}
