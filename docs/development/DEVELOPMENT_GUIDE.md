# Development Guide

## Local Setup

### Prerequisites
- Node.js 16+ and npm
- MongoDB (local or Atlas connection)
- Git

### Installation
```bash
# Install all dependencies
npm run setup

# This installs:
# - Root dependencies
# - Backend dependencies (backend/package.json)
# - Frontend dependencies (frontend/package.json)
```

### Environment Configuration
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit backend/.env with your local MongoDB URI and other config
# Default local MongoDB: mongodb://127.0.0.1:27017/vaultis
```

### Running Development Server
```bash
# Start both backend and frontend
npm run dev

# Or run separately:
npm run server  # Backend on port 5000
npm run client  # Frontend on port 5173
```

### API Documentation
- Base URL: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/api/health`
- See `/docs/api` for endpoint documentation

## Project Structure

```
vaultis/
├── backend/              # Express API server
│   ├── config/          # Database and env configuration
│   ├── middleware/      # Auth, database, security
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── utils/           # Utilities
├── frontend/            # React + Vite SPA
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── lib/         # API client
│   └── public/          # Static assets
├── docs/                # Documentation
│   ├── security/        # Security docs
│   ├── deployment/      # Deployment guides
│   ├── api/             # API documentation
│   └── development/     # Developer guides
└── config/              # Shared configurations
```

## Code Style
- Use consistent indentation (2 spaces)
- Use ES6+ syntax
- Add JSDoc comments for functions
- Test locally before pushing

## Security During Development
- Never commit secrets or .env files
- Use .env.example for templates
- Validate all user inputs
- Use HTTPS for API calls
- Test CORS settings

## Debugging
- Check backend logs: `backend/server.out.log` and `backend/server.err.log`
- Frontend browser console for React errors
- MongoDB connection issues: verify connection string and network access
