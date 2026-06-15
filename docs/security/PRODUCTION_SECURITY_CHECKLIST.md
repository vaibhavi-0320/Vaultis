# Production Security Checklist

Use this checklist before deploying to production.

## ✅ Code Security

### No Hardcoded Secrets
- [ ] No API keys in code
- [ ] No database credentials in code
- [ ] No private keys in code
- [ ] No JWT secrets in code
- [ ] No encryption keys in code

**Verify:**
```bash
grep -r "mongodb://\|mongodb+srv://\|api.*key\|secret\|password" backend/ \
  | grep -v ".example\|.env\|node_modules\|\.git" | wc -l
# Should output: 0
```

### No Console Logs with Sensitive Data
- [ ] No secret keys logged
- [ ] No user passwords logged
- [ ] No API keys logged
- [ ] No private data logged in production

**Verify:**
```bash
grep -r "console.log.*\(secret\|password\|token\|key\)" backend/ \
  | grep -v ".example\|node_modules" | wc -l
# Should output: 0
```

### Dependencies Security
- [ ] All npm packages up-to-date
- [ ] No known vulnerabilities: `npm audit`
- [ ] Critical and High severity fixed
- [ ] Dependencies reviewed for malicious code

**Verify:**
```bash
npm audit
npm audit --audit-level=high
```

---

## ✅ Environment Configuration

### All Required Variables Set
- [ ] MONGODB_URI configured
- [ ] JWT_SECRET configured
- [ ] ENCRYPTION_KEY configured
- [ ] ETHERSCAN_API_KEY configured
- [ ] VAULTIS_TOKEN_ADDRESS configured
- [ ] SEPOLIA_RPC_URL configured
- [ ] GMAIL_USER and GMAIL_PASS set (if email enabled)
- [ ] FRONTEND_URL configured
- [ ] NODE_ENV=production

**Verify in Vercel:**
```
Dashboard → Project Settings → Environment Variables
All variables should be ✓ set
```

### Environment Variables Not Leaking
- [ ] .env file not in git
- [ ] .env.example has placeholders only
- [ ] No secrets in logs
- [ ] No secrets in error messages

---

## ✅ Database Security

### MongoDB Connection
- [ ] Connection uses HTTPS/TLS
- [ ] Connection string has credentials
- [ ] Connection string has database name
- [ ] Connection string has query parameters

**Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/vaultis?retryWrites=true&w=majority
```

### MongoDB Access Control
- [ ] Only required IPs whitelisted (0.0.0.0/0 for development)
- [ ] Database user has least privileges
- [ ] Strong password for database user
- [ ] Database backups enabled

---

## ✅ Authentication Security

### Password Security
- [ ] Minimum 12 characters required
- [ ] Complexity validation enabled
- [ ] Bcryptjs hashing with salt
- [ ] No plain text passwords stored

### JWT Security
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] JWT_SECRET is random
- [ ] Token expiration set (7 days default)
- [ ] Refresh token mechanism implemented
- [ ] Tokens in httpOnly cookies

---

## ✅ Encryption Security

### Data Encryption
- [ ] ENCRYPTION_KEY is 32 hex characters
- [ ] AES-256-GCM algorithm used
- [ ] Encryption key never logged
- [ ] Encrypted data stored properly

### HTTPS/TLS
- [ ] All connections HTTPS only
- [ ] Valid SSL certificate (Vercel auto)
- [ ] HSTS header enabled
- [ ] Certificate renewal auto-enabled

---

## ✅ API Security

### Rate Limiting
- [ ] General API: 100 req/15min
- [ ] Check-in: Appropriate limit
- [ ] Rate limit middleware active
- [ ] Rate limit headers in response

### CORS Configuration
- [ ] CORS restricted to FRONTEND_URL
- [ ] Credentials required for cross-origin
- [ ] Methods limited to needed verbs
- [ ] Headers validated

**Backend check:**
```javascript
// In backend/server.js
cors({
  origin: allowedOrigins, // Should be limited
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})
```

### Input Validation
- [ ] All inputs validated on server-side
- [ ] No SQL injection possible
- [ ] No XSS possible
- [ ] File upload size limited

### Security Headers
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security enabled
- [ ] Content-Security-Policy configured

**Verify:**
```bash
curl -I https://your-app.vercel.app
# Should show all security headers
```

---

## ✅ Application Security

### Authentication Middleware
- [ ] Protected routes require auth
- [ ] JWT validated on protected endpoints
- [ ] Token expiration checked
- [ ] Invalid tokens rejected

### Data Sanitization
- [ ] MongoDB injection prevention (express-mongo-sanitize)
- [ ] XSS protection (xss-clean middleware)
- [ ] Input length limits enforced

### Error Handling
- [ ] Generic error messages in production
- [ ] Stack traces not exposed
- [ ] Sensitive info not in error messages
- [ ] Errors logged securely

---

## ✅ Blockchain Security

### Contract Addresses
- [ ] VAULTIS_TOKEN_ADDRESS verified
- [ ] Address matches deployed contract
- [ ] Network (Sepolia) correct

### Blockchain Interaction
- [ ] Only read operations for frontend
- [ ] Transaction verification via Etherscan
- [ ] No private keys exposed
- [ ] Nonce handling correct

---

## ✅ File & Deployment Security

### Source Control
- [ ] .env files git-ignored
- [ ] node_modules git-ignored
- [ ] dist/ git-ignored
- [ ] Secrets never committed

**Check .gitignore:**
```bash
cat .gitignore | grep -E "\.env|node_modules|dist|\.log"
```

### Build Configuration
- [ ] vercel.json valid JSON
- [ ] Build command correct
- [ ] Install command correct
- [ ] Output directory correct

### Deployment
- [ ] Branch protection on main
- [ ] PR reviews required
- [ ] Environment variables set in Vercel
- [ ] Deployment URL verified

---

## ✅ Monitoring & Logging

### Logging
- [ ] Errors logged to persistent storage
- [ ] No sensitive data in logs
- [ ] Access logs maintained
- [ ] Audit logs for sensitive operations

### Monitoring
- [ ] Health check endpoint configured
- [ ] Performance metrics tracked
- [ ] Error tracking enabled
- [ ] Security alerts enabled

---

## ✅ Documentation

### Documentation Complete
- [ ] README updated
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Deployment guide written
- [ ] Security hardening documented
- [ ] Troubleshooting guide provided

---

## ✅ Final Verification

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

Response should be:
```json
{
  "success": true,
  "message": "VAULTIS API running",
  "mongodb": "connected",
  "blockchain": "synced",
  "environment": "production"
}
```

### Security Headers Check
```bash
curl -I https://your-app.vercel.app
```

Headers should include:
- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- Content-Security-Policy

### SSL Certificate
```bash
openssl s_client -connect your-app.vercel.app:443
```

Should show valid certificate.

---

## 🔒 Post-Deployment Security

### Continuous Monitoring
- [ ] Check logs regularly
- [ ] Monitor error rates
- [ ] Track performance
- [ ] Review security alerts

### Secret Rotation
- [ ] Plan rotation schedule
- [ ] Document rotation process
- [ ] Test rotation in staging first
- [ ] Execute rotation without downtime

### Regular Audits
- [ ] Monthly security reviews
- [ ] Quarterly vulnerability scans
- [ ] Annual penetration testing
- [ ] Dependency updates quarterly

---

## 📋 Sign-Off

- [ ] All checks completed
- [ ] No outstanding security issues
- [ ] Team review completed
- [ ] Ready for production

**Date:** ___________  
**Reviewer:** ___________  
**Sign-off:** ___________

---

For questions, see `/docs/security/SECURITY_HARDENING.md` or contact your security team.
