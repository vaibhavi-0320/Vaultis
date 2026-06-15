# Vaultis Documentation

Complete documentation for the Vaultis inheritance platform, organized for production deployment.

## 📑 Quick Navigation

### 🚀 Getting Started
- **New to Vaultis?** Start with [Deployment README](./deployment/DEPLOYMENT_README.md)
- **Want to deploy to Vercel?** See [Vercel Deployment Guide](./deployment/VERCEL_DEPLOYMENT_GUIDE.md)
- **Local development?** Check [Development Guide](./development/DEVELOPMENT_GUIDE.md)

### 📋 Deployment Resources
- **Quick Start** → [DEPLOYMENT_README.md](./deployment/DEPLOYMENT_README.md) (5 minutes)
- **Detailed Steps** → [VERCEL_DEPLOYMENT_GUIDE.md](./deployment/VERCEL_DEPLOYMENT_GUIDE.md)
- **Environment Variables** → [ENVIRONMENT_VARIABLES.md](./deployment/ENVIRONMENT_VARIABLES.md)
- **Troubleshooting** → [TROUBLESHOOTING.md](./deployment/TROUBLESHOOTING.md)

### 🔒 Security
- **Security Features** → [SECURITY_HARDENING.md](./security/SECURITY_HARDENING.md)
- **Pre-Deployment Check** → [PRODUCTION_SECURITY_CHECKLIST.md](./security/PRODUCTION_SECURITY_CHECKLIST.md)
- **Audit Summary** → [SECURITY_AUDIT_SUMMARY.md](./security/SECURITY_AUDIT_SUMMARY.md)

### 📚 API Reference
- **Endpoints** → [API_ENDPOINTS.md](./api/API_ENDPOINTS.md)
- **Authentication** → See API endpoints for auth routes
- **Rate Limiting** → General: 100 req/15min

### 👨‍💻 Development
- **Local Setup** → [DEVELOPMENT_GUIDE.md](./development/DEVELOPMENT_GUIDE.md)
- **Project Structure** → See main [STRUCTURE_AND_DEPLOYMENT.md](../STRUCTURE_AND_DEPLOYMENT.md)
- **Code Quality** → Follow patterns in backend services

---

## 📁 Documentation Structure

```
docs/
├── deployment/                  # Vercel deployment guides
│   ├── DEPLOYMENT_README.md     # Quick start (5 min)
│   ├── VERCEL_DEPLOYMENT_GUIDE.md
│   ├── ENVIRONMENT_VARIABLES.md
│   └── TROUBLESHOOTING.md
├── security/                    # Security hardening
│   ├── SECURITY_HARDENING.md
│   ├── PRODUCTION_SECURITY_CHECKLIST.md
│   └── SECURITY_AUDIT_SUMMARY.md
├── api/                         # API documentation
│   └── API_ENDPOINTS.md
├── development/                 # Developer guides
│   └── DEVELOPMENT_GUIDE.md
└── README.md                    # This file
```

---

## 🎯 Common Tasks

### Deploy to Production
1. Read [DEPLOYMENT_README.md](./deployment/DEPLOYMENT_README.md)
2. Follow [VERCEL_DEPLOYMENT_GUIDE.md](./deployment/VERCEL_DEPLOYMENT_GUIDE.md)
3. Use [ENVIRONMENT_VARIABLES.md](./deployment/ENVIRONMENT_VARIABLES.md) as reference

### Set Up Local Development
1. Follow [DEVELOPMENT_GUIDE.md](./development/DEVELOPMENT_GUIDE.md)
2. Check [API_ENDPOINTS.md](./api/API_ENDPOINTS.md) for endpoints

### Debug Issues
1. Check [TROUBLESHOOTING.md](./deployment/TROUBLESHOOTING.md)
2. Verify [ENVIRONMENT_VARIABLES.md](./deployment/ENVIRONMENT_VARIABLES.md)
3. Review [SECURITY_HARDENING.md](./security/SECURITY_HARDENING.md) for security-related issues

