import { createClient } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";

import { chains } from "./../config.js";

const buildApi = (chain, system) => {
  if (system === "relay") {
    const client = createClient(
      withPolkadotSdkCompat(getWsProvider(chains[chain].relay.wss))
    );
    const api = client.getTypedApi(chains[chain].relay.descriptor);
    return api;
  } else if (system === "coretime") {
    const client = createClient(
      withPolkadotSdkCompat(getWsProvider(chains[chain].coretime.wss))
    );
    const api = client.getTypedApi(chains[chain].coretime.descriptor);
    return api;
  }
};

export default buildApi;
