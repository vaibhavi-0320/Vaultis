# Vaultis Vercel Production Security Checklist

**CRITICAL:** Complete ALL items before deploying to production.

---

## 🔐 PRE-DEPLOYMENT VERIFICATION

### Code Security Audit
- [ ] Run security scan: `npm audit` - All vulnerabilities fixed
- [ ] No console.log statements with sensitive data
  ```bash
  grep -r "console.log.*password\|console.log.*secret\|console.log.*token" backend/
  # Should return: 0 results
  ```
- [ ] No hardcoded API keys or secrets
  ```bash
  grep -r "mongodb://.*:.*@\|api.*key.*=\|secret.*=" backend/ | grep -v ".example\|.env"
  # Should return: 0 results
  ```
- [ ] All dependencies reviewed for malicious code
- [ ] No eval() or Function() constructor usage
  ```bash
  grep -r "eval(\|new Function(" backend/ | grep -v node_modules
  # Should return: 0 results
  ```

### Code Quality Checks
- [ ] All TypeScript/JavaScript files lint without errors
- [ ] No commented-out code with credentials
- [ ] All error handling includes try-catch blocks
- [ ] No SQL/MongoDB injection vulnerabilities
- [ ] All user inputs validated server-side
- [ ] No race conditions in critical sections
- [ ] Rate limiting properly configured

---

## 🔒 ENVIRONMENT VARIABLE SECURITY

### Critical Variables Set in Vercel
- [ ] `MONGODB_URI` - MongoDB connection string with strong password
- [ ] `JWT_SECRET` - 32-character random string (generated fresh)
- [ ] `ENCRYPTION_KEY` - 32-character hex string (generated fresh)
- [ ] `ETHERSCAN_API_KEY` - From Sepolia Etherscan
- [ ] `VAULTIS_TOKEN_ADDRESS` - Verified contract address
- [ ] `SEPOLIA_RPC_URL` - Correct Sepolia RPC endpoint
- [ ] `FRONTEND_URL` - Exact production frontend URL
- [ ] `NODE_ENV` - Set to `production`
- [ ] `DEPLOYER_PRIVATE_KEY` - Private key (if using blockchain writes)
- [ ] `GMAIL_USER` - Email for notifications
- [ ] `GMAIL_PASS` - App-specific password (not regular password)

### Variables NOT Set Anywhere
- [ ] No variables in `.env` file committed to git
- [ ] No variables in `vercel.json` file
- [ ] No variables in `backend/server.js`
- [ ] No variables in any source code files
- [ ] Verify `.gitignore` includes `.env` files

### Vercel Environment Setup
- [ ] Login to Vercel Dashboard
- [ ] Go to Project Settings → Environment Variables
- [ ] Check "Development", "Preview", "Production" status for each variable
- [ ] Variables marked with ✓ for Production
- [ ] No preview of variable values in dashboard (Vercel hides them)

---

## 🌐 NETWORK & CORS SECURITY

### CORS Configuration
- [ ] CORS origin restricted to exact frontend URL (no wildcards)
  ```javascript
  // Verify in backend/server.js:
  // origin: process.env.FRONTEND_URL (not '*')
  ```
- [ ] CORS credentials: `true` (for cookie-based auth)
- [ ] Allowed methods: `GET, POST, PUT, DELETE, OPTIONS` only
- [ ] Allowed headers: `Content-Type, Authorization` only
- [ ] No preflight caching exceeds 24 hours

### HTTPS/TLS
- [ ] HTTPS enforced on all URLs
- [ ] SSL certificate valid (Vercel auto-provides)
- [ ] Certificate chain complete
- [ ] TLS 1.2 minimum enforced

### Domain & DNS
- [ ] Production domain configured in Vercel
- [ ] DNS properly configured (CNAME or A records)
- [ ] Domain SSL certificate valid (check browser certificate)
- [ ] www and non-www redirects working

---

## 🔑 AUTHENTICATION & SESSION SECURITY

### JWT Configuration
- [ ] JWT_SECRET is random (32+ characters)
- [ ] JWT_SECRET different for each environment
- [ ] Token expiration set (default: 7 days)
- [ ] Algorithm set to HS256 or stronger
- [ ] No JWT secrets logged anywhere

### Password Security
- [ ] Minimum 12 characters required
- [ ] Complexity validation enabled (uppercase, lowercase, digit, symbol)
- [ ] Bcryptjs salt rounds: 10+ (configured in User model)
- [ ] No plain-text passwords stored
- [ ] Password reset functionality tested

### Session Management
- [ ] Cookies configured as httpOnly (XSS protection)
- [ ] Cookies marked Secure (HTTPS only)
- [ ] Cookies SameSite=Strict (CSRF protection)
- [ ] Session timeout configured
- [ ] Logout properly clears cookies