### Review Security
1. Use [PRODUCTION_SECURITY_CHECKLIST.md](./security/PRODUCTION_SECURITY_CHECKLIST.md)
2. Read [SECURITY_HARDENING.md](./security/SECURITY_HARDENING.md)
3. Check [SECURITY_AUDIT_SUMMARY.md](./security/SECURITY_AUDIT_SUMMARY.md)

---

## ⚡ Quick Reference

### Environment Variables (Critical)
```
MONGODB_URI           # MongoDB connection string
JWT_SECRET            # JWT signing key (32 chars)
ENCRYPTION_KEY        # Data encryption key (32 hex)
ETHERSCAN_API_KEY     # Blockchain verification
FRONTEND_URL          # Frontend deployment URL
NODE_ENV              # production
```

### Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### Key Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/assets` - List assets
- `POST /api/will` - Create/update will
- `GET /api/health` - Health check

### API Prefix
All endpoints are under `/api/` prefix:
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.vercel.app/api`

---

## 🔐 Security Highlights

✅ **Encryption**
- AES-256-GCM for sensitive data
- JWT tokens with 7-day expiration
- httpOnly cookies (XSS-proof)

✅ **Protection**
- Rate limiting: 100 req/15min
- CORS restricted to frontend
- XSS and NoSQL injection prevention
- Security headers on all responses

✅ **Environment**
- All secrets in environment variables
- No hardcoded credentials
- Validation on startup
- Comprehensive error handling

---

## 📞 Getting Help

### Documentation
- Specific issue? → [TROUBLESHOOTING.md](./deployment/TROUBLESHOOTING.md)
- API question? → [API_ENDPOINTS.md](./api/API_ENDPOINTS.md)
- Development? → [DEVELOPMENT_GUIDE.md](./development/DEVELOPMENT_GUIDE.md)
- Security? → [SECURITY_HARDENING.md](./security/SECURITY_HARDENING.md)

### External Resources
- Vercel: https://vercel.com/docs
- MongoDB: https://docs.mongodb.com
- Express.js: https://expressjs.com
- Ethers.js: https://docs.ethers.org

---

## 📋 Documentation Index

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [DEPLOYMENT_README.md](./deployment/DEPLOYMENT_README.md) | Quick start deployment | 5 min |
| [VERCEL_DEPLOYMENT_GUIDE.md](./deployment/VERCEL_DEPLOYMENT_GUIDE.md) | Detailed deployment | 15 min |
| [ENVIRONMENT_VARIABLES.md](./deployment/ENVIRONMENT_VARIABLES.md) | Env vars reference | 10 min |
| [TROUBLESHOOTING.md](./deployment/TROUBLESHOOTING.md) | Solve issues | 10 min |
| [DEVELOPMENT_GUIDE.md](./development/DEVELOPMENT_GUIDE.md) | Local setup | 15 min |
| [API_ENDPOINTS.md](./api/API_ENDPOINTS.md) | API reference | 10 min |
| [SECURITY_HARDENING.md](./security/SECURITY_HARDENING.md) | Security details | 15 min |
| [PRODUCTION_SECURITY_CHECKLIST.md](./security/PRODUCTION_SECURITY_CHECKLIST.md) | Pre-deploy check | 20 min |

---

## 🚀 Ready to Deploy?

1. ✅ Read [DEPLOYMENT_README.md](./deployment/DEPLOYMENT_README.md) (5 min)
2. ✅ Set up MongoDB Atlas cluster (2 min)
3. ✅ Generate secrets (1 min)
4. ✅ Connect Vercel (2 min)
5. ✅ Configure environment variables (3 min)
6. ✅ Deploy and test (2 min)

**Total time: ~15 minutes to production** ✨

---

For the complete project structure, see [STRUCTURE_AND_DEPLOYMENT.md](../STRUCTURE_AND_DEPLOYMENT.md)
