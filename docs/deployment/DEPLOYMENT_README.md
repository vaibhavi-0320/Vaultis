# Deployment Quick Reference

For the full step-by-step walkthrough, see [`VERCEL_DEPLOYMENT_GUIDE.md`](./VERCEL_DEPLOYMENT_GUIDE.md). This page is a fast-reference summary.

## Topology

VAULTIS deploys as **two separate Vercel projects** — a static frontend (`frontend/` as Root Directory) and a serverless backend (`backend/` as Root Directory) — from the same GitHub repo. Deploy the backend first so you have its URL for the frontend's `VITE_API_URL`.

## Prerequisites checklist

- [ ] MongoDB Atlas cluster created, connection string ready
- [ ] Sepolia Etherscan API key
- [ ] (Optional) Gmail app password for email notifications
- [ ] (Optional) AWS S3 bucket + IAM credentials, if using S3 document storage

## Post-deployment verification

```bash
# Backend health
curl https://<backend-project>.vercel.app/api/health

# Frontend
open https://<frontend-project>.vercel.app

# Register + login flow
curl -X POST https://<backend-project>.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"SecurePass@2024"}'
```

## Monitoring & logs

Vercel Dashboard → your project → **Deployments** → click a deployment → **Logs** (build logs and runtime function logs).

## Continuous deployment

Every push to the branch each Vercel project is watching (usually `main`) triggers an automatic redeploy of that project. To disable: Project → Settings → Git → uncheck "Auto-deploy".

## Rollback

Vercel Dashboard → Deployments → find a previous working deployment → **Promote to Production**.

## Full references

- [`VERCEL_DEPLOYMENT_GUIDE.md`](./VERCEL_DEPLOYMENT_GUIDE.md) — full setup walkthrough
- [`ENVIRONMENT_VARIABLES.md`](./ENVIRONMENT_VARIABLES.md) — every env var, per project
- [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) — common failure modes
- `/docs/api/API_ENDPOINTS.md` — API reference
- `/docs/development/DEVELOPMENT_GUIDE.md` — local development
