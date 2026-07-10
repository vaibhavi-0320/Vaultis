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
 * Verify transaction exists on Sepolia, was successful, and (optionally) was sent
 * to/from the expected addresses — prevents replaying an unrelated successful tx
 * to claim a reward.
 * @param {string} txHash - Transaction hash to verify
 * @param {{expectedTo?: string, expectedFrom?: string}} [options]
 * @returns {Promise<{exists: boolean, success: boolean, receipt: object|null, error: string|null}>}
 */
async function verifyTransaction(txHash, options = {}) {
  try {
    if (!isValidTxHash(txHash)) {
      return { exists: false, success: false, receipt: null, error: 'Invalid transaction hash format' };
    }

    const apiKey = process.env.ETHERSCAN_API_KEY;
    if (!apiKey) {
      // Fail closed: without a way to verify on-chain, never grant an unverified reward.
      return {
        exists: false,
        success: false,
        receipt: null,
        error: 'On-chain verification is not configured (ETHERSCAN_API_KEY missing)'
      };
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

    // Transaction reverted/failed
    if (data.result?.status !== '1') {
      return {
        exists: true,
        success: false,
        receipt: data.result,
        error: 'Transaction failed on-chain (reverted)'
      };
    }

    const { expectedTo, expectedFrom } = options;
    if (expectedTo || expectedFrom) {
      const details = await getTransactionDetails(txHash);
      if (!details) {
        return { exists: true, success: false, receipt: data.result, error: 'Unable to fetch transaction details for verification' };
      }
      if (expectedTo && String(details.to).toLowerCase() !== String(expectedTo).toLowerCase()) {
        return { exists: true, success: false, receipt: data.result, error: 'Transaction was not sent to the VAULTIS token contract' };
      }
      if (expectedFrom && String(details.from).toLowerCase() !== String(expectedFrom).toLowerCase()) {
        return { exists: true, success: false, receipt: data.result, error: 'Transaction sender does not match your registered wallet' };
      }
    }

    // Transaction exists, succeeded, and (if requested) matches expected addresses
    return {
      exists: true,
      success: true,
      receipt: data.result,
      error: null
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
