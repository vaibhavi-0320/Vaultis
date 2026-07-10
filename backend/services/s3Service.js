const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');

const isEnabled = () => process.env.AWS_S3_ENABLED === 'true';

let client = null;

const getClient = () => {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }
  return client;
};

const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
};

/**
 * Upload an already-encrypted (AES-256-GCM) text blob to S3.
 * @param {string} key - object key, e.g. `wills/{userId}.enc`
 * @param {string} encryptedText - ciphertext JSON produced by encryptionService.encrypt
 */
const uploadEncryptedBlob = async (key, encryptedText) => {
  if (!isEnabled()) {
    throw new Error('AWS S3 storage is not enabled (set AWS_S3_ENABLED=true)');
  }
  await getClient().send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: encryptedText,
    ContentType: 'application/json'
  }));
  return key;
};

const getEncryptedBlob = async (key) => {
  if (!isEnabled()) {
    throw new Error('AWS S3 storage is not enabled (set AWS_S3_ENABLED=true)');
  }
  const result = await getClient().send(new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  }));
  return streamToString(result.Body);
};

const deleteEncryptedBlob = async (key) => {
  if (!isEnabled()) {
    return;
  }
  await getClient().send(new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key
  }));
};

module.exports = { isEnabled, uploadEncryptedBlob, getEncryptedBlob, deleteEncryptedBlob };
