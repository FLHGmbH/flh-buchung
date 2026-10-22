process.env.ALTCHA_HMAC_KEY = "check-altcha-hmac-key";
process.env.NODE_ENV = "production";
delete process.env.VERCEL;

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const { solveChallenge } = await import("altcha-lib");
const { deriveKey } = await import("altcha-lib/algorithms/pbkdf2");
const { altchaOk, altchaReady, newChallenge } = await import("./altcha.ts");

assert(altchaReady(), "configured");
assert(!(await altchaOk("")), "empty");
assert(!(await altchaOk("not-a-payload")), "garbage");

const made = await newChallenge();
assert(made?.signature && made.parameters.nonce, "challenge");
const solution = await solveChallenge({ challenge: made, deriveKey });
assert(solution, "solved");
const payload = btoa(JSON.stringify({
  challenge: { parameters: made.parameters, signature: made.signature },
  solution,
}));
assert(await altchaOk(payload), "verified");
assert(!(await altchaOk(payload)), "replay");

const again = await newChallenge();
assert(again, "second challenge");
const solved = await solveChallenge({ challenge: again, deriveKey });
assert(solved, "second solve");
const flipped = solved.derivedKey.replace(/^../, solved.derivedKey.startsWith("00") ? "ff" : "00");
const bad = btoa(JSON.stringify({
  challenge: { parameters: again.parameters, signature: again.signature },
  solution: { ...solved, derivedKey: flipped },
}));
assert(!(await altchaOk(bad)), "tampered key");

console.log("altcha.check ok");
