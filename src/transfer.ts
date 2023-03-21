import Lifi, {
  ChainId,
  CoinKey,
  ConfigUpdate,
  findDefaultToken,
  Route
} from '@lifi/sdk';
import { providers, Wallet } from 'ethers';
import { promptConfirm } from './helpers/helpers'

const mnemonic = process.env.MNEMONIC || '';


async function demo() {
  // setup wallet
  if (!process.env.MNEMONIC) {
    console.warn(
      'Please specify a MNEMONIC phrase in your environment variables: `export MNEMONIC="..."`'
    );
    return;
  }
  console.log('>> Setup Wallet');
  const provider = new providers.JsonRpcProvider(
    'https://polygon-rpc.com/',
    137
  )
  const wallet = Wallet.fromMnemonic(mnemonic).connect(provider);

  // get Route
  console.log('>> Request route');
  const routeRequest = {
    fromChainId: ChainId.POL, // Polygon
    fromAmount: '1000000', // 1 USDT
    fromTokenAddress: findDefaultToken(CoinKey.USDT, ChainId.POL).address,
    toChainId: ChainId.DAI, // xDai
    toTokenAddress: findDefaultToken(CoinKey.USDT, ChainId.DAI).address,
    options: {
      slippage: 0.03, // = 3%
      allowSwitchChain: false, // execute all transaction on starting chain
      exchanges: {
        allow: [], // only find direct transfers
      },
    },
  };
  
  // STEP 1: Initialize the API

  // ☝️ This configuration is totally optional! ------------------------------------
  const optionalConfigs: ConfigUpdate = {
    apiUrl: 'https://li.quest/v1/', // DEFAULT production endpoint
    rpcs: { // You can provide custom RPCs
      137: ['https://polygon-rpc.com/'] 
    },
    defaultExecutionSettings: { // You can provide default execution settings @see {ExecutionSettings}
      updateCallback: (route: Route): void => {
        console.log('>> Route updated', route)
        console.log('>> Route updated', JSON.stringify(route));
        let lastExecution
        for (const step of route.steps) {
          if (step.execution) {
            lastExecution = step.execution
          }
        }
        console.log(lastExecution);
      },
      switchChainHook: async (requiredChainId: number) => {
        console.log('>>Switching Chains')
        const provider = new providers.JsonRpcProvider(
          'https://rpc.xdaichain.com/',
          requiredChainId
        )
        const wallet = Wallet.fromMnemonic(mnemonic).connect(provider)
        return wallet
      },
      infiniteApproval: false, // DEFAULT false
    } 
  }
  // ---------------------------------------------------------------------------

  const api = new Lifi(optionalConfigs);

  // STEP 2: Request a route
  const routeResponse = await api.getRoutes(routeRequest);
  const route = routeResponse.routes[0];
  console.log('>> Got Route');
  console.log(route);

  // continue?
  if (!await promptConfirm('Execute Route?')) return
  
  // STEP 3: Execute the route
  console.log('>> Start Execution');

  await api.executeRoute(wallet, route);

  console.log('>> Done');
}

demo();
