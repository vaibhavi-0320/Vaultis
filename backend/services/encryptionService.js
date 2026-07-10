const crypto = require('crypto');

function getKeyBuffer() {
  const rawKey = process.env.ENCRYPTION_KEY || '';

  // No fallback: a missing/placeholder key must fail loudly (validateEnv.js already
  // refuses to boot without one) rather than silently encrypting with a key baked into source.
  if (!rawKey) {
    throw new Error('ENCRYPTION_KEY is not configured. Refusing to encrypt/decrypt with no key.');
  }

  // The raw string is hashed to derive a 32-byte AES-256 key, so any non-empty
  // secret of sufficient length is safe input regardless of its literal length.
  return crypto.createHash('sha256').update(rawKey).digest();
}

const encrypt = (text) => {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKeyBuffer(), iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    payload: encrypted.toString('hex')
  });
};

const decrypt = (encryptedText) => {
  if (!encryptedText) return '';
  try {
    const parsed = JSON.parse(encryptedText);
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      getKeyBuffer(),
      Buffer.from(parsed.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(parsed.authTag, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(parsed.payload, 'hex')),
      decipher.final()
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '[Decryption failed]';
  }
};

const hashData = (data) => {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
};

const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

module.exports = { encrypt, decrypt, hashData, generateToken };
