const { ethers } = require('ethers');

let provider = null;
let signer = null;
let contracts = {};
let blockchainStatus = {
  configured: false,
  connected: false,
  mode: 'simulation',
  lastError: null,
  lastCheckedAt: null,
  tokenAddress: null,
  network: 'sepolia'
};

const VAULTIS_TOKEN_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function checkInAndEarn() external',
  'function rewardCheckIn(address to, uint256 amount) external',
  'function mintReward(address to, uint256 amount) external',
  'function canUserCheckIn(address user) view returns (bool)',
  'function getTimeUntilNextCheckIn(address user) view returns (uint256)',
  'function lastCheckIn(address user) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event CheckInRewarded(address indexed user, uint256 amount)'
];

const WILL_REGISTRY_ABI = [
  'function registerWill(bytes32 willHash)',
  'function updateWill(bytes32 newHash)',
  'function verifyWill(address user) view returns (bytes32)',
  'function hasWill(address user) view returns (bool)',
  'function getWillHistory(address user) view returns (bytes32[])',
  'event WillRegistered(address indexed user, bytes32 hash, uint256 timestamp)'
];

const INHERITANCE_TRIGGER_ABI = [
  'function setBeneficiary(address beneficiary)',
  'function confirmDeath(address user)',
  'function releaseAssets(address user)',
  'function getCaseStatus(address user) view returns (uint256, bool, bool)',
  'function requiredConfirmations() view returns (uint256)',
  'event DeathConfirmed(address indexed user, address confirmedBy)',
  'event AssetsReleased(address indexed user, address beneficiary, uint256 timestamp)'
];

const PLACEHOLDER_PATTERNS = ['YOUR_', 'replace_with_', 'your_', 'placeholder'];

function hasRealValue(value = '') {
  const normalized = String(value).trim();
  if (!normalized) {
    return false;
  }

  return !PLACEHOLDER_PATTERNS.some((pattern) => normalized.includes(pattern));
}

const init = () => {
  try {
    if (!hasRealValue(process.env.SEPOLIA_RPC_URL)) {
      blockchainStatus = {
        ...blockchainStatus,
        configured: false,
        connected: false,
        mode: 'simulation',
        lastError: 'SEPOLIA_RPC_URL is not configured',
        lastCheckedAt: new Date().toISOString()
      };
      console.log('Blockchain not configured - running in simulation mode');
      return false;
    }

    provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    blockchainStatus = {
      ...blockchainStatus,
      configured: true,
      connected: true,
      mode: hasRealValue(process.env.DEPLOYER_PRIVATE_KEY) ? 'read-write' : 'read-only',
      lastError: null,
      lastCheckedAt: new Date().toISOString()
    };

    if (hasRealValue(process.env.DEPLOYER_PRIVATE_KEY)) {
      signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
      console.log('Blockchain connected:', signer.address);
    } else {
      console.log('No deployer key configured - blockchain writes will stay in simulation mode');
    }

    if (hasRealValue(process.env.VAULTIS_TOKEN_ADDRESS)) {
      const tokenAddr = process.env.VAULTIS_TOKEN_ADDRESS.trim();
      contracts.token = new ethers.Contract(tokenAddr, VAULTIS_TOKEN_ABI, signer || provider);
      blockchainStatus.tokenAddress = tokenAddr;
      console.log('LVT Token contract loaded:', tokenAddr);
    }

    if (hasRealValue(process.env.WILL_REGISTRY_ADDRESS)) {
      contracts.registry = new ethers.Contract(
        process.env.WILL_REGISTRY_ADDRESS,
        WILL_REGISTRY_ABI,
        signer || provider
      );
    }

    if (hasRealValue(process.env.INHERITANCE_TRIGGER_ADDRESS)) {
      contracts.trigger = new ethers.Contract(
        process.env.INHERITANCE_TRIGGER_ADDRESS,
        INHERITANCE_TRIGGER_ABI,
        signer || provider
      );
    }

    return true;
  } catch (error) {
    console.error('Blockchain init error:', error.message);
    provider = null;
    signer = null;
    contracts = {};
    blockchainStatus = {
      ...blockchainStatus,
      configured: hasRealValue(process.env.SEPOLIA_RPC_URL),
      connected: false,
      mode: 'simulation',
      lastError: error.message,
      lastCheckedAt: new Date().toISOString()
    };
    return false;
  }
};

const getBlockchainStatus = () => ({
  ...blockchainStatus,
  providerReady: Boolean(provider),
  tokenLoaded: Boolean(contracts.token),
  signerReady: Boolean(signer)
});

const getContracts = () => contracts;
const getProvider = () => provider;

const rewardCheckIn = async (walletAddress, amount) => {
  try {
    if (!contracts.token || !signer) {
      return { success: false, simulated: true, txHash: `simulated_${Date.now()}` };
    }

    const tx = await contracts.token.rewardCheckIn(walletAddress, ethers.parseEther(String(amount)));
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash };
  } catch (error) {
    return { success: false, error: error.message, simulated: true };
  }
};

const registerWill = async (willHash) => {
  try {
    if (!contracts.registry || !signer) {
      return { success: false, simulated: true, txHash: `simulated_${Date.now()}` };
    }

    const hashBytes = `0x${willHash.padEnd(64, '0').slice(0, 64)}`;
    const tx = await contracts.registry.registerWill(hashBytes);
    const receipt = await tx.wait();
    return { success: true, txHash: receipt.hash };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const verifyWill = async (walletAddress) => {
  try {
    if (!contracts.registry) {
      return { success: false, hash: null };
    }

    const hash = await contracts.registry.verifyWill(walletAddress);
    return { success: true, hash };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const getTokenBalance = async (walletAddress) => {
  try {
    if (!contracts.token) {
      return { success: false, balance: '0' };
    }

    const balance = await contracts.token.balanceOf(walletAddress);
    return { success: true, balance: ethers.formatEther(balance) };
  } catch (error) {
    return { success: false, balance: '0', error: error.message };
  }
};

module.exports = {
  init,
  rewardCheckIn,
  registerWill,
  verifyWill,
  getTokenBalance,
  getBlockchainStatus,
  getContracts,
  getProvider
};
