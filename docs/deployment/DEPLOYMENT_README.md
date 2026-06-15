# Vaultis Vercel Deployment Guide

## Quick Start - 5 Minutes

### 1. Prerequisites
- GitHub account with Vaultis repository
- Vercel account (free at https://vercel.com)
- MongoDB Atlas account (free at https://www.mongodb.com/cloud/atlas)
- Etherscan API key (free at https://sepolia.etherscan.io/apis)

### 2. Create MongoDB Database (2 minutes)
```
1. Go to MongoDB Atlas
2. Create new cluster (free tier)
3. Create database user with strong password
4. Add your IP to whitelist (or allow 0.0.0.0/0)
5. Copy connection string: mongodb+srv://user:pass@cluster.mongodb.net/vaultis
```

### 3. Deploy to Vercel (2 minutes)
```
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Select Vaultis project
4. Click Deploy
```

### 4. Configure Environment Variables (1 minute)
In Vercel Dashboard → Project Settings → Environment Variables, add:

**Required:**
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vaultis
JWT_SECRET=<generate-32-char-random>
ENCRYPTION_KEY=<generate-32-hex-chars>
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETHERSCAN_API_KEY=<your-key>
VAULTIS_TOKEN_ADDRESS=0x9BD654624D490DeBA2fEF53D959ab27e29373A77
FRONTEND_URL=https://your-project.vercel.app
NODE_ENV=production
```

**Optional (for emails):**
```
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=<app-specific-password>
```

## Post-Deployment Verification

### Test Health Endpoint
```bash
curl https://your-project.vercel.app/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "VAULTIS API running",
  "mongodb": "connected",
  "blockchain": "synced",
  "environment": "production"
}
```

### Test Frontend
```
Visit: https://your-project.vercel.app
Check browser console for errors
Try login flow
```

### Test API Endpoint
```bash
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test@example.com","password":"Test123456!"}'
```

## Monitoring & Debugging

### View Logs
1. Vercel Dashboard → Project → Deployments
2. Click latest deployment
3. View build logs and runtime logs

### Common Issues

**MongoDB Connection Failed**
- Verify connection string in environment variables
- Check IP whitelist in MongoDB Atlas
- Ensure password doesn't contain special characters (URL encode if needed)

**API Returns 500 Error**
- Check environment variables are set
- Verify MongoDB connection
- Look at Vercel logs for specific errors

**Frontend Can't Connect to API**
- Verify FRONTEND_URL matches deployed URL
- Check CORS settings in backend/server.js
- Ensure API routes are responding to /api/ prefix

## Security Checklist

- ✅ All secrets in environment variables, not code
- ✅ HTTPS enforced (automatic on Vercel)
- ✅ Security headers configured in vercel.json
- ✅ Rate limiting enabled
- ✅ Input validation on all endpoints
- ✅ CORS restricted to frontend domain
- ✅ XSS protection enabled
- ✅ No console logs with sensitive data

## Rollback Procedure

If deployment has issues:

1. Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "Redeploy"
4. Select "Production"

Your previous version will be restored instantly.

## Continuous Deployment

Every push to your main branch automatically deploys.

To disable auto-deploy:
- Vercel Dashboard → Settings → Git
- Uncheck "Auto-deploy on push"

## Environment Variables Reference

See `/docs/deployment/ENVIRONMENT_VARIABLES.md` for complete list and descriptions.

## Troubleshooting

See `/docs/deployment/TROUBLESHOOTING.md` for detailed troubleshooting guide.

## Support

- Check logs: Vercel Dashboard → Deployments
- Review API endpoints: /docs/api/API_ENDPOINTS.md
- Development guide: /docs/development/DEVELOPMENT_GUIDE.md
