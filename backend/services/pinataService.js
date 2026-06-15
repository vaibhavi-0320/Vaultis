const PINATA_GATEWAY = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

const isConfigured = () =>
  Boolean(process.env.PINATA_JWT || (process.env.PINATA_API_KEY && process.env.PINATA_API_SECRET));

async function uploadVaultPayload(payload, name) {
  if (!isConfigured()) {
    return { success: false, simulated: true, message: 'Pinata credentials not configured' };
  }

  const headers = {
    'Content-Type': 'application/json'
  };

  if (process.env.PINATA_JWT) {
    headers.Authorization = `Bearer ${process.env.PINATA_JWT}`;
  } else {
    headers.pinata_api_key = process.env.PINATA_API_KEY;
    headers.pinata_secret_api_key = process.env.PINATA_API_SECRET;
  }

  const response = await fetch(PINATA_GATEWAY, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      pinataMetadata: {
        name
      },
      pinataContent: payload
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.reason || data.message || 'Pinata upload failed');
  }

  return {
    success: true,
    cid: data.IpfsHash,
    size: data.PinSize,
    timestamp: data.Timestamp
  };
}

module.exports = { uploadVaultPayload, isConfigured };
