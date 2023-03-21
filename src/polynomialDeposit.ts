import { ChainId, ContractCallQuoteRequest, Step } from '@lifi/sdk'
import { ethers } from 'ethers'
import { executeCrossChainQuote, getLifi, getSigner, promptConfirm } from './helpers/helpers'

const getPolynomialQuote = async (fromChain: ChainId, fromToken: string, userAddress: string, amount: string): Promise<Step> => {
  const sETH_OPT = '0xE405de8F52ba7559f9df3C368500B6E6ae6Cee49'
  const POLYNOMIAL_ETHEREUM_CONTRACT_OPT = '0x2D46292cbB3C601c6e2c74C32df3A4FCe99b59C7'
  const POLYNOMIAL_ABI = ['function initiateDeposit(address user, uint amount) external']

  // contract call
  const stakeTx = await new ethers.Contract(
    POLYNOMIAL_ETHEREUM_CONTRACT_OPT, POLYNOMIAL_ABI
  ).populateTransaction.initiateDeposit(userAddress, amount)

  // quote
  const quoteRequest: ContractCallQuoteRequest = {
    fromChain,
    fromToken,
    fromAddress: userAddress,
    toChain: ChainId.OPT,
    toToken: sETH_OPT,
    toAmount: amount,
    toContractAddress: stakeTx.to!,
    toContractCallData: stakeTx.data!,
    toContractGasLimit: '200000',
  }

  return getLifi().getContractCallQuote(quoteRequest)
}

const run = async () => {
  console.log('Polynomial Demo: Deposit sETH on Optimism')

  const fromChain = ChainId.ETH
  const fromToken = ethers.constants.AddressZero

  const signer = await getSigner(fromChain)
  const amount = ethers.utils.parseEther('0.04').toString()

  try {
    // get quote
    const quote = await getPolynomialQuote(fromChain, fromToken, await signer.getAddress(), amount)
    console.log('Quote', quote)

    // continue?
    if (!await promptConfirm('Execute Quote?')) return

    // execute quote
    await executeCrossChainQuote(signer, quote)
  } catch (e) {
    console.error(e)
  }
}

run()