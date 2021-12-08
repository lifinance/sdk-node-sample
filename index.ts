import Lifi, { ChainId, ChainKey, CoinKey, Execution, findDefaultCoinOnChain } from '@lifinance/sdk'
import { providers, Wallet } from 'ethers'

async function demo() {
  // setup wallet
  if (!process.env.MNEMONIC) {
    console.warn('Please specify a MNEMONIC phrase in your environment variables: `export MNEMONIC="..."`')
    return
  }
  const provider = new providers.JsonRpcProvider('https://polygon-rpc.com/', 137)
  const wallet = Wallet.fromMnemonic(process.env.MNEMONIC).connect(provider)


  // get Route
  const routeRequest = {
    fromChainId: ChainId.POL, // Polygon
    fromAmount: '1000000', // 1 USDT
    fromTokenAddress: findDefaultCoinOnChain(CoinKey.USDT, ChainKey.POL).id,
    toChainId: ChainId.DAI, // xDai
    toTokenAddress: findDefaultCoinOnChain(CoinKey.USDT, ChainKey.DAI).id,
    options: { 
      slippage: 0.03, // = 3%
      allowSwitchChain: false, // execute all transaction on starting chain
    },
  }

  const routeResponse = await Lifi.getRoutes(routeRequest)
  const route = routeResponse.routes[0]
  console.log({ route })


  // execute Route
  await Lifi.executeRoute(wallet, route, (updatedRoute) => {
    let lastExecution: Execution|undefined = undefined
    for (const step of updatedRoute.steps) {
      if (step.execution) {
        lastExecution = step.execution
      }
    }
    console.log(lastExecution)
  })

  console.log('DONE')
}

demo()
