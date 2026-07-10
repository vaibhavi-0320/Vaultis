const PLACEHOLDER_PATTERNS = ['YOUR_', 'replace_with_', 'your_', 'placeholder', '_here', 'change_this', 'CHANGE_ME']

function hasPlaceholder(value = '') {
  return PLACEHOLDER_PATTERNS.some((pattern) => String(value).includes(pattern))
}

function isValidMongoUri(value = '') {
  return /^mongodb(\+srv)?:\/\/.+/i.test(String(value).trim()) && !hasPlaceholder(value)
}

function isValidHttpUrl(value = '') {
  try {
    const url = new URL(String(value).trim())
    return ['http:', 'https:'].includes(url.protocol) && !hasPlaceholder(value)
  } catch {
    return false
  }
}

const required = ['JWT_SECRET', 'ENCRYPTION_KEY']

if (process.env.NODE_ENV === 'production') {
  required.push('MONGODB_URI', 'SEPOLIA_RPC_URL')
}

const missing = required.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error('Missing required env vars:', missing.join(', '))
  process.exit(1)
}

const mongoUri = process.env.MONGODB_URI?.trim()
const mongoConfigured = Boolean(mongoUri && isValidMongoUri(mongoUri))

if (!mongoConfigured) {
  const message = 'MONGODB_URI is missing, malformed, or still contains placeholder text. Expected mongodb:// or mongodb+srv://.'
  if (process.env.NODE_ENV === 'production') {
    console.error(message)
    process.exit(1)
  }
  console.warn(`${message} Development will use the local fallback store.`)
}

if (process.env.SEPOLIA_RPC_URL && !isValidHttpUrl(process.env.SEPOLIA_RPC_URL)) {
  console.error('SEPOLIA_RPC_URL must be a valid http(s) Sepolia RPC endpoint and cannot contain placeholder text.')
  process.exit(1)
}

if (process.env.ETHERSCAN_API_KEY && hasPlaceholder(process.env.ETHERSCAN_API_KEY)) {
  console.warn('ETHERSCAN_API_KEY still looks like a placeholder. Etherscan API calls may be rate-limited or disabled.')
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET too short - minimum 32 characters')
  process.exit(1)
}

const KNOWN_BAD_ENCRYPTION_KEYS = new Set([
  'vaultis32charencryptionkey123456' // previously hardcoded fallback — never trust it as a real secret
])

if (process.env.ENCRYPTION_KEY.length < 16 ||
    hasPlaceholder(process.env.ENCRYPTION_KEY) ||
    KNOWN_BAD_ENCRYPTION_KEYS.has(process.env.ENCRYPTION_KEY)) {
  console.error('ENCRYPTION_KEY is missing, a placeholder, or too short (minimum 16 characters). Generate one with: openssl rand -hex 32')
  process.exit(1)
}

if (process.env.AWS_S3_ENABLED === 'true') {
  const requiredS3Vars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET']
  const missingS3 = requiredS3Vars.filter((key) => !process.env[key] || hasPlaceholder(process.env[key]))
  if (missingS3.length > 0) {
    console.error('AWS_S3_ENABLED is true but missing/placeholder S3 config:', missingS3.join(', '))
    process.exit(1)
  }
}

console.log('Environment variables validated')
