<div align="center">

<img src="https://img.shields.io/badge/VAULTIS-000000?style=for-the-badge&logoColor=white" height="40"/>

# VAULTIS

### Decentralized Digital Inheritance Protocol

**Your assets. Your rules. Forever secured on-chain.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.x-1C1C1C?style=flat-square&logo=solidity&logoColor=white)](https://soliditylang.org)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=flat-square&logo=ethereum&logoColor=white)](https://sepolia.etherscan.io)
[![ERC-20](https://img.shields.io/badge/Token-LVT%20ERC--20-1A73E8?style=flat-square&logoColor=white)]()
[![AES-256](https://img.shields.io/badge/Encryption-AES--256--GCM-000000?style=flat-square&logoColor=white)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-0D0D0D?style=flat-square&logoColor=white)](LICENSE)

[![Contract](https://img.shields.io/badge/Contract-0x9BD654...3A77-1C1C1C?style=flat-square&logo=ethereum&logoColor=white)](https://sepolia.etherscan.io/address/0x9BD654624D490DeBA2fEF53D959ab27e29373A77)

[Report a Bug](https://github.com/vaibhavi-0320/Vaultis/issues) · [Documentation](./docs)

</div>

---

## Table of Contents

- [What is VAULTIS?](#what-is-vaultis)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Smart Contract](#smart-contract)
- [Deployment](#deployment)
- [API Overview](#api-overview)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## What is VAULTIS?

**VAULTIS** is a digital inheritance platform that solves a problem traditional estate planning was never built for: what happens to your digital assets, accounts, and instructions when you're no longer around to manage them?

It combines an encrypted vault, a periodic "proof of life" check-in, and a trusted-contact confirmation flow into a single **dead man's switch**: as long as you check in, nothing happens. If you stop, your trusted contacts are notified and — once enough of them independently confirm — your vault's contents are released to your designated beneficiaries in staged tranches, with a cryptographic proof of the will's content hash anchored on Ethereum.

## Core Features

### 🔐 Encrypted Vault
Every asset — passwords, crypto wallet notes, documents, private instructions — is encrypted with **AES-256-GCM** before it ever touches the database. Random IV per record, authenticated encryption, no plaintext at rest.

### ⏱ Dead Man's Switch
A background job evaluates check-in recency on a schedule: no activity for 45 days triggers a warning email; 60 days triggers the release sequence and notifies trusted contacts.

### 🗳 Trusted Contact Voting
Contacts confirm your status via a token-gated email link — a unique, single-use token per alert, verified server-side, so the release sequence can't be forged by guessing a URL. Two independent confirmations are required to trigger release.

### 📦 Staged Asset Release
Once triggered, assets release in three tranches over time (day 1 / day 3 / day 7) rather than all at once, giving beneficiaries structured, gradual access.

### 🪙 LVT Token (Legacy Vault Token)
A native ERC-20 token that rewards consistent check-ins (10 LVT per check-in, 24h cooldown) and supports staking for yield within the app.

### 🔗 On-Chain Will Proof
A SHA-256 hash of your encrypted will content can be registered on-chain, giving you a timestamped, tamper-evident proof of what your will said — without ever putting the plaintext on a public ledger.

### 📄 Flexible Document Storage
Encrypted content lives in MongoDB by default, or optionally in AWS S3 (feature-flagged) — either way, only ciphertext ever leaves the application server.

## Architecture

```
                              ┌──────────────┐
                              │     User      │
                              └──────┬───────┘
                                     │
                       ┌─────────────▼─────────────┐
                       │   React Frontend (Vite)    │
                       │   Vercel — static hosting  │
                       └─────────────┬─────────────┘
                                     │ REST / JSON
                       ┌─────────────▼─────────────┐
                       │   Express API (Node.js)    │
                       │  Vercel — serverless funcs  │
                       │  JWT auth · AES-256-GCM ·   │
                       │  rate limiting · validation │
                       └──┬───────────┬───────────┬─┘
                          │           │           │
              ┌───────────▼──┐ ┌──────▼─────┐ ┌───▼────────────┐
              │ MongoDB Atlas │ │  Ethereum   │ │  AWS S3 /       │
              │ (encrypted    │ │  Sepolia    │ │  IPFS (Pinata)  │
              │  vault data)  │ │  (LVT token,│ │  optional doc    │
              │               │ │  will proof)│ │  storage         │
              └───────────────┘ └────────────┘ └─────────────────┘
```

The frontend never talks to MongoDB or the smart contract's write functions directly — every request goes through the Express API, which owns encryption, authentication, and on-chain interaction.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, TanStack Query, React Router |
| Wallet / Web3 | ethers.js v6, MetaMask (browser injected provider) |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT (httpOnly cookies), bcrypt |
| Encryption | AES-256-GCM (Node `crypto`) |
| Smart Contract | Solidity 0.8.x, OpenZeppelin (ERC-20, Ownable), Hardhat |
| Network | Ethereum Sepolia testnet |
| Optional storage | AWS S3, IPFS via Pinata |
| Hosting | Vercel (frontend + backend as two independent projects) |

## Project Structure

```
Vaultis/
├── frontend/           React + Vite client
│   ├── src/pages/       route-level views (Dashboard, Assets, Contacts, Will, Tokens, Security...)
│   ├── src/components/  shared UI (AppShell, Modal, WalletConnectButton...)
│   ├── src/contexts/    Auth, Theme, Toast, Wallet context providers
│   ├── src/hooks/       useLVTToken (on-chain balance/check-in)
│   ├── src/lib/api.js   centralized API client + React Query hooks
│   └── vercel.json      frontend Vercel project config
├── backend/             Express API
│   ├── routes/           auth, assets, contacts, checkin, tokens, will, security, cron...
│   ├── models/            Mongoose schemas
│   ├── services/          encryption, email, blockchain, S3, local dev fallback store
│   ├── middleware/        auth, database-required guard
│   ├── config/             db connection, env validation
│   └── vercel.json        backend Vercel project config
├── blockchain/          Hardhat project for the LVT token
│   ├── contracts/LVTToken.sol
│   ├── scripts/deploy.js
│   └── test/LVTToken.test.js
├── docs/                 deployment, security, and API documentation
└── config/                shared cross-package config
```

## Getting Started

### Prerequisites
```
Node.js >= 18
npm >= 9
MetaMask (with Sepolia testnet configured)
Sepolia ETH (from a faucet, e.g. sepoliafaucet.com)
A MongoDB instance (local, or a free MongoDB Atlas cluster)
```

### Installation
```bash
git clone https://github.com/vaibhavi-0320/Vaultis.git
cd Vaultis

# Installs root, backend, and frontend dependencies
npm run setup

# Copy environment templates
cp .env.example backend/.env
# Fill in MONGODB_URI, JWT_SECRET, ENCRYPTION_KEY at minimum — see
# docs/deployment/ENVIRONMENT_VARIABLES.md for the full reference.

# Run both frontend and backend together
npm run dev
```

Frontend: `http://localhost:5173` · Backend: `http://localhost:5000` (health check at `/api/health`)

Without a configured `MONGODB_URI`, the backend automatically falls back to a local JSON-file store for development — useful for trying the app without setting up MongoDB first. Production refuses to boot without a real database.

## Environment Variables

Full reference, including production/Vercel-specific variables: [`docs/deployment/ENVIRONMENT_VARIABLES.md`](./docs/deployment/ENVIRONMENT_VARIABLES.md).

Minimum required for local development (`backend/.env`):

```env
MONGODB_URI=mongodb://127.0.0.1:27017/vaultis
JWT_SECRET=<openssl rand -base64 32>
ENCRYPTION_KEY=<openssl rand -hex 32>
```

## Smart Contract

`LVTToken.sol` — an ERC-20 with a built-in check-in reward mechanism:

```solidity
checkInAndEarn()                          // caller earns CHECKIN_REWARD (10 LVT), 24h cooldown
canUserCheckIn(address user)              // true if the cooldown has elapsed
getTimeUntilNextCheckIn(address user)     // seconds remaining in the cooldown
mintReward(address to, uint256 amount)    // owner-only, respects MAX_SUPPLY
rewardCheckIn(address to, uint256 amount) // owner-only server-side reward path
// plus standard ERC-20: balanceOf, transfer, totalSupply, approve, transferFrom...
```

| Property | Value |
|---|---|
| Network | Ethereum Sepolia Testnet |
| Contract Address | [`0x9BD654624D490DeBA2fEF53D959ab27e29373A77`](https://sepolia.etherscan.io/address/0x9BD654624D490DeBA2fEF53D959ab27e29373A77) |
| Token Name / Symbol | Legacy Vault Token / LVT |
| Standard | ERC-20 (OpenZeppelin) |
| Reward per check-in | 10 LVT |
| Check-in cooldown | 24 hours |
| Max supply | 1,000,000 LVT |

`blockchain/` is a real Hardhat project. To deploy a fresh instance with your own funded wallet:

```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
```

## Deployment

VAULTIS deploys as **two independent Vercel projects** (frontend + backend), each with its own `vercel.json` and Root Directory setting. Full walkthrough: [`docs/deployment/VERCEL_DEPLOYMENT_GUIDE.md`](./docs/deployment/VERCEL_DEPLOYMENT_GUIDE.md).

```bash
curl https://<your-backend-project>.vercel.app/api/health
```
```json
{ "success": true, "message": "VAULTIS API running", "mongodb": "connected", ... }
```

## API Overview

Full reference: [`docs/api/API_ENDPOINTS.md`](./docs/api/API_ENDPOINTS.md)

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `DELETE /api/auth/account` |
| Vault Assets | `GET/POST/PUT/DELETE /api/assets` |
| Trusted Contacts | `GET/POST/PUT/DELETE /api/contacts`, `GET /api/contacts/vote/:userId/:contactId/:vote` |
| Check-in | `POST /api/checkin`, `POST /api/checkin/save-tx`, `GET /api/checkin/history` |
| Will | `GET/POST /api/will` |
| LVT Token | `GET /api/tokens/balance`, `POST /api/tokens/stake`, `POST /api/tokens/unstake` |
| Security | `GET /api/security/status` |
| Overview | `GET /api/overview/summary` |
| System | `GET /api/health`, `GET /api/cron/run` (protected, scheduled dead-man-switch runner) |

## Security

> ⚠️ VAULTIS is deployed on **Sepolia testnet** and under active development. Do not use it with real assets or real personal data until it has undergone a formal security audit.

- All vault content encrypted with AES-256-GCM before storage — random IV per record, authenticated
- Contact confirmation links are single-use, per-alert tokens verified with a constant-time comparison — not guessable userId/contactId pairs
- Passwords require 12+ characters with mixed case, digit, and symbol; hashed with bcrypt
- JWT stored in an httpOnly, SameSite=Strict cookie
- Server-side allowlisting on all update endpoints (no mass-assignment)
- On-chain check-in rewards are verified against the actual transaction's contract address and confirmation status — never trusted from client input
- Rate limiting on authentication, registration, and general API traffic
- See [`docs/security/`](./docs/security) for the full checklist and audit notes

Found a vulnerability? Please open a private security advisory rather than a public issue.

## Roadmap

```
[✅]  LVT ERC-20 token deployed on Sepolia
[✅]  AES-256-GCM vault encryption
[✅]  Dead man's switch with staged release
[✅]  Trusted contact voting (token-gated)
[✅]  On-chain will proof registration
[✅]  Hardhat deployment tooling
[✅]  Optional AWS S3 document storage
[🔄]  Mainnet deployment
[⏳]  Multi-asset support (ETH, ERC-20s, NFTs)
[⏳]  Mobile-responsive redesign pass
[⏳]  DAO governance via LVT staking
[⏳]  Third-party security audit
```

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change.

```bash
git checkout -b feature/your-feature
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

## License

Distributed under the [MIT License](LICENSE).

---

<div align="center">

**Built by [Vaibhavi Agale](https://github.com/vaibhavi-0320)**
Blockchain Student · SPPU Pune

*VAULTIS — because your legacy deserves better than a forgotten seed phrase.*

</div>
