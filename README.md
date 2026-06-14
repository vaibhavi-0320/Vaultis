# VAULTIS

VAULTIS is a Web3 inheritance platform for encrypted digital vaulting, beneficiary release orchestration, and blockchain proof registration. This workspace contains:

- `frontend/`: React + Vite client for the vault console
- `backend/`: Express API with MongoDB persistence, AES-256-GCM encryption, workflow logging, and security monitoring
- `frontend/src/contracts/`: deployed LVT contract ABI, Solidity backup, and Remix redeploy guide

## Local Setup

1. Install dependencies:
   ```bash
   npm run setup
   ```
2. Copy the environment template:
   ```bash
   cp .env.example backend/.env
   ```
3. Fill in MongoDB, JWT, encryption, Sepolia, and optional Pinata credentials.
4. Start the app:
   ```bash
   npm run dev
   ```

Frontend runs on `http://localhost:5173` by default. Backend runs on `http://localhost:5000`.

## Core Capabilities

- Encrypted vault assets with trust scoring, risk indicators, beneficiary assignment, and optional IPFS pinning
- Dead-man switch heartbeat workflow with warning, trigger, and staged release automation
- Trusted contact management with weighted verification context
- Encrypted will storage with SHA-256 hashing and optional blockchain proof registration
- Zero-trust security panel showing wallet status, vault health, blockchain sync, and IPFS readiness

## Key API Areas

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET /api/overview/summary`
- `GET/POST /api/will`
- `GET /api/security/status`
- `GET/POST/PUT/DELETE /api/assets`
- `GET/POST/DELETE /api/contacts`
- `POST /api/checkin`

## Contracts

- `frontend/src/contracts/LVTToken.json`: live deployed ABI used by the app
- `frontend/src/contracts/LVTToken.sol`: Solidity source backup for Remix
- `frontend/src/contracts/REMIX_DEPLOY_GUIDE.txt`: redeploy checklist for Sepolia

## Vercel Notes

- `frontend/vercel.json` adds SPA rewrites so refreshes and direct route visits do not break.
- Set `VITE_API_URL` in the Vercel frontend project to your deployed API base URL.
- If you want a single-domain production deployment, proxy the backend through your hosting layer or migrate the API into serverless routes.
