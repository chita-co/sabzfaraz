import crypto from "node:crypto";
import fs from "node:fs";

const KEY_FILE = "./torob-test-key.json";

let publicKeyPem, privateKeyPem;

if (!fs.existsSync(KEY_FILE)) {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  fs.writeFileSync(KEY_FILE, JSON.stringify({ publicKeyPem, privateKeyPem }, null, 2));

  console.log("یه کلید تستی ساخته شد و توی torob-test-key.json ذخیره شد.\n");
  console.log("این خط رو توی .env.local بذار، سرور dev رو ری‌استارت کن، بعد دوباره همین اسکریپت رو اجرا کن:\n");
  console.log(`TOROB_PUBLIC_KEY_PEM="${publicKeyPem.trim().replace(/\n/g, "\\n")}"`);
  process.exit(0);
}

({ publicKeyPem, privateKeyPem } = JSON.parse(fs.readFileSync(KEY_FILE, "utf8")));
const privateKey = crypto.createPrivateKey({ key: privateKeyPem, format: "pem" });

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const host = process.argv[2] || "localhost:3000";
const header = { alg: "EdDSA", typ: "JWT", v: 1 };
const now = Math.floor(Date.now() / 1000);
const payload = { aud: host, exp: now + 300, nbf: now - 10 };

const headerB64 = base64url(Buffer.from(JSON.stringify(header)));
const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
const signingInput = `${headerB64}.${payloadB64}`;
const signature = crypto.sign(null, Buffer.from(signingInput), privateKey);
const token = `${signingInput}.${base64url(signature)}`;

console.log("=== توکن تستی (۵ دقیقه اعتبار) ===\n");
console.log(token);
console.log("\n=== دستور curl آماده (کپی و اجرا کن) ===\n");
console.log(
  `curl -s -H "X-Torob-Token: ${token}" -H "X-Torob-Token-Version: 1" "http://${host}/api/torob/v1/orders?purchase_timestamp_gt=2020-01-01T00:00:00.000000Z&limit=10"`
);