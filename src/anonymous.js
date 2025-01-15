// This intends to create a sequence to build anonymous proxies for the PDP.
import { wnd, MultiAddress } from "@polkadot-api/descriptors";
import { createClient, Enum } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { PDP_SIGNER } from "../utils/signers.js";
import { extractEventValues } from "../utils/extract-event-values.js";

// First step is to create an anonymous proxy with the PDP account.
// Second step is to fund the anonymous proxy.
// Third step is to create an any proxy to the user account
// Fourth step is to create a ParaRegistration proxy to the PDP account
// Fifth step is to remove the any proxy for the PDP account
// Sixth step is to get the user to sign the transfer of funds to the anon proxy (registration and reservation) and to the PDP ParaRegistration Proxy account.
// Finally, we need to implement on the settings of the webapp: (1) change the owner of the anon proxy (aka chaging the any proxy attached to it); (2) reapping the account.

// Connect to the relay chain.
const client = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://westend-rpc.polkadot.io"))
);

const wndApi = client.getTypedApi(wnd);

const doProxyFlow = async (api) => {
  try {
    //Step (1)
    console.log("Creating the Anonymous Proxy ⏳");
    const anonProxy = await createAnonProxyAccount(api, PDP_SIGNER);
    if (!anonProxy.ok)
      throw new Error("Could not create anonymous proxy ❌", anonProxy);
    const anonProxyAcc = extractEventValues(anonProxy.events, "Proxy")[0].value
      .pure;
    console.log("Anon Proxy Account created ✅");
    console.log("Anon Proxy Account ✏️", anonProxyAcc);
    //Step (2)
    console.log("Transfering initial funds to AnonProxy ⏳");
    const amount = 5;
    const initialFund = await fund(api, anonProxyAcc, amount, PDP_SIGNER);
    if (!initialFund.ok)
      throw new Error("Could not create anonymous proxy ❌", anonProxy);
    console.log(`Transfered ${amount} WND to AnonProxy  ✅`);
    //Steps (3) and (4)
    console.log("Adding Proxies to Anon Proxy ⏳");
    const addProxys = await batchProxy(
      wndApi,
      anonProxyAcc,
      process.env.USER_PUBLIC_ADDRESS_2,
      process.env.PDP_PUBLIC_ADDRESS_2,
      PDP_SIGNER
    );
    if (!addProxys.ok)
      throw new Error("Could not create anonymous proxy ❌", anonProxy);
    console.log("Added Proxies ✅");
    //Step (4)
    console.log("Removing PDP Any Proxy ⏳");
    const removePDPProxy = await removeProxy(
      wndApi,
      anonProxyAcc,
      process.env.PDP_PUBLIC_ADDRESS_2,
      PDP_SIGNER
    );
    if (!removePDPProxy.ok)
      throw new Error("Could not remove PDP Any Proxy ❌", anonProxy);
    console.log("Removed PDP Any Proxy ✅");
  } catch (error) {
    console.error("There was an error, ", error);
    throw error;
  } finally {
    console.log("Process ended sucessfully.");
    process.exit();
  }
};

const createAnonProxyAccount = async (api, signer) => {
  const anonProxyTx = api.tx.Proxy.create_pure({
    proxy_type: Enum("Any"),
    delay: 0,
  });

  return await executeTx(anonProxyTx, signer);
};

const addProxy = (api, type, acc) => {
  return api.tx.Proxy.add_proxy({
    delegate: MultiAddress.Id(acc),
    proxy_type: Enum(type),
    delay: 0,
  });
};

const createProxyTx = (api, real, call) => {
  return api.tx.Proxy.proxy({
    real: MultiAddress.Id(real),
    call: call,
  });
};

const batchProxy = async (api, anon, userPublic, pdpPublic, signer) => {
  const addUserProxyTx = addProxy(api, "Any", userPublic);
  //using NonTransfer until ParaRegistration is live
  const addPDPProxyTx = addProxy(api, "NonTransfer", pdpPublic);

  const callsArray = [
    createProxyTx(api, anon, addUserProxyTx.decodedCall).decodedCall,
    createProxyTx(api, anon, addPDPProxyTx.decodedCall).decodedCall,
  ];
  const batchCall = api.tx.Utility.batch({
    calls: callsArray,
  });
  return await executeTx(batchCall, signer);
};

const removeProxy = async (api, anon, pdpPublic, signer) => {
  const removeProxyCall = api.tx.Proxy.remove_proxy({
    delegate: MultiAddress.Id(pdpPublic),
    proxy_type: Enum("Any"),
    delay: 0,
  });

  const proxyRemoveProxy = createProxyTx(
    api,
    anon,
    removeProxyCall.decodedCall
  );

  return await executeTx(proxyRemoveProxy, signer);
};

const fund = async (api, to, amount, signer) => {
  //TODO: use the right decimals depending on chain
  const transfer = api.tx.Balances.transfer_keep_alive({
    dest: MultiAddress.Id(to),
    value: BigInt(amount * Number(10n ** 12n)),
  });
  return await executeTx(transfer, signer);
};

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

doProxyFlow(wndApi);

// export default doProxyFlow;
