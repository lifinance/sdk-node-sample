import Lifi, {
  ChainId,
  CoinKey,
  Execution,
  ExecutionSettings,
  findDefaultToken,
} from "@lifinance/sdk";
import { providers, Wallet } from "ethers";

const mnemonic = process.env.MNEMONIC || "";

async function demo() {
  // setup wallet
  if (!process.env.MNEMONIC) {
    console.warn(
      'Please specify a MNEMONIC phrase in your environment variables: `export MNEMONIC="..."`'
    );
    return;
  }
  console.log(">> Setup Wallet");
  const provider = new providers.JsonRpcProvider(
    "https://polygon-rpc.com/",
    137
  );
  const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

  // get Route
  console.log(">> Request route");
  const routeRequest = {
    fromChainId: ChainId.POL, // Polygon
    fromAmount: "1000000", // 1 USDT
    fromTokenAddress: findDefaultToken(CoinKey.USDT, ChainId.POL).address,
    toChainId: ChainId.DAI, // xDai
    toTokenAddress: findDefaultToken(CoinKey.USDT, ChainId.DAI).address,
    options: {
      slippage: 0.03, // = 3%
      allowSwitchChain: false, // execute all transaction on starting chain
    },
  };
  const routeResponse = await Lifi.getRoutes(routeRequest);
  const route = routeResponse.routes[0];
  console.log(">> Got Route");
  console.log(route);

  // execute Route
  console.log(">> Start Execution");
  const settings: ExecutionSettings = {
    updateCallback: (updatedRoute) => {
      let lastExecution: Execution | undefined = undefined;
      for (const step of updatedRoute.steps) {
        if (step.execution) {
          lastExecution = step.execution;
        }
      }
      console.log(lastExecution);
    },
    switchChainHook: async (requiredChainId: number) => {
      console.log(">>Switching Chains");
      const provider = new providers.JsonRpcProvider(
        "https://rpc.xdaichain.com/",
        requiredChainId
      );
      const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);
      return wallet;
    },
  };
  await Lifi.executeRoute(wallet, route, settings);

  console.log(">> Done");
}

demo();
