//This is just to query the regions owned by the accounts on this project so that we can add them to the PDP DB manually.

import dotenv from "dotenv";

import { wndCT } from "@polkadot-api/descriptors";
import { createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";

dotenv.config();

// Connect to the relay chain.
const client = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://westend-coretime-rpc.polkadot.io"))
);

// Create API
const wndCTApi = client.getTypedApi(wndCT);

const accountStaging = "5CfP97wzNCKkgHsTpD8geoqnKnNv9DydD1y5yfgqtAeVJzMm";
const accountProd = "5GwvfZEstcAdxqj2mawkWAoMKxzqhXW5G8G6htRCMHg3GkbF";

// Main Function
const main = async () => {
  try {
    const regions = await getRegionsForMultipleAccounts(wndCTApi, [
      accountStaging,
      accountProd,
    ]);
    const parsedRegionsStaging = prepareData(regions[0]);
    const parsedRegionsProd = prepareData(regions[1]);
    console.log("Staging", parsedRegionsStaging);
    console.log("Prod", parsedRegionsProd);
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

const getAllRegions = async (api) => {
  const regions = await api.query.Broker.Regions.getEntries();
  return regions;
};

const getRegionsForAccount = async (api, address) => {
  const regions = await getAllRegions(api);
  if (regions.length) {
    return regions.filter((region) => {
      return region.value.owner === address;
    });
  } else {
    return [];
  }
};

const getRegionsForMultipleAccounts = async (api, addresses) => {
  const regions = [];
  for (const address of addresses) {
    const region = await getRegionsForAccount(api, address);
    regions.push(region);
  }
  return regions;
};

const prepareData = (userRegions) => {
  return userRegions
    .map((item) => {
      const keyArgs = item.keyArgs[0];
      return {
        core: keyArgs.core,
        begin: keyArgs.begin,
        end: item.value.end,
        task: null,
        mask: keyArgs.mask.asHex(),
        owner: item.value.owner,
        status: "Available",
        relay: "Westend",
      };
    })
    .sort((r1, r2) => r1.core - r2.core);
};

main()
  .catch(console.error)
  .finally(() => process.exit());
