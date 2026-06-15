# Vercel Deployment Guide

This guide covers deploying Vaultis to Vercel as a monorepo.

## Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository connected
- Environment variables configured

## Deployment Steps

### 1. Connect Repository
1. Go to Vercel Dashboard
2. Click "New Project"
3. Import your GitHub repository containing Vaultis

### 2. Configure Environment Variables
Set these in Vercel Project Settings > Environment Variables:

**Backend Variables:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vaultis
JWT_SECRET=<generate-random-32-char-string>
ENCRYPTION_KEY=<generate-random-32-char-hex>
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHERSCAN_API_KEY=your-etherscan-key
DEPLOYER_PRIVATE_KEY=your-private-key-hex
VAULTIS_TOKEN_ADDRESS=0x9BD654624D490DeBA2fEF53D959ab27e29373A77
FRONTEND_URL=https://your-vaultis-app.vercel.app
NODE_ENV=production
```

**Frontend Variables:**
```
VITE_API_URL=https://your-vaultis-api-domain.com/api
```

### 3. Deploy
1. Push to main branch to trigger auto-deploy
2. Monitor build logs in Vercel dashboard
3. Verify both frontend and backend deployed

### 4. Post-Deployment Verification
- Health check: `https://your-api.vercel.app/api/health`
- Test login endpoint
- Verify database connectivity
- Check security headers

## Troubleshooting

See TROUBLESHOOTING.md for common issues and solutions.
