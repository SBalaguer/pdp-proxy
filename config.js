import { wndCT, paseoCT, wnd } from "@polkadot-api/descriptors";

export const chains = {
  Polkadot: {
    relay: { wss: "", descriptor: null },
    coretime: {
      wss: "",
      descriptor: null,
    },
  },
  Kusama: {
    relay: {
      wss: "",
      descriptor: null,
    },
    coretime: {
      wss: "",
      descriptor: null,
    },
  },
  Westend: {
    relay: {
      wss: "wss://westend-rpc.polkadot.io",
      descriptor: wnd,
    },
    coretime: {
      wss: "wss://westend-coretime-rpc.polkadot.io",
      descriptor: wndCT,
    },
  },
  Paseo: {
    relay: {
      wss: "wss://rpc.ibp.network/paseo",
      descriptor: null,
    },
    coretime: {
      wss: "wss://sys.ibp.network/coretime-paseo",
      descriptor: paseoCT,
    },
  },
};
