# Troubleshooting Guide

## Deployment Issues

### Build Failed: "Cannot find module"
**Cause:** Dependencies not installed
**Solution:**
```bash
# Reinstall all dependencies
npm run setup
# Push changes to GitHub
git push origin main
```

### Build Failed: Environment variables not set
**Cause:** Required env vars missing
**Solution:**
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Add all required variables from ENVIRONMENT_VARIABLES.md
4. Redeploy

### Build Failed: "vercel.json is invalid"
**Cause:** JSON syntax error in vercel.json
**Solution:**
1. Validate JSON at https://jsonlint.com/
2. Fix syntax errors
3. Commit and push

## Runtime Issues

### API Returns 500 Error
**Check:**
1. Vercel logs for error message
2. MongoDB connection: `curl https://your-app.vercel.app/api/health`
3. Verify MONGODB_URI in environment variables

**If MongoDB Connection Error:**
- Check MongoDB Atlas connection string
- Verify IP whitelist includes Vercel IPs (use 0.0.0.0/0)
- Test connection locally first

### API Returns 502 Bad Gateway
**Cause:** Backend not responding
**Solution:**
1. Check health endpoint: `/api/health`
2. View Vercel logs for errors
3. Verify environment variables
4. Redeploy the project

### Frontend Blank/White Screen
**Check:**
1. Browser console for JavaScript errors
2. Network tab for failed requests
3. Clear browser cache and reload
4. Check build output in Vercel dashboard

**If API endpoints failing:**
- Verify VITE_API_URL is set correctly
- Check CORS settings in backend
- Ensure API is responding to requests

### "Not allowed by CORS"
**Cause:** Frontend URL not in CORS whitelist
**Solution:**
1. Add FRONTEND_URL to environment variables
2. Verify it matches deployed URL exactly
3. Backend checks this in CORS configuration

## Authentication Issues

### Login Returns 401
**Check:**
- Credentials are correct
- User account exists in database
- JWT_SECRET is set

### JWT Token Invalid
**Cause:** JWT_SECRET changed after token created
**Solution:**
- Users need to login again
- Tokens use new secret

## Database Issues

### MongoDB Connection Timeout
**Solutions:**
1. Check MongoDB Atlas IP whitelist
   - Add 0.0.0.0/0 for development
   - Use Vercel IP ranges for production
2. Verify connection string format
3. Check firewall settings

### Database Query Errors
**Check:**
1. Collections exist in MongoDB
2. Document schema matches models
3. Indexes are created
4. User has appropriate permissions

## Blockchain Issues

### Etherscan API Key Error
**Solution:**
1. Generate new key at https://sepolia.etherscan.io/apis
2. Update ETHERSCAN_API_KEY in environment variables
3. Redeploy

### Contract Not Found
**Check:**
- VAULTIS_TOKEN_ADDRESS is correct
- Contract deployed to Sepolia testnet
- Using correct network RPC

## Performance Issues

### Slow API Response
**Check:**
1. Database query performance
2. Rate limiting not triggered
3. Network latency
4. Review Vercel analytics

### High Memory Usage
**Solutions:**
1. Check for memory leaks
2. Optimize database queries
3. Reduce cache size
4. Contact Vercel support

## SSL/HTTPS Issues

### "Not Secure" Warning
**Solution:**
- Vercel provides free SSL certificates
- Certificate should auto-renew
- Clear browser cache
- Check domain settings

## Rate Limiting Issues

### "Too many requests" Error
**Cause:** Rate limit exceeded
**Solution:**
1. Wait 15 minutes for reset
2. Check if legitimate heavy usage
3. Adjust rate limit in environment

## Monitoring

### Enable Advanced Monitoring
1. Vercel Dashboard → Settings
2. Enable "Analytics"
3. Monitor performance metrics

### Check Logs
```bash
# View recent deployments
vercel deployments

# View specific deployment logs
vercel logs <deployment-url>
```

## Getting Help

1. Check Vercel status: https://status.vercel.com
2. Review error logs in Vercel dashboard
3. Search GitHub issues
4. Check backend logs in `/backend/server.out.log`

## Development vs Production Debugging

### Local Development
```bash
npm run dev
# Check backend logs in terminal
# Check frontend console in browser
```

### Production (Vercel)
```
1. Vercel Dashboard → Deployments
2. Click deployment → Logs tab
3. Search for error messages
```

## Security Issues

### Secrets Exposed in Logs
**Action:**
1. Regenerate all secrets immediately
2. Rotate JWT_SECRET and ENCRYPTION_KEY
3. Update in environment variables
4. Redeploy

### Unauthorized API Access
**Check:**
1. CORS settings
2. Rate limiting
3. Authentication middleware

## Contact Support

- Vercel Support: https://vercel.com/support
- MongoDB Support: https://support.mongodb.com
- GitHub Issues: Your repository issues page
