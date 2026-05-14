# VAULTIS Deployment Guide

## Frontend → Vercel
1. Push to GitHub
2. Connect repo to Vercel
3. Set build command: `cd frontend && npm run build`
4. Set output dir: `frontend/dist`
5. Add environment variable: `VITE_API_URL=your-backend-url`

## Backend → Railway (recommended)
1. Connect repo to Railway
2. Set root directory: `backend`
3. Add ALL environment variables from `backend/.env`
4. Deploy — Railway auto-detects Node.js

## After Deploy
1. Update `FRONTEND_URL` in backend env to your Vercel URL
2. Update `VITE_API_URL` in Vercel env to your Railway or Render URL
3. Test all API routes with production URLs
4. Run smoke tests: register, login, check-in
