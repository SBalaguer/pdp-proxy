//This is the process by which the PDP team buys a core each cycle, to then interlace it and have it available for users.
//The way this process works is that PDP will listen to the amount of available cores and will buy a core when 2 or less are available.

import dotenv from "dotenv";

import { wndCT, paseoCT } from "@polkadot-api/descriptors";
import { createClient, FixedSizeBinary, Enum } from "polkadot-api";
import { getPolkadotSigner } from "polkadot-api/signer";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { ed25519 } from "@noble/curves/ed25519";

dotenv.config();

// // Connect to the relay chain.
// const client = createClient(
//   withPolkadotSdkCompat(getWsProvider("wss://westend-coretime-rpc.polkadot.io"))
// );

// // Create API
// const wndCTApi = client.getTypedApi(wndCT);

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

const extractEventValues = (events, types) => {
  const typesArray = Array.isArray(types) ? types : [types];

  // Filter the events to include only the specified types
  const filteredEvents = events.filter((event) =>
    typesArray.includes(event.type)
  );

  // Map the filtered events to their values
  return filteredEvents.map((event) => event.value);
};

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

// Main Function
const coretimeActions = async (api, buy, interlace, region, parts) => {
  try {
    let regionInfo;
    if (buy) {
      console.log("Buying a core...");
      //First we buy a core
      const core = await buyCore(api, PDP_SIGNER);
      if (!core.ok) throw new Error("Could not buy a core", core);
      const brokerEvents = extractEventValues(core.events, "Broker");
      regionInfo = brokerEvents[0].value.region_id;
      console.log("Core Bought ✅", {
        ...regionInfo,
        mask: regionInfo.mask.asHex(),
      });
    } else {
      regionInfo = region;
    }
    console.log("interlace", interlace);
    console.log(regionInfo);
    if (interlace) {
      console.log("Starting Interlace...");
      const interlacing = await interlaceRegions(
        api,
        buy
          ? { ...regionInfo, mask: regionInfo.mask.asHex() }
          : { ...regionInfo },
        parts ? parts : 8,
        interlaceTx,
        PDP_SIGNER
      );
      console.log("Cores Interlaced ✅", interlacing);
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

const buyCore = async (api, pdp) => {
  const buyCall = api.tx.Broker.purchase({
    //This price needs to be calculated; However westend currently has 0 as a price.
    price_limit: 1n,
  });
  return await executeTx(buyCall, pdp);
};

const interlaceTx = async (api, region, pivot, pdp) => {
  const interlaceCall = api.tx.Broker.interlace({
    region_id: {
      begin: region.begin,
      core: region.core,
      mask: FixedSizeBinary.fromHex(region.mask),
    },
    pivot: FixedSizeBinary.fromHex(pivot),
  });

  return await executeTx(interlaceCall, pdp);
};

//We will call this function after buying a core to mask it in several parts.
//As we need power of 2 to split this in equal ranges, the closes to 20 parts is 16. That means 1 block every 96s.
const interlaceRegions = async (api, region, parts, call, signer) => {
  //We always need to have a power of 2 number so that we can divide this in equal length regions/
  if (parts < 2 || (parts & (parts - 1)) !== 0) {
    throw new Error("The number of parts must be a power of 2 and >= 2.");
  }

  const divideRecursively = async (
    api,
    regions,
    parts,
    interlaceCall,
    signer
  ) => {
    try {
      if (regions.length === parts) {
        return regions;
      }

      const newRegions = [];
      for (const currentRegion of regions) {
        // calculate the pivot mask for each region.
        const pivotMask = calculatePivotMask(currentRegion.mask);

        // Call to interlace
        const interlaced = await interlaceCall(
          api,
          currentRegion,
          pivotMask,
          signer
        );
        if (!interlaced.ok) throw new Error("Could not interlace", interlaced);
        const [regionOne, regionTwo] = extractEventValues(
          interlaced.events,
          "Broker"
        )[0].value.new_region_ids;
        //Read the returning regions from the event, parse and then push to the array.
        newRegions.push(
          { ...regionOne, mask: regionOne.mask.asHex() },
          { ...regionTwo, mask: regionTwo.mask.asHex() }
        );
      }

      // Keep on doing this until we get to the target amount of regions
      return divideRecursively(api, newRegions, parts, call, signer);
    } catch (error) {
      console.error("An error occurred:", error);
      throw error;
    }
  };
  try {
    return divideRecursively(api, [region], parts, call, signer);
  } catch (error) {
    console.error("An error occured", error);
    throw error;
  }
};

const transferCore = async (api, region, pdp, to) => {
  const transferCall = api.tx.Broker.transfer({
    region_id: { ...region, mask: FixedSizeBinary.fromHex(region.mask) },
    new_owner: to,
  });

  return await executeTx(transferCall, pdp);
};

const assignCore = async (api, region, pdp, task, finality) => {
  const assignCall = api.tx.Broker.assign({
    region_id: { ...region, mask: FixedSizeBinary.fromHex(region.mask) },
    task,
    finality: Enum(finality),
  });

  return await executeTx(assignCall, pdp);
};

//Utitilites: this can go to a separate file afterwards or we could also leverage other libraries.

const calculatePivotMask = (mask) => {
  const binaryMask = maskToBin(mask);
  const firstNonZero = binaryMask.indexOf("1");
  const lastNonZero = binaryMask.lastIndexOf("1");

  if (firstNonZero === -1 || lastNonZero === -1) {
    throw new Error("Mask contains no active bits and cannot be split.");
  }

  // Get the halfway point of the active mask
  const activeRangeEnd =
    firstNonZero + Math.ceil((lastNonZero - firstNonZero + 1) / 2);

  // Calculate the pivot mask: set the first half of the active range to `1`
  const pivotBinary = binaryMask
    .split("")
    .map((bit, index) => {
      if (index >= firstNonZero && index < activeRangeEnd) {
        return "1";
      }
      return "0";
    })
    .join("");

  // Convert back to hexadecimal
  return maskFromBin(pivotBinary);
};

const maskToBin = (mask) => {
  return [...mask.slice(2)] // Skip the `0x` prefix
    .map((hexChar) => parseInt(hexChar, 16).toString(2).padStart(4, "0"))
    .join("");
};

const maskFromBin = (bin) => {
  const hexMask = [];
  for (let i = 0; i < bin.length; i += 4) {
    hexMask.push(parseInt(bin.slice(i, i + 4), 2).toString(16));
  }
  return `0x${hexMask.join("")}`;
};

// main()
//   .catch(console.error)
//   .finally(() => process.exit());

export default coretimeActions;
