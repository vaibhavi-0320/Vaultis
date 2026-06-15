const crypto = require('crypto');

function getKeyBuffer() {
  const rawKey = process.env.ENCRYPTION_KEY || '';
  
  let ENCRYPTION_KEY;
  
  if (rawKey.length === 32) {
    ENCRYPTION_KEY = rawKey;
  } else if (rawKey.length > 32) {
    ENCRYPTION_KEY = rawKey.slice(0, 32);
    console.warn('⚠️  ENCRYPTION_KEY truncated to 32 chars');
  } else if (rawKey.length > 0) {
    ENCRYPTION_KEY = rawKey.padEnd(32, '0');
    console.warn('⚠️  ENCRYPTION_KEY padded to 32 chars');
  } else {
    ENCRYPTION_KEY = 'vaultis32charencryptionkey123456';
    console.warn('⚠️  ENCRYPTION_KEY missing — using default');
  }
  
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
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
