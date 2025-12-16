# Encrypted Santa

A Secret Santa application built on Fhenix using Fully Homomorphic Encryption (FHE). Assignments are encrypted on-chain, ensuring no one can see who got whom until the reveal.

## Features

- **FHE-Encrypted Assignments**: Secret Santa pairings are computed and stored encrypted on-chain
- **Password-Protected Games**: Optional password protection using encrypted comparison
- **On-Chain Randomness**: Participant entropy contributes to shuffle randomness
- **Permit-Based Decryption**: Only participants can decrypt their own assignments

## Project Structure

```
packages/
├── hardhat/          # Smart contracts (Solidity + FHE)
└── nextjs/           # Frontend (Next.js + wagmi + cofhejs)
```

## Getting Started

### Prerequisites

- Node.js 18+
- Bun (recommended) or npm

### Installation

```bash
bun install
```

### Environment Setup

Copy the example env files:

```bash
cp packages/hardhat/.env.example packages/hardhat/.env
cp packages/nextjs/.env.example packages/nextjs/.env.local
```

Configure your environment variables:
- `DEPLOYER_PRIVATE_KEY` - Private key for contract deployment
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` - WalletConnect project ID

### Development

Start the frontend:

```bash
cd packages/nextjs
bun dev
```

### Deployment

Deploy contracts to Fhenix Helium testnet:

```bash
cd packages/hardhat
bun hardhat deploy --network testnet
```

## How It Works

1. **Create Game**: Creator sets a name and optional password, providing initial entropy
2. **Join Game**: Players join with password (if required) and contribute entropy
3. **Finalize**: Creator finalizes the game, triggering the encrypted shuffle
4. **Reveal**: Participants decrypt their individual assignments using FHE permits

## Tech Stack

- **Blockchain**: Fhenix (FHE-enabled EVM)
- **Smart Contracts**: Solidity with Fhenix FHE library
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Web3**: wagmi, viem, cofhejs

## License

MIT
