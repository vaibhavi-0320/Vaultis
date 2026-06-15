function percent(completed, total) {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

function isTrustedContact(contact) {
  return contact?.verificationStatus === 'verified' || Number(contact?.trustScore || 0) >= 70;
}

function hasValidWalletAddress(value = '') {
  return /^0x[0-9a-fA-F]{40}$/.test(String(value || ''));
}

function computeTrustedContactCoverage(contacts = []) {
  if (!contacts.length) {
    return 0;
  }

  const trusted = contacts.filter(isTrustedContact);
  return percent(trusted.length, contacts.length);
}

function computeTrustConfidence({ user, contacts = [], will, workflow }) {
  const checks = [
    Boolean(user?.walletAddress || user?.ethereumAddress),
    contacts.length > 0 && contacts.some(isTrustedContact),
    Boolean(will && (will.proofStatus === 'registered' || will.sha256Hash || will.blockchainTxHash)),
    Boolean(workflow && !workflow.emergencyPaused && workflow.lastHeartbeatAt)
  ];

  return percent(checks.filter(Boolean).length, checks.length);
}

function computeVaultIntegrity({ user, assets = [], contacts = [], will }) {
  const encryptedAssets = assets.filter((asset) => asset.encryptionStrength === 'AES-256-GCM');
  const hasEncryptedState = assets.length ? encryptedAssets.length === assets.length : Boolean(will?.encryptedContent || will?.sha256Hash);
  const hasSmartContractState = Boolean(user?.onChainRegistered || will?.blockchainTxHash || assets.some((asset) => asset.onChainRegistered || asset.blockchainTxHash));
  const hasTrustedCoverage = contacts.some(isTrustedContact);

  return percent([hasEncryptedState, hasSmartContractState, hasTrustedCoverage].filter(Boolean).length, 3);
}

function computeBlockchainSync(records = []) {
  if (!records.length) {
    return 0;
  }

  const synced = records.filter((record) => record.onChainRegistered || record.blockchainTxHash || record.status === 'confirmed');
  return percent(synced.length, records.length);
}

module.exports = {
  computeBlockchainSync,
  computeTrustConfidence,
  computeTrustedContactCoverage,
  computeVaultIntegrity,
  hasValidWalletAddress,
  isTrustedContact
};
