import dotenv from "dotenv";

import { wnd, MultiAddress } from "@polkadot-api/descriptors";
import { createClient } from "polkadot-api";
import { getPolkadotSigner } from "polkadot-api/signer";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { ed25519 } from "@noble/curves/ed25519";

dotenv.config();

// Connect to the relay chain.
const client = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://westend-rpc.polkadot.io"))
);

//crear la private key con randon de ed255..

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

//Test pair works

// const msg = new TextEncoder().encode("hello");
// const sig = ed25519.sign(msg, process.env.PDP_PRIVATE_2);
// console.log(ed25519.verify(sig, msg, process.env.PDP_PUBLIC_2));

// const msg2 = new TextEncoder().encode("hello2");
// const sig2 = ed25519.sign(msg2, process.env.USER_PRIVATE_2);
// console.log(ed25519.verify(sig2, msg2, process.env.USER_PUBLIC_2));

// const PDP_PUBLIC = process.env.PDP_PUBLIC;
// const PDP_MULTI = process.env.PDP_PUBLIC_ADDRESS;
// const USER_PUBLIC = process.env.USER_PUBLIC;

const wndApi = client.getTypedApi(wnd);

const testTransfer = (api, user, pdp) => {
  const transfer = api.tx.Balances.transfer_allow_death({
    dest: MultiAddress.Id(user),
    value: 10n ** 10n,
  });

  transfer.signSubmitAndWatch(pdp).subscribe({
    next: (event) => {
      console.log("Tx event: ", event.type);
      if (event.type === "txBestBlocksState") {
        console.log("The tx is now in a best block, check it out:");
        console.log(`https://westend.subscan.io/extrinsic/${event.txHash}`);
      }
    },
    error: console.error,
    complete() {
      console.log("Complete!");
    },
  });
};

testTransfer(wndApi, process.env.USER_PUBLIC_ADDRESS, PDP_SIGNER);
