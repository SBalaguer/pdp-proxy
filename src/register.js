import fs from "fs/promises";

import {
  wnd,
  MultiAddress,
  WestendRuntimeProxyType,
} from "@polkadot-api/descriptors";
import { createClient, Binary } from "polkadot-api";
import { getWsProvider } from "polkadot-api/ws-provider/node";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";

import { PDP_SIGNER } from "../utils/signers.js";

// Connect to the relay chain.
const client = createClient(
  withPolkadotSdkCompat(getWsProvider("wss://westend-rpc.polkadot.io"))
);

// Create API
const wndApi = client.getTypedApi(wnd);

// Helper functions, this can later go to another file
const readBytes = async (path) => {
  try {
    const fileBuffer = await fs.readFile(path);
    const fileBytes = new Uint8Array(fileBuffer);

    console.log(`Read ${fileBytes.length} bytes from ${path}`);
    return fileBytes;
  } catch (err) {
    console.error(`Failed to read file ${path}:`, err.message);
    throw err;
  }
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

const extractEventValues = (events, types) => {
  const typesArray = Array.isArray(types) ? types : [types];

  // Filter the events to include only the specified types
  const filteredEvents = events.filter((event) =>
    typesArray.includes(event.type)
  );

  // Map the filtered events to their values
  return filteredEvents.map((event) => event.value);
};

// Main Function
const doRegister = async (api) => {
  try {
    console.log("Registering Proxy...");
    const proxy = await setProxy(
      api,
      USER_SIGNER,
      process.env.PDP_PUBLIC_ADDRESS
    );
    if (!proxy.ok) throw new Error("Proxy could not bere registered", proxy);
    console.log("Proxy registered ✅");
    console.log("Reserving paraID...");
    const paraID = await reserveParaId(api, process.env.TEST_ANON, PDP_SIGNER);
    if (!paraID.ok) throw new Error("paraID could not be reserved", paraID);
    const id = extractEventValues(paraID.events, "Registrar")[0].value.para_id;
    if (!id) throw new Error("There is no paraID", id);
    console.log("ParaID reserved ✅", id);
    console.log("Parsing wasm and head...");
    const wasmPath = "./test-files/test3.compact.compressed.wasm";
    const headPath = "./test-files/test3.state";
    const wasmBytes = await readBytes(wasmPath);
    const headBytes = await readBytes(headPath);

    if (!wasmBytes) throw new Error("wasm could not be parsed.");
    if (!headBytes) throw new Error("head could not be parsed.");
    console.log("Wasm and Head ready ✅");
    console.log("Registering Parachain...");
    const paraRegistration = await registerParachain(
      api,
      process.env.TEST_ANON,
      PDP_SIGNER,
      wasmBytes,
      headBytes,
      id
    );
    if (!paraRegistration.ok)
      throw new Error("Parachain could not be registered", paraRegistration);
    console.log("Parachain registered ✅");
    console.log("Removing poxy...");
    const proxyRemoval = await removeProxy(
      api,
      process.env.USER_PUBLIC_ADDRESS,
      PDP_SIGNER,
      process.env.PDP_PUBLIC_ADDRESS
    );
    if (!proxyRemoval.ok)
      throw new Error("Proxy could not be removed", proxyRemoval);
    console.log("Proxy removed ✅");
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

//Individual calls
const setProxy = async (api, user, pdp) => {
  const setProxyTx = api.tx.Proxy.add_proxy({
    delegate: MultiAddress.Id(pdp),
    proxy_type: WestendRuntimeProxyType.NonTransfer(),
    delay: 0,
  });

  return await executeTx(setProxyTx, user);
};

const reserveParaId = async (api, user, pdp) => {
  const reserveCall = api.tx.Registrar.reserve();

  const registerParaId = api.tx.Proxy.proxy({
    real: MultiAddress.Id(user),
    call: reserveCall.decodedCall,
  });

  return await executeTx(registerParaId, pdp);
};

const removeProxy = async (api, user, pdp, pdpPublic) => {
  const removeProxyCall = api.tx.Proxy.remove_proxy({
    delegate: MultiAddress.Id(pdpPublic),
    proxy_type: WestendRuntimeProxyType.NonTransfer(),
    delay: 0,
  });

  const proxyRemoveProxy = api.tx.Proxy.proxy({
    real: MultiAddress.Id(user),
    call: removeProxyCall.decodedCall,
  });

  return await executeTx(proxyRemoveProxy, pdp);
};

const deRegisterParachain = async (api, user, pdp, id) => {
  const deRegisterCall = api.tx.Registrar.deregister({ id });

  const deRegisterTx = api.tx.Proxy.proxy({
    real: MultiAddress.Id(user),
    call: deRegisterCall.decodedCall,
  });

  return await executeTx(deRegisterTx, pdp);
};

const registerParachain = async (api, user, pdp, wasm, head, id) => {
  const registerCall = api.tx.Registrar.register({
    id: id,
    genesis_head: Binary.fromBytes(head),
    validation_code: Binary.fromBytes(wasm),
  });

  const registerParachainTx = api.tx.Proxy.proxy({
    real: MultiAddress.Id(user),
    call: registerCall.decodedCall,
  });

  return await executeTx(registerParachainTx, pdp);
};

export default doRegister;