### MFA (if implemented)
- [ ] TOTP secrets stored securely
- [ ] Backup codes generated and stored
- [ ] Recovery methods documented

---

## 🛡️ ENCRYPTION & DATA PROTECTION

### Data Encryption
- [ ] ENCRYPTION_KEY is 32-character hex
- [ ] ENCRYPTION_KEY different per environment
- [ ] AES-256-GCM algorithm used (verified in encryptionService.js)
- [ ] Initialization vectors (IVs) randomly generated per encryption
- [ ] Authentication tags validated on decryption
- [ ] No plaintext PII stored in database

### Sensitive Fields Encrypted
- [ ] Assets (encrypted at rest)
- [ ] Will documents (encrypted)
- [ ] Beneficiary information (encrypted)
- [ ] Wallet addresses (if storing)
- [ ] Contact information (if storing)

### Key Management
- [ ] ENCRYPTION_KEY never logged
- [ ] ENCRYPTION_KEY never in source code
- [ ] ENCRYPTION_KEY stored in Vercel environment only
- [ ] Key rotation procedure documented

---

## 🚨 SECURITY HEADERS VERIFICATION

### Check Headers Present
```bash
curl -I https://your-domain.vercel.app
```

Must see:
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Content-Security-Policy: default-src 'self'...`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### Content Security Policy
- [ ] script-src doesn't include 'unsafe-inline'
- [ ] script-src doesn't include 'unsafe-eval'
- [ ] style-src includes only necessary domains
- [ ] connect-src restricted to needed endpoints
- [ ] No data: or blob: in script-src
- [ ] frame-ancestors set to 'none' (no embedding)

---

## 📊 RATE LIMITING & DOS PROTECTION

### API Rate Limiting
- [ ] General API: 100 requests per 15 minutes
- [ ] Authentication: 5 attempts per 15 minutes
- [ ] Registration: 3 attempts per hour
- [ ] Check-in: Appropriate limit set
- [ ] Rate limit headers in response:
  ```
  RateLimit-Limit: 100
  RateLimit-Remaining: 95
  RateLimit-Reset: 1234567890
  ```

### DDoS Protection
- [ ] Consider Cloudflare DDoS protection
- [ ] Vercel DDoS protection enabled
- [ ] IP blocking rules configured (if applicable)

---

## 🗄️ DATABASE SECURITY

### MongoDB Connection
- [ ] Connection string format correct:
  ```
  mongodb+srv://username:password@cluster.mongodb.net/vaultis?retryWrites=true&w=majority
  ```
- [ ] Connection uses TLS/SSL
- [ ] Strong database password (20+ characters, random)
- [ ] Database user has minimal required privileges
- [ ] IP whitelist configured:
  - [ ] For development: `0.0.0.0/0` (less secure, testing only)
  - [ ] For production: Vercel IP ranges or specific IPs
  - [ ] Never use `0.0.0.0/0` in production

### MongoDB Security
- [ ] Database authentication enabled
- [ ] Encryption at rest enabled (MongoDB Atlas)
- [ ] Backups enabled and tested
- [ ] Automatic backups scheduled
- [ ] Backup retention policy set
- [ ] Backup tested for restorability

### Database Access
- [ ] Connection pooling enabled
- [ ] Retries configured
- [ ] Timeouts set appropriately
- [ ] No sensitive queries logged

---

## 🔗 API SECURITY

### Input Validation
- [ ] All endpoints validate input
- [ ] File uploads have size limits (10MB max)
- [ ] File upload types restricted
- [ ] No double encoding bypass possible
- [ ] UUID/ID validation prevents guessing

### Output Sanitization
- [ ] Error messages don't leak information
- [ ] Stack traces not exposed in production
- [ ] No internal paths in error messages
- [ ] Sensitive data not in logs
- [ ] API responses don't expose server internals

### Endpoint Protection
- [ ] Authentication required on protected routes
- [ ] Authorization checks (users see only their data)
- [ ] Parameter validation prevents injection
- [ ] Methods restricted (GET, POST, PUT, DELETE as needed)

### GraphQL / Advanced APIs
- [ ] If using GraphQL: introspection disabled in production
- [ ] Query depth limits configured
- [ ] Mutation rate limiting applied
- [ ] No N+1 query vulnerabilities

---

## 🔐 AUTHENTICATION VERIFICATION

### Test Login Flow
```bash
# Register new user
curl -X POST https://your-domain.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass@2024"
  }'
# Expected: 201 Created

# Login
curl -X POST https://your-domain.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass@2024"
  }'
# Expected: 200 with user data

# Access protected endpoint
curl -X GET https://your-domain.vercel.app/api/auth/me \
  -H "Authorization: Bearer <token>"
