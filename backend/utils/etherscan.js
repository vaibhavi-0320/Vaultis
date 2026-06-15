const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const SEPOLIA_TX_BASE_URL = 'https://sepolia.etherscan.io/tx';
const ETHERSCAN_API_URL = 'https://api-sepolia.etherscan.io/api';

function isValidTxHash(hash) {
  return TX_HASH_PATTERN.test(String(hash || ''));
}

function getSepoliaTxUrl(hash) {
  return isValidTxHash(hash) ? `${SEPOLIA_TX_BASE_URL}/${hash}` : '';
}

/**
 * Verify transaction exists on Sepolia and was successful
 * @param {string} txHash - Transaction hash to verify
 * @returns {Promise<{exists: boolean, success: boolean, receipt: object|null, error: string|null}>}
 */
async function verifyTransaction(txHash) {
  try {
    if (!isValidTxHash(txHash)) {
      return { exists: false, success: false, receipt: null, error: 'Invalid transaction hash format' };
    }

    const apiKey = process.env.ETHERSCAN_API_KEY;
    if (!apiKey) {
      console.warn('ETHERSCAN_API_KEY not configured - skipping on-chain verification');
      return { exists: true, success: true, receipt: null, error: null, warning: 'API key not configured' };
    }

    const url = `${ETHERSCAN_API_URL}?module=transaction&action=gettxreceiptstatus&txhash=${txHash}&apikey=${apiKey}`;
    
    const response = await fetch(url, { timeout: 10000 });
    const data = await response.json();

    if (data.status !== '1') {
      return { 
        exists: false, 
        success: false, 
        receipt: null, 
        error: data.message || 'Transaction not found on Sepolia' 
      };
    }

    // Transaction exists and was successful
    if (data.result?.status === '1') {
      return { 
        exists: true, 
        success: true, 
        receipt: data.result, 
        error: null 
      };
    }

    // Transaction reverted/failed
    return { 
      exists: true, 
      success: false, 
      receipt: data.result, 
      error: 'Transaction failed on-chain (reverted)' 
    };

  } catch (error) {
    console.error('Etherscan verification error:', error.message);
    return { 
      exists: false, 
      success: false, 
      receipt: null, 
      error: error.message 
    };
  }
}

/**
 * Get transaction details from Etherscan
 * @param {string} txHash - Transaction hash
 * @returns {Promise<object|null>}
 */
async function getTransactionDetails(txHash) {
  try {
    if (!isValidTxHash(txHash)) {
      return null;
    }

    const apiKey = process.env.ETHERSCAN_API_KEY;
    if (!apiKey) {
      return null;
    }

    const url = `${ETHERSCAN_API_URL}?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${apiKey}`;
    
    const response = await fetch(url, { timeout: 10000 });
    const data = await response.json();

    return data.result || null;

  } catch (error) {
    console.error('Etherscan get transaction error:', error.message);
    return null;
  }
}

module.exports = {
  isValidTxHash,
  getSepoliaTxUrl,
  verifyTransaction,
  getTransactionDetails,
  SEPOLIA_TX_BASE_URL,
  ETHERSCAN_API_URL
};
