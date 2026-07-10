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
- `blockchain/`: the real Hardhat project for the LVT token — `npm install && npx hardhat compile && npx hardhat test` to build/test locally, `npx hardhat run scripts/deploy.js --network sepolia` to deploy a fresh instance with your own funded wallet (see `blockchain/.env.example`). A successful deploy run updates `frontend/src/contracts/LVTToken.json` automatically.
- `frontend/src/contracts/REMIX_DEPLOY_GUIDE.txt`: legacy manual Remix redeploy steps, kept as a fallback if you'd rather not use Hardhat.

## AWS S3 Document Storage (optional)

By default, encrypted will/asset content is stored inline in MongoDB. To store it in S3 instead (only the AES-256-GCM ciphertext ever leaves the server — S3 never sees plaintext):

1. Create an S3 bucket and an IAM user/role with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` scoped to that bucket.
2. In `backend/.env`, set `AWS_S3_ENABLED=true` and fill in `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`.
3. Restart the backend. New wills saved via `POST /api/will` will be written to S3; existing MongoDB-stored wills keep working unchanged (read path checks each document's `storageProvider`).

## Vercel Notes

- `frontend/vercel.json` adds SPA rewrites so refreshes and direct route visits do not break.
- Set `VITE_API_URL` in the Vercel frontend project to your deployed API base URL.
- If you want a single-domain production deployment, proxy the backend through your hosting layer or migrate the API into serverless routes.
