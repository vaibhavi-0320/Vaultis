# Environment Variables Reference

VAULTIS deploys as two separate Vercel projects. Set backend variables on the **backend** project and frontend variables (prefixed `VITE_`) on the **frontend** project — they're separate Vercel dashboards with separate env var settings.

## Backend project (`backend/` Root Directory)

### Server
- `NODE_ENV` — `production` (Vercel sets this automatically; safe to leave unset)
- `PORT` — leave unset (Vercel assigns it; only used for local dev)

### Database
- `MONGODB_URI` — **required in production.** MongoDB Atlas connection string: `mongodb+srv://user:pass@cluster.mongodb.net/vaultis?retryWrites=true&w=majority`

### Auth & encryption
- `JWT_SECRET` — **required.** 32+ random characters. Generate: `openssl rand -base64 32`
- `JWT_EXPIRES_IN` — default `7d`
- `ENCRYPTION_KEY` — **required.** Used to derive an AES-256 key for encrypting vault/will content. Generate: `openssl rand -hex 32`. The app refuses to boot with a missing or placeholder value — there is no fallback key.

### CORS / URLs
- `FRONTEND_URL` — **required.** Exact URL of the deployed frontend project, used for CORS.
- `BACKEND_URL` — this backend's own public URL, used to build links in emails (e.g. trusted-contact confirmation links) that hit backend API routes directly.

### Blockchain (Sepolia testnet)
- `SEPOLIA_RPC_URL` — **required.** e.g. `https://ethereum-sepolia-rpc.publicnode.com`
- `ETHERSCAN_API_KEY` — **strongly recommended.** Without it, on-chain check-in transactions cannot be verified and `/api/checkin/save-tx` rejects them (fails closed, not open).
- `DEPLOYER_PRIVATE_KEY` — only needed if the backend itself submits on-chain writes (e.g. `registerWill`). Use a dedicated wallet, not a personal one.
- `VAULTIS_TOKEN_ADDRESS` — deployed LVT ERC-20 contract address.
- `WILL_REGISTRY_ADDRESS`, `INHERITANCE_TRIGGER_ADDRESS` — optional, only if those auxiliary contracts are deployed.

### Cron (dead-man-switch)
- `CRON_SCHEDULE` — cron expression, only relevant when running as a long-lived server (not Vercel). Default `0 0 * * *`.
- `CRON_SECRET` — **required in production on Vercel.** Random secret (`openssl rand -hex 32`) that gates `GET /api/cron/run`, the serverless replacement for `node-cron`. Vercel Cron automatically sends it as `Authorization: Bearer <CRON_SECRET>`. The endpoint refuses to run in production without it.

### Check-in rate limiting
- `CHECKIN_DEMO_MODE` — `true` disables check-in rate limiting entirely (unlimited check-ins). Only for live demos — leave `false`/unset in real production.

### Email (optional)
- `GMAIL_USER`, `GMAIL_PASS` — Gmail address + [app-specific password](https://myaccount.google.com/apppasswords). Without these, emails are logged to the console instead of sent (dev-friendly no-op, not an error).

### AWS S3 document storage (optional)
- `AWS_S3_ENABLED` — `true` to store encrypted will content in S3 instead of inline in MongoDB. Defaults `false`.
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` — required if `AWS_S3_ENABLED=true`.

### IPFS/Pinata (optional)
- `PINATA_JWT`, `PINATA_API_KEY`, `PINATA_API_SECRET` — for pinning asset payloads to IPFS. Unset = feature silently disabled.

## Frontend project (`frontend/` Root Directory)

- `VITE_API_URL` — **required.** Full URL of the deployed backend project, e.g. `https://vaultis-backend.vercel.app` (no trailing slash, no `/api` suffix — the frontend appends `/api/...` itself).
- `VITE_LVT_CONTRACT_ADDRESS` — deployed LVT token address (same as backend's `VAULTIS_TOKEN_ADDRESS`).
- `VITE_SEPOLIA_RPC_URL` — Sepolia RPC endpoint used by the browser wallet integration.
- `VITE_CHAIN_ID` — `11155111` (Sepolia).

Since these are `VITE_`-prefixed, Vite bakes them into the client bundle at build time — they're not secret (don't put private keys here), and any change requires a redeploy to take effect.

## Security best practices

1. Never commit `.env` files — `.gitignore` already excludes them; only `.env.example` templates are tracked.
2. Generate fresh `JWT_SECRET`/`ENCRYPTION_KEY`/`CRON_SECRET` per environment — never reuse local dev secrets in production.
3. Store all secrets in the Vercel dashboard (Project → Settings → Environment Variables), never in `vercel.json` or source code.
4. Rotate secrets if they're ever exposed in logs, screenshots, or a public commit.
5. Restrict MongoDB Atlas network access as tightly as your setup allows (Vercel's serverless functions don't have stable outbound IPs, so `0.0.0.0/0` is common in practice — compensate with a strong database password and least-privilege DB user).
