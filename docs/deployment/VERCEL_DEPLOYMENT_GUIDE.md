# Vercel Deployment Guide

VAULTIS deploys as **two independent Vercel projects** from this one repository — a static frontend and a serverless backend — not a single monorepo deployment. Vercel's per-project **Root Directory** setting is what makes this work: each project only reads the `vercel.json` inside its configured root.

| Project | Root Directory | Type | Config file |
|---|---|---|---|
| `vaultis-frontend` | `frontend/` | Static (Vite build) | `frontend/vercel.json` |
| `vaultis-backend` | `backend/` | Serverless Node functions | `backend/vercel.json` |

## Prerequisites

- A [Vercel](https://vercel.com) account, with this GitHub repo connected
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (free tier is fine) with network access set to `0.0.0.0/0` (or Vercel's IP ranges) and a connection string
- An [Etherscan (Sepolia)](https://sepolia.etherscan.io/apis) API key
- (Optional) A Gmail account with an [app password](https://myaccount.google.com/apppasswords) for email notifications
- (Optional) An AWS account if you want S3 document storage instead of MongoDB-only storage

## 1. Deploy the backend first

The frontend needs the backend's URL at build time, so deploy the backend first.

1. **Vercel Dashboard → Add New → Project → Import** this repository.
2. Under **Root Directory**, click "Edit" and select `backend`.
3. Framework Preset: leave as **Other** (backend/vercel.json's `builds`/`routes` config handles it).
4. Add environment variables (Project Settings → Environment Variables). At minimum:

   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vaultis?retryWrites=true&w=majority
   JWT_SECRET=<openssl rand -base64 32>
   ENCRYPTION_KEY=<openssl rand -hex 32>
   SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   ETHERSCAN_API_KEY=<your Sepolia Etherscan key>
   VAULTIS_TOKEN_ADDRESS=0x9BD654624D490DeBA2fEF53D959ab27e29373A77
   FRONTEND_URL=https://<your-frontend-project>.vercel.app
   BACKEND_URL=https://<your-backend-project>.vercel.app
   CRON_SECRET=<openssl rand -hex 32>
   ```

   `FRONTEND_URL` and `BACKEND_URL` won't be known until step 2 finishes — you can deploy once with placeholder values and update them afterward (Vercel redeploys automatically on env var changes if you trigger a redeploy).

   Optional, if you're using them:
   ```
   GMAIL_USER=you@gmail.com
   GMAIL_PASS=<app password>
   DEPLOYER_PRIVATE_KEY=<only if you need on-chain writes from the backend>
   AWS_S3_ENABLED=true
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=...
   ```

5. Deploy. Note the resulting URL (e.g. `https://vaultis-backend.vercel.app`).
6. `CRON_SECRET` also enables `backend/vercel.json`'s scheduled job — Vercel Cron hits `GET /api/cron/run` once a day (Hobby plan default) to run the dead-man-switch evaluation, since the in-process `node-cron` scheduler can't persist between serverless invocations. Verify it's registered: **Project → Settings → Cron Jobs**.

## 2. Deploy the frontend

1. **Vercel Dashboard → Add New → Project → Import** the same repository again (a second, separate project).
2. Root Directory: `frontend`.
3. Framework Preset: **Vite** (auto-detected).
4. Add environment variables:

   ```
   VITE_API_URL=https://<your-backend-project>.vercel.app
   VITE_LVT_CONTRACT_ADDRESS=0x9BD654624D490DeBA2fEF53D959ab27e29373A77
   VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
   VITE_CHAIN_ID=11155111
   ```

5. Deploy. Note the resulting URL (e.g. `https://vaultis-frontend.vercel.app`).
6. Go back to the **backend** project's environment variables and set `FRONTEND_URL` to this URL (needed for CORS), then redeploy the backend.

## 3. Verify

```bash
# Backend health check
curl https://<your-backend-project>.vercel.app/api/health
# → { "success": true, "message": "VAULTIS API running", ... }

# Frontend loads and can reach the API
open https://<your-frontend-project>.vercel.app
# Try registering an account, then check in from the dashboard.

# Manually trigger the dead-man-switch cron once to confirm it's wired correctly
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://<your-backend-project>.vercel.app/api/cron/run
```

## Notes & limitations specific to serverless

- **node-cron doesn't run on Vercel.** `backend/server.js` only starts it when *not* running on Vercel (local/traditional server). On Vercel, `GET /api/cron/run` (protected by `CRON_SECRET`) does the same job, scheduled via `backend/vercel.json`'s `crons` field. Vercel Hobby plans are limited to daily cron granularity, which matches the default `CRON_SCHEDULE`.
- **The on-chain event listener is also skipped on Vercel.** It holds a persistent RPC filter subscription, which doesn't make sense across independent, short-lived function invocations — it would just leak filters and log noise. Check-in transaction confirmation instead happens synchronously in `POST /api/checkin/save-tx`, which doesn't depend on the listener.
- **MongoDB connection pooling**: each serverless function instance keeps its own connection pool (`maxPoolSize: 10` in `backend/config/db.js`). Under heavy concurrent traffic this can approach MongoDB Atlas's free-tier connection cap; if you outgrow it, consider Atlas's connection scaling tier or lowering `maxPoolSize` via env override.
- **Cold starts**: the first request after a period of inactivity will be slower (MongoDB connect + blockchain provider init). This is normal for serverless.

## Troubleshooting

See [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) for common issues and solutions.
