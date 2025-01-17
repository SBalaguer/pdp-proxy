import dotenv from "dotenv";
dotenv.config();
import { ed25519 } from "@noble/curves/ed25519";
import { getPolkadotSigner } from "polkadot-api/signer";
// Signer Creation
const PDP_SIGNER = getPolkadotSigner(
  ed25519.getPublicKey(process.env.PDP_PRIVATE),
  "Ed25519",
  (call) => ed25519.sign(call, process.env.PDP_PRIVATE)
);

const USER_SIGNER = getPolkadotSigner(
  ed25519.getPublicKey(process.env.USER_PRIVATE),
  "Ed25519",
  (call) => ed25519.sign(call, process.env.USER_PRIVATE)
);

export { PDP_SIGNER, USER_SIGNER };
