import sdk from '@lifinance/sdk'
import ethers from 'ethers'

const Lifi = sdk.default

async function demo() {
  // setup wallet
  if (!process.env.MNEMONIC) {
    console.warn('Please specify a MNEMONIC phrase in your environment variables: `export MNEMONIC="..."`')
    return
  }
  const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com/', 137)
  const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(provider)


  // get Route
  const routeRequest = {
    fromChainId: 137, // Polygon
    fromAmount: '1000000', // 1 USDT
    fromTokenAddress: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT
    toChainId: 100, // xDai
    toTokenAddress: '0x4ecaba5870353805a9f068101a40e0f32ed605c6', // USDT
    options: { slippage: 0.03 },
  }

  const routeResponse = await Lifi.getRoutes(routeRequest)
  const route = routeResponse.routes[0]
  console.log({ route })


  // execute Route
  await Lifi.executeRoute(wallet, route, (updatedRoute) => {
    let lastExecution
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
