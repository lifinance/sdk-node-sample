import LIFI, { ConfigUpdate, StatusResponse, Step } from '@lifi/sdk'
import { BigNumber, ethers, Signer } from 'ethers'
import * as readline from 'readline'

let lifi: LIFI
export const getLifi = (config?: ConfigUpdate) => {
  if (!lifi) {
    lifi = new LIFI(config)
  }
  return lifi  
}

export const getSigner = async (chainId: number) => {
  if (!process.env.MNEMONIC) {
    throw new Error(
      'Please specify a MNEMONIC phrase in your environment variables: `export MNEMONIC="..."`'
    )
  }

  const provider = await getLifi().getRpcProvider(chainId)
  const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(provider)
  return wallet
}

const executeTransaction = async (wallet: ethers.Signer, transaction: ethers.providers.TransactionRequest) => {
  console.log(transaction)
  const tx = await wallet.sendTransaction(transaction)
  console.log(tx)
  const receipt = await tx.wait()
  console.log(receipt)
  return receipt
}

export const executeCrossChainQuote = async (signer: Signer, quote: Step) => {
  // Approval
  if (quote.action.fromToken.address !== ethers.constants.AddressZero) {
    // check approval
    const approval = await lifi.getTokenApproval(signer, quote.action.fromToken, quote.estimate.approvalAddress)
    if (!approval) {
      throw 'Failed to load approval'
    }

    // set approval
    if (BigNumber.from(approval).lt(quote.action.fromAmount)) {
      await lifi.approveToken({
        signer,
        token: quote.action.fromToken,
        amount: quote.action.fromAmount,
        approvalAddress: quote.estimate.approvalAddress,
      })
    }
  }

  // execute transaction
  const receipt = await executeTransaction(signer, quote.transactionRequest!)

  // wait for execution
  let result: StatusResponse
  do {
    await new Promise((res) => { setTimeout(() => { res(null) }, 5000) })
    result = await lifi.getStatus({
      txHash: receipt.transactionHash,
      bridge: quote.tool,
      fromChain: quote.action.fromChainId,
      toChain: quote.action.toChainId,
    })
    console.log('Status update', result)
  } while (result.status !== 'DONE' && result.status !== 'FAILED')

  console.log('DONE', result)
}

export const promptConfirm = async (msg: string) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })


    rl.question(msg + ' (Y/n)', function (a) {
      const input = a.trim().toLowerCase()
      const confirmed = input === '' || input === 'y'
      resolve(confirmed)
      rl.close()
    })
  })
}

export const promptAsk = async (msg: string, defaultAnswer: string): Promise<string> => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })


    rl.question(msg, function (answer) {
      if (!answer || answer === '') {
        resolve(defaultAnswer)
      } else {
        resolve(answer)
      }
      rl.close()
    })
  })
}

export const promptAskNumber = async (msg: string, defaultAnswer: number): Promise<number> => {
  return parseInt(await promptAsk(msg, defaultAnswer.toString()))
}