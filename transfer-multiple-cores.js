//This is the process by which the PDP team buys a core each cycle, to then interlace it and have it available for users.
//The way this process works is that PDP will listen to the amount of available cores and will buy a core when 2 or less are available.

//TODO: Redo this logic for it to be a batch call

import dotenv from "dotenv";

import { wndCT } from "@polkadot-api/descriptors";
import { createClient, FixedSizeBinary, Enum } from "polkadot-api";
import { getPolkadotSigner } from "polkadot-api/signer";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { ed25519 } from "@noble/curves/ed25519";
import { data } from "./cores.js";
dotenv.config();

const coresToTransferStaging = data.staging;
const coresToTransferProd = data.prod;

const accountStaging = "5CfP97wzNCKkgHsTpD8geoqnKnNv9DydD1y5yfgqtAeVJzMm";
const accountProd = "5GwvfZEstcAdxqj2mawkWAoMKxzqhXW5G8G6htRCMHg3GkbF";

// Connect to the relay chain.
const client = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://westend-coretime-rpc.polkadot.io"))
);

// Create API
const wndCTApi = client.getTypedApi(wndCT);

// Helper functions, this can later go to another file
const executeTx = async (tx, signer) => {
  try {
    const result = await tx.signAndSubmit(signer);
    if (result.ok) {
      return result;
    } else {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    throw error;
  }
};

// Signer Creation
const PDP_SIGNER = getPolkadotSigner(
  ed25519.getPublicKey(process.env.PDP_PRIVATE_2),
  "Ed25519",
  (call) => ed25519.sign(call, process.env.PDP_PRIVATE_2)
);

// Main Function
const main = async () => {
  try {
    await transferMultiple(
      wndCTApi,
      coresToTransferStaging,
      PDP_SIGNER,
      accountStaging
    );
    await transferMultiple(
      wndCTApi,
      coresToTransferProd,
      PDP_SIGNER,
      accountProd
    );
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

const transferMultiple = async (api, cores, signer, to) => {
  console.log(`Started bulk transfer to ${to}...`);
  const callsArray = cores.map((core) =>
    transferCore(
      api,
      { core: core.core, mask: core.mask, begin: core.begin },
      to
    )
  );

  const coreTansfers = await batchTransfer(api, callsArray, signer);
  if (!coreTansfers.ok) {
    throw new Error(`Cores couldn't be send in batch`, transfered);
  }

  console.log(`Cores transfered in batch ✅`);
  console.log(`Finished bulk transfer to ${to}.`);
};

const transferCore = (api, region, to) => {
  const builtCall = api.tx.Broker.transfer({
    region_id: { ...region, mask: FixedSizeBinary.fromHex(region.mask) },
    new_owner: to,
  });
  const decodedCall = builtCall.decodedCall;
  return decodedCall;
};

const batchTransfer = async (api, callsArray, pdp) => {
  const batchCall = api.tx.Utility.force_batch({
    calls: callsArray,
  });
  return await executeTx(batchCall, pdp);
};

main()
  .catch(console.error)
  .finally(() => process.exit());
