# LI.FI SDK - Node Demo

Demo scripts using the LI.FI SDK and API.

## Setup

Select node version (optional):
```sh
nvm use
```

Install dependencies:
```sh
yarn
```

Configure wallet used to sign transactions:
```bash
export MNEMONIC="..."
```


## Simple Bridging

The demo of [our SDK](https://github.com/lifinance/sdk) executes a simple cross chain transfer of 1 USDT from Polygon to xDai using the best bridge it can find.

It needs access to an actual wallet and makes real transactions on chain.

1. Execute the script from the source folder.
```bash
ts-node src/transfer.ts
```

2. Sit back, relax and watch the show.
First a route is searched and the script prints out what it found. The property `toAmount` will tell you how much USDT will end up on xDAI.
 Then the SDK will execute all necessary steps to do the transfer (approval, send Transaction, wait the bridge, claim, ... ). It prints out status updates for each of these steps


## Contract Call Demos

Execute them using:
```sh
ts-node src/[SCRIPT].ts
```

Available `[SCRIPT]`:

- `polynomialDeposit`
