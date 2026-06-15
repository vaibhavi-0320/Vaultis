# Environment Variables Checklist

## Production Environment Variables

All variables must be configured before deployment to Vercel.

### Server Configuration
- `NODE_ENV`: Set to `production`
- `PORT`: Leave unset (Vercel assigns automatically)

### Database
- `MONGODB_URI`: MongoDB Atlas connection string with credentials
  - Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname`
  - Set `retryWrites=true&w=majority` in connection string

### Authentication & Encryption
- `JWT_SECRET`: 32-character random string
  - Generate: `openssl rand -base64 32`
- `JWT_EXPIRES_IN`: Token expiration (default: `7d`)
- `ENCRYPTION_KEY`: 32-character hex string for AES-256-GCM
  - Generate: `openssl rand -hex 16`

### Email Configuration
- `GMAIL_USER`: Email address for sending notifications
- `GMAIL_PASS`: Gmail app-specific password (not regular password)

### Frontend Integration
- `FRONTEND_URL`: Production frontend URL for CORS

### Blockchain (Sepolia Testnet)
- `SEPOLIA_RPC_URL`: Ethereum Sepolia RPC endpoint
- `ETHERSCAN_API_KEY`: Etherscan API key for verification
- `DEPLOYER_PRIVATE_KEY`: Private key for contract interactions (hex format)
- `VAULTIS_TOKEN_ADDRESS`: Deployed LVT token contract address
- `WILL_REGISTRY_ADDRESS`: Will registry contract (if applicable)
- `INHERITANCE_TRIGGER_ADDRESS`: Trigger contract (if applicable)

### Optional: IPFS/Pinata
- `PINATA_JWT`: Pinata JWT token
- `PINATA_API_KEY`: Pinata API key
- `PINATA_API_SECRET`: Pinata API secret

### Cron Jobs
- `CRON_SCHEDULE`: Cron expression for scheduled tasks (default: `0 0 * * *`)

## Security Best Practices
1. Never commit `.env` file to version control
2. Use `.env.example` template with placeholders
3. Rotate secrets regularly
4. Use strong, randomly generated secrets
5. Store secrets in Vercel environment variables, not in code
6. Enable branch protection for main branch
7. Review environment variables before each deployment
