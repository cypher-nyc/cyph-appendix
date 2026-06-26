/* ═══ cyph-appendix — content encryptor ═══
   Reads the plaintext slide source, encrypts it with AES-256-GCM under a
   key derived from your password (PBKDF2-SHA256), and writes payload.enc.json
   — the ONLY content artifact that gets committed/deployed. The plaintext
   (content/) is gitignored and never leaves your machine.

   Usage:
     APPENDIX_PASSWORD='your-password' npm run build
     # or
     node build/encrypt.mjs --password 'your-password'
     node build/encrypt.mjs            # prompts on stdin if no password given

   The browser (gate.js) mirrors these exact parameters to decrypt. If you
   change KDF_ITERATIONS / hash here, change them there too (or just bump V). */

import { webcrypto as crypto } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "content", "slides.html");
const OUT = join(ROOT, "payload.enc.json");

const V = 1;
const KDF_ITERATIONS = 250000;
const KDF_HASH = "SHA-256";

function b64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

async function getPassword() {
  const argIdx = process.argv.indexOf("--password");
  if (argIdx !== -1 && process.argv[argIdx + 1]) return process.argv[argIdx + 1];
  if (process.env.APPENDIX_PASSWORD) return process.env.APPENDIX_PASSWORD;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((res) =>
    rl.question("password to encrypt with: ", res)
  );
  rl.close();
  return answer;
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: KDF_ITERATIONS, hash: KDF_HASH },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
}

async function main() {
  const password = (await getPassword()).trim();
  if (!password) {
    console.error("✗ no password provided — aborting.");
    process.exit(1);
  }

  let plaintext;
  try {
    plaintext = await readFile(SRC, "utf8");
  } catch {
    console.error(`✗ could not read ${SRC}\n  create content/slides.html first.`);
    process.exit(1);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  const payload = {
    v: V,
    kdf: "PBKDF2",
    hash: KDF_HASH,
    iter: KDF_ITERATIONS,
    salt: b64(salt),
    iv: b64(iv),
    ct: b64(new Uint8Array(ct)),
  };

  await writeFile(OUT, JSON.stringify(payload), "utf8");
  const kb = (Buffer.byteLength(payload.ct, "utf8") / 1024).toFixed(1);
  console.log(`✓ encrypted ${SRC.split("/").slice(-2).join("/")} → payload.enc.json (${kb} KB ciphertext)`);
  console.log("  commit payload.enc.json; content/ stays local (gitignored).");
}

main();