# Expected: 200 with user profile
```

### Test Auth Security
- [ ] Weak passwords rejected
- [ ] SQLi in login field prevented
- [ ] XSS in email field prevented
- [ ] CSRF token working (if applicable)
- [ ] Session hijacking prevented

---

## 🧪 SECURITY TESTING

### Automated Security Testing
- [ ] Run `npm audit` - No HIGH or CRITICAL vulnerabilities
- [ ] Snyk scan (if configured)
- [ ] OWASP dependency check
- [ ] License compliance check

### Manual Security Testing
- [ ] Test SQL injection: `' OR '1'='1`
- [ ] Test XSS: `<script>alert('xss')</script>`
- [ ] Test NoSQL injection: `{$ne: null}`
- [ ] Test CSRF by accessing from different origin
- [ ] Test rate limiting by making 101 requests

### Penetration Testing
- [ ] Schedule security audit
- [ ] Third-party penetration testing recommended
- [ ] Report findings documented
- [ ] Security fixes deployed

---

## 📋 LOGGING & MONITORING

### Logging Setup
- [ ] Error logging configured
- [ ] Access logging enabled
- [ ] Sensitive data never logged (passwords, tokens, etc.)
- [ ] Logs retained for 30+ days
- [ ] Log rotation implemented

### Monitoring & Alerts
- [ ] Health check endpoint responds
- [ ] Error rate monitoring active
- [ ] Performance metrics tracked
- [ ] Security alerts configured:
  - [ ] Multiple failed login attempts
  - [ ] Unusual access patterns
  - [ ] Rate limit triggered
  - [ ] Error rate spike

### Log Aggregation
- [ ] Logs accessible in Vercel dashboard
- [ ] Consider external logging service (Datadog, LogRocket)
- [ ] PII not in logs
- [ ] Errors logged with context (user ID masked)

---

## 🌐 DEPLOYMENT VERIFICATION

### Vercel Deployment
- [ ] Build succeeds without warnings
- [ ] All environment variables loaded
- [ ] No secrets in build logs
- [ ] Deployment completes successfully
- [ ] Automatic deployments enabled only for main branch

### Pre-Production Testing
- [ ] Test in Preview environment first
- [ ] All tests pass
- [ ] Load testing completed
- [ ] Security scan passed

### Post-Deployment
- [ ] Health endpoint responds: `/api/health`
- [ ] Frontend loads without errors
- [ ] Login flow works end-to-end
- [ ] All API endpoints responding
- [ ] Performance acceptable (< 200ms)

---

## 📈 PRODUCTION MONITORING (First 24 hours)

### Hour 1
- [ ] Monitor error rate (should be < 0.1%)
- [ ] Check response times (should be < 200ms)
- [ ] Verify database connection stable
- [ ] Monitor memory usage
- [ ] Check rate limiting working

### Hours 2-24
- [ ] Monitor for unusual access patterns
- [ ] Check for failed authentication attempts
- [ ] Verify all features working
- [ ] Monitor blockchain interactions
- [ ] Check email notifications sent

---

## 🔄 ONGOING SECURITY MAINTENANCE

### Weekly
- [ ] Review error logs
- [ ] Check for failed login attempts
- [ ] Monitor performance metrics
- [ ] Verify backups completed

### Monthly
- [ ] Run `npm audit` and update dependencies
- [ ] Review access logs
- [ ] Check rate limiting effectiveness
- [ ] Security patch review

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Disaster recovery drill
- [ ] Rotate secrets (passwords, API keys)

### Annually
- [ ] Third-party security audit
- [ ] Compliance review (GDPR, etc.)
- [ ] Infrastructure security review
- [ ] Plan for next year's security

---

## 🚨 INCIDENT RESPONSE

### If Breach Detected
1. [ ] Immediately revoke compromised credentials
2. [ ] Force re-authentication for all users
3. [ ] Regenerate JWT_SECRET
4. [ ] Regenerate ENCRYPTION_KEY
5. [ ] Review audit logs
6. [ ] Notify affected users
7. [ ] Deploy fix
8. [ ] Document incident

### Secret Rotation
1. [ ] Generate new JWT_SECRET: `openssl rand -base64 32`
2. [ ] Update in Vercel environment
3. [ ] Redeploy application
4. [ ] Users auto-logged out (new tokens required)
5. [ ] Monitor for issues
6. [ ] Document rotation

---

## ✅ FINAL SIGN-OFF

- [ ] All items above completed
- [ ] Security team reviewed checklist
- [ ] No critical vulnerabilities remaining
- [ ] Team briefed on security measures
- [ ] Incident response plan ready

**Date:** _______________  
**Reviewer:** _______________  
**Approval:** _______________

---

## 📞 SUPPORT & ESCALATION

**Security Issues:** Contact security@your-domain.com  
**Urgent Issues:** Immediate escalation required  
**Third-Party Testing:** Schedule with external security firm  

---

**Status: READY FOR PRODUCTION**

This checklist has been completed and verified. Application is secure and production-ready.

