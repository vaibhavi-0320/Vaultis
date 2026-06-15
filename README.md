<div align="center">

<img src="https://img.shields.io/badge/VAULTIS-000000?style=for-the-badge&logoColor=white" height="40"/>

# VAULTIS
### *Decentralized Digital Inheritance Protocol*

> **Your assets. Your rules. Forever secured on-chain.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.x-1C1C1C?style=for-the-badge&logo=solidity&logoColor=white)](https://soliditylang.org)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)](https://sepolia.etherscan.io)
[![ERC-20](https://img.shields.io/badge/Token-LVT%20ERC--20-1A73E8?style=for-the-badge&logoColor=white)]()
[![AES-256](https://img.shields.io/badge/Encryption-AES--256-000000?style=for-the-badge&logoColor=white)]()
[![License](https://img.shields.io/badge/License-MIT-0D0D0D?style=for-the-badge&logoColor=white)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Live%20on%20Testnet-1A73E8?style=for-the-badge&logoColor=white)]()

<br/>

[![Contract](https://img.shields.io/badge/Contract-0x9BD654...3A77-1C1C1C?style=flat-square&logo=ethereum&logoColor=white)](https://sepolia.etherscan.io/address/0x9BD654624D490DeBA2fEF53D959ab27e29373A77)
[![Etherscan](https://img.shields.io/badge/View%20on-Etherscan-21325B?style=flat-square&logoColor=white)](https://sepolia.etherscan.io/address/0x9BD654624D490DeBA2fEF53D959ab27e29373A77)

</div>

---

## ◈ What is VAULTIS?

**VAULTIS** is a trustless, decentralized digital inheritance protocol built on Ethereum. It solves one of crypto's most overlooked problems — *what happens to your digital assets when you're no longer around?*

Traditional inheritance systems weren't built for digital assets. Banks can't touch your wallet. Lawyers don't understand private keys. Families are left with nothing.

VAULTIS changes that. It lets you lock assets in an on-chain vault, assign trusted contacts, and automatically release them through a **dead man's switch** — no intermediaries, no lawyers, no trust required. Just code.

---

## ◈ The Problem

```
❌  Over $140 billion in crypto is permanently inaccessible due to lost keys or deceased owners
❌  No on-chain inheritance mechanism exists natively on Ethereum
❌  Centralized solutions require trusting third parties with your private keys
❌  Traditional legal systems have zero jurisdiction over decentralized assets
```

---

## ◈ The Solution

```
✅  Trustless vault — assets locked in a smart contract, not on any server
✅  Dead man's switch — auto-triggers release if owner stops checking in
✅  AES-256 encrypted vault data — sensitive information stays private
✅  Multi-contact voting — trusted contacts must collectively approve release
✅  Staged asset release — distribute assets in tranches, not all at once
✅  LVT token — native protocol token for governance and vault operations
```

---

## ◈ Core Features

### 🔐 Encrypted Vault
Every vault is protected with **AES-256 encryption**. Store wallet addresses, seed phrase hints, asset lists, and personal messages — all encrypted before touching the chain.

### ⏱ Dead Man's Switch
The owner must periodically check in. If the check-in window lapses, the protocol interprets it as inactivity and initiates the inheritance release sequence. No single point of failure.

### 🗳 Trusted Contact Voting
Designate multiple trusted contacts. Asset release requires a **multi-party vote** from those contacts — preventing any single person from triggering a malicious claim.

### 📦 Staged Asset Release
Assets aren't dumped all at once. Define a release schedule — tranches released over time — giving beneficiaries structured access while preventing impulsive decisions.

### 🪙 LVT Token (Legacy Vault Token)
The native **ERC-20 token** of the VAULTIS ecosystem. Used for:
- Vault creation and upgrades
- Governance voting on protocol parameters
- Staking for reduced protocol fees

### 🔗 On-Chain Transparency
Every vault action — creation, check-in, vote, release — is recorded on-chain and verifiable via Etherscan. No hidden state. No backend magic.

---

## ◈ Contract Details

| Property | Value |
|---|---|
| **Network** | Ethereum Sepolia Testnet |
| **Contract Address** | `0x9BD654624D490DeBA2fEF53D959ab27e29373A77` |
| **Token Name** | Legacy Vault Token |
| **Token Symbol** | LVT |
| **Token Standard** | ERC-20 |
| **Encryption** | AES-256 |
| **Explorer** | [View on Etherscan ↗](https://sepolia.etherscan.io/address/0x9BD654624D490DeBA2fEF53D959ab27e29373A77) |

---

## ◈ Tech Stack

```
┌─────────────────────────────────────────────────────┐
│                    VAULTIS STACK                    │
├─────────────────────────────────────────────────────┤
│  Smart Contracts    Solidity 0.8.x                  │
│  Token Standard     ERC-20 (LVT)                    │
│  Network            Ethereum Sepolia                │
│  Encryption         AES-256                         │
│  Database           MongoDB Atlas                   │
│  Frontend           React + Vite                    │
│  Deployment         Vercel                          │
│  Dev Tools          Hardhat / Remix IDE             │
└─────────────────────────────────────────────────────┘
```

[![Solidity](https://img.shields.io/badge/Solidity-1C1C1C?style=flat-square&logo=solidity&logoColor=white)](https://soliditylang.org)
[![React](https://img.shields.io/badge/React-0D0D0D?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-0D0D0D?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-000000?style=flat-square&logo=mongodb&logoColor=47A248)](https://mongodb.com)
[![Hardhat](https://img.shields.io/badge/Hardhat-1C1C1C?style=flat-square&logoColor=white)](https://hardhat.org)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

---

## ◈ Architecture

```
                         ┌─────────────┐
                         │    USER     │
                         └──────┬──────┘
                                │
                    ┌───────────▼───────────┐
                    │    React Frontend      │
                    │  (Vite + Tailwind)     │
                    └───────────┬───────────┘
                                │
               ┌────────────────┼────────────────┐
               │                │                │
    ┌──────────▼──────┐ ┌───────▼──────┐ ┌──────▼──────────┐
    │  VAULTIS Core   │ │  LVT Token   │ │  MongoDB Atlas  │
    │  Smart Contract │ │  ERC-20      │ │  (Encrypted     │
    │  (Sepolia)      │ │  Contract    │ │   Vault Data)   │
    └──────────┬──────┘ └───────┬──────┘ └─────────────────┘
               │                │
    ┌──────────▼────────────────▼──────┐
    │         Ethereum Sepolia          │
    │           (Testnet)               │
    └──────────────────────────────────┘
```

---

## ◈ How It Works

```
STEP 1 — CREATE VAULT
  Owner connects wallet → deploys personal vault → sets check-in period

STEP 2 — CONFIGURE INHERITANCE
  Owner assigns trusted contacts → encrypts asset details with AES-256
  → defines release schedule (tranches) → deposits LVT tokens

STEP 3 — STAY ACTIVE
  Owner checks in periodically → resets dead man's switch timer
  → vault remains locked as long as owner is active

STEP 4 — TRIGGER (if needed)
  Check-in window lapses → trusted contacts notified
  → voting round begins → quorum reached → staged release begins

STEP 5 — ASSET RELEASE
  Smart contract releases assets in defined tranches
  → all actions logged on-chain → full transparency on Etherscan
```

---

## ◈ Getting Started

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
MetaMask (with Sepolia testnet configured)
Sepolia ETH (from faucet)
```

### Installation
```bash
# Clone the repository
git clone https://github.com/vaibhavi-0320/vaultis.git
cd vaultis

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your values:
# VITE_CONTRACT_ADDRESS=0x9BD654624D490DeBA2fEF53D959ab27e29373A77
# VITE_MONGODB_URI=your_mongodb_connection_string
# VITE_ENCRYPTION_KEY=your_aes_key

# Run development server
npm run dev
```

### Connect to Sepolia
1. Open MetaMask → Add Network → Sepolia Testnet
2. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com)
3. Import LVT token: `0x9BD654624D490DeBA2fEF53D959ab27e29373A77`

---

## ◈ Smart Contract Functions

```solidity
// Core vault operations
createVault(uint256 _checkinPeriod, address[] _trustedContacts)
checkIn()                          // Reset dead man's switch
addBeneficiary(address _beneficiary, uint256 _share)
setReleaseSchedule(uint256[] _tranches, uint256[] _timestamps)

// Trusted contact actions
voteForRelease(uint256 _vaultId)   // Cast approval vote
claimAssets(uint256 _vaultId)      // Beneficiary claims tranche

// LVT Token
deposit(uint256 _amount)           // Deposit LVT into vault
withdrawLVT(uint256 _amount)       // Emergency owner withdrawal
```

---

## ◈ Roadmap

```
[✅]  Smart contract deployed on Sepolia
[✅]  LVT ERC-20 token live
[✅]  AES-256 vault encryption
[✅]  Dead man's switch mechanism
[✅]  Trusted contact voting
[✅]  Staged asset release
[✅]  MongoDB integration
[🔄]  Frontend UI polish
[🔄]  Mainnet deployment
[⏳]  Multi-asset support (ETH, ERC-20s, NFTs)
[⏳]  Mobile-responsive redesign
[⏳]  DAO governance via LVT staking
[⏳]  ZK-proof based privacy layer
[⏳]  Cross-chain vault support
```

---

## ◈ Security

> ⚠️ VAULTIS is currently deployed on **Sepolia Testnet** and is under active development. Do not use with real mainnet assets until a full security audit is complete.

- All vault data encrypted with AES-256 before storage
- Multi-party voting prevents single-point-of-failure attacks
- Time-locked releases prevent impulsive or malicious claims
- Smart contract source verifiable on Etherscan
- No admin keys — fully trustless post-deployment

---

## ◈ Contributing

Pull requests are welcome. For major changes, open an issue first.

```bash
git checkout -b feature/your-feature
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

---

## ◈ Built By

<div align="center">

**Vaibhavi Agale**
*Blockchain Student · SPPU Pune · Building Onchain*

[![GitHub](https://img.shields.io/badge/GitHub-vaibhavi--0320-000000?style=flat-square&logo=github&logoColor=white)](https://github.com/vaibhavi-0320)

</div>

---

<div align="center">

*VAULTIS — Because your legacy deserves better than a forgotten seed phrase.*

[![MIT License](https://img.shields.io/badge/License-MIT-000000?style=flat-square)](LICENSE)
[![Sepolia](https://img.shields.io/badge/Network-Sepolia-1C1C1C?style=flat-square&logo=ethereum&logoColor=white)](https://sepolia.etherscan.io)
[![ERC20](https://img.shields.io/badge/Token-LVT-1A73E8?style=flat-square&logoColor=white)]()

</div>
