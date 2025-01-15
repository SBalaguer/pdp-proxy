import dotenv from "dotenv";
dotenv.config();
import { ed25519 } from "@noble/curves/ed25519";
import { getPolkadotSigner } from "polkadot-api/signer";
// Signer Creation
const PDP_SIGNER = getPolkadotSigner(
  ed25519.getPublicKey(process.env.PDP_PRIVATE_2),
  "Ed25519",
  (call) => ed25519.sign(call, process.env.PDP_PRIVATE_2)
);

const USER_SIGNER = getPolkadotSigner(
  ed25519.getPublicKey(process.env.USER_PRIVATE_2),
  "Ed25519",
  (call) => ed25519.sign(call, process.env.USER_PRIVATE_2)
);

const PDP_SIGNER_2 = getPolkadotSigner(
  ed25519.getPublicKey(process.env.PDP_PRIVATE_3),
  "Ed25519",
  (call) => ed25519.sign(call, process.env.PDP_PRIVATE_3)
);

export { PDP_SIGNER, USER_SIGNER, PDP_SIGNER_2 };
