/**
 * Shared Configuration
 * Used by both frontend and backend
 */

// Security Configuration
const securityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
  jwt: {
    expiresIn: '7d',
    algorithm: 'HS256',
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    encoding: 'utf-8',
  },
  cors: {
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
};

// Blockchain Configuration
const blockchainConfig = {
  network: 'sepolia',
  rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
  chainId: 11155111, // Sepolia testnet
  tokenAddress: process.env.VAULTIS_TOKEN_ADDRESS,
};

// Feature Flags
const featureFlags = {
  pinataIntegration: Boolean(process.env.PINATA_JWT),
  emailNotifications: Boolean(process.env.GMAIL_USER),
  cronJobs: process.env.NODE_ENV === 'production',
};

module.exports = {
  securityConfig,
  blockchainConfig,
  featureFlags,
};
