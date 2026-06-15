const CheckIn = require('../models/CheckIn');
const { isDatabaseReady } = require('../config/db');
const { getBlockchainStatus, getContracts } = require('./blockchainService');
const { isValidTxHash } = require('../utils/etherscan');

let listenerState = {
  running: false,
  lastError: null,
  lastEventAt: null,
  lastTxHash: null
};

async function markTransactionConfirmed(txHash, blockNumber) {
  if (!isDatabaseReady() || !isValidTxHash(txHash)) {
    return;
  }

  await CheckIn.findOneAndUpdate(
    { txHash },
    {
      status: 'confirmed',
      blockNumber,
      updatedAt: new Date()
    },
    { new: true }
  );
}

function startEventListener() {
  const { token } = getContracts();
  const blockchain = getBlockchainStatus();

  if (!token || !blockchain.connected) {
    listenerState = {
      ...listenerState,
      running: false,
      lastError: 'LVT token contract is not configured'
    };
    console.log('Blockchain event listener not started: token contract is not configured.');
    return false;
  }

  if (listenerState.running) {
    return true;
  }

  try {
    token.on('Transfer', async (_from, _to, _value, event) => {
      try {
        const txHash = event?.log?.transactionHash || event?.transactionHash || '';
        const blockNumber = event?.log?.blockNumber || event?.blockNumber || 0;
        listenerState = {
          ...listenerState,
          lastEventAt: new Date().toISOString(),
          lastTxHash: txHash,
          lastError: null
        };
        await markTransactionConfirmed(txHash, blockNumber);
      } catch (error) {
        listenerState = {
          ...listenerState,
          lastError: error.message
        };
        console.error(`Transfer event handling failed: ${error.message}`);
      }
    });

    listenerState = {
      ...listenerState,
      running: true,
      lastError: null
    };
    console.log('Blockchain event listener started for LVT Transfer events.');
    return true;
  } catch (error) {
    listenerState = {
      ...listenerState,
      running: false,
      lastError: error.message
    };
    console.error(`Blockchain event listener failed to start: ${error.message}`);
    return false;
  }
}

function getEventListenerStatus() {
  return { ...listenerState };
}

module.exports = {
  startEventListener,
  getEventListenerStatus
};
