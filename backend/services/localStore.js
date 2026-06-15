const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  computeBlockchainSync,
  computeTrustConfidence,
  computeTrustedContactCoverage,
  computeVaultIntegrity
} = require('./vaultMetrics');

const STORE_DIR = path.join(__dirname, '..', 'data');
const STORE_FILE = path.join(STORE_DIR, 'local-store.json');

const defaultStore = () => ({
  users: [],
  notifications: [],
  workflows: [],
  checkins: [],
  activities: [],
  assets: [],
  contacts: [],
  willDocuments: []
});

async function ensureStore() {
  await fs.promises.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.promises.access(STORE_FILE);
  } catch {
    await fs.promises.writeFile(STORE_FILE, JSON.stringify(defaultStore(), null, 2));
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.promises.readFile(STORE_FILE, 'utf8');
  const parsed = JSON.parse(raw);
  return { ...defaultStore(), ...parsed };
}

async function writeStore(store) {
  await ensureStore();
  await fs.promises.writeFile(STORE_FILE, JSON.stringify(store, null, 2));
}

function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function toSafeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

async function findUserByEmail(email) {
  const store = await readStore();
  return store.users.find((user) => user.email === email.toLowerCase()) || null;
}

async function findUserById(id) {
  const store = await readStore();
  return store.users.find((user) => user._id === id) || null;
}

async function createUser(userInput) {
  const store = await readStore();
  const now = new Date().toISOString();
  const user = {
    _id: createId('user'),
    name: userInput.name.trim(),
    email: userInput.email.toLowerCase(),
    password: userInput.password,
    walletAddress: '',
    walletType: 'none',
    ethereumAddress: '',
    primaryBeneficiaryEmail: '',
    lastCheckIn: now,
    checkInIntervalDays: 45,
    status: userInput.status || 'active',
    lvtBalance: userInput.lvtBalance ?? 0,
    stakedAmount: 0,
    stakeStartTime: null,
    totalRewardsEarned: 0,
    checkInStreak: 0,
    profileComplete: false,
    twoFactorEnabled: false,
    lastLogin: now,
    onChainRegistered: false,
    inheritanceTxHash: '',
    createdAt: now,
    updatedAt: now
  };

  store.users.push(user);
  await writeStore(store);
  return user;
}

async function updateUser(id, updates) {
  const store = await readStore();
  const user = store.users.find((entry) => entry._id === id);
  if (!user) return null;

  Object.assign(user, updates, { updatedAt: new Date().toISOString() });
  await writeStore(store);
  return user;
}

async function createWorkflow(userId, values = {}) {
  const store = await readStore();
  const existing = store.workflows.find((workflow) => workflow.userId === userId);
  if (existing) {
    Object.assign(existing, values, { updatedAt: new Date().toISOString() });
    await writeStore(store);
    return existing;
  }

  const now = new Date().toISOString();
  const workflow = {
    _id: createId('workflow'),
    userId,
    status: 'active',
    warningAt: null,
    triggeredAt: null,
    releaseAt: null,
    confirmationsRequired: 2,
    confirmationsReceived: 0,
    lastHeartbeatAt: now,
    lastEvaluationAt: now,
    emergencyPaused: false,
    pauseReason: '',
    createdAt: now,
    updatedAt: now,
    ...values
  };

  store.workflows.push(workflow);
  await writeStore(store);
  return workflow;
}

async function createNotification(values) {
  const store = await readStore();
  const notification = {
    _id: createId('notification'),
    isRead: false,
    data: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...values
  };
  store.notifications.push(notification);
  await writeStore(store);
  return notification;
}

async function getNotifications(userId) {
  const store = await readStore();
  const notifications = store.notifications
    .filter((item) => item.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return {
    notifications: notifications.slice(0, 50),
    unreadCount: notifications.filter((item) => !item.isRead).length
  };
}

async function markAllNotificationsRead(userId) {
  const store = await readStore();
  store.notifications.forEach((item) => {
    if (item.userId === userId && !item.isRead) {
      item.isRead = true;
      item.updatedAt = new Date().toISOString();
    }
  });
  await writeStore(store);
}

async function deleteNotification(userId, id) {
  const store = await readStore();
  store.notifications = store.notifications.filter((item) => !(item.userId === userId && item._id === id));
  await writeStore(store);
}

async function createCheckIn(values) {
  const store = await readStore();
  const checkin = {
    _id: createId('checkin'),
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    txHash: '',
    blockNumber: 0,
    gasUsed: 0,
    status: 'simulated',
    ...values
  };
  store.checkins.push(checkin);
  await writeStore(store);
  return checkin;
}

async function getCheckInHistory(userId) {
  const store = await readStore();
  return store.checkins
    .filter((item) => item.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20);
}

async function saveCheckInTx(userId, values) {
  const store = await readStore();
  const latest = store.checkins
    .filter((item) => item.userId === userId && (!item.txHash || item.txHash === '' || item.txHash === 'offline'))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  if (latest) {
    Object.assign(latest, values, { updatedAt: new Date().toISOString() });
    await writeStore(store);
    return latest;
  }

  const created = {
    _id: createId('checkin'),
    userId,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lvtRewarded: values.lvtRewarded || 10,
    streakBonus: 0,
    txHash: values.txHash || '',
    blockNumber: values.blockNumber || 0,
    gasUsed: values.gasUsed || 0,
    status: values.status || 'pending',
    ipAddress: '',
    userAgent: ''
  };

  store.checkins.push(created);
  await writeStore(store);
  return created;
}

async function listAssets(userId, params = {}) {
  const store = await readStore();
  let assets = store.assets.filter((asset) => asset.userId === userId && asset.isActive !== false);

  if (params.q) {
    const q = String(params.q).toLowerCase();
    assets = assets.filter((asset) =>
      [asset.title, asset.description, ...(asset.tags || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }

  if (params.risk) {
    assets = assets.filter((asset) => asset.riskIndicator === params.risk);
  }

  return assets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function createAsset(values) {
  const store = await readStore();
  const now = new Date().toISOString();
  const asset = {
    _id: createId('asset'),
    createdAt: now,
    updatedAt: now,
    isActive: true,
    onChainRegistered: false,
    blockchainTxHash: '',
    blockchainRegisteredAt: null,
    ipfsCid: '',
    tags: [],
    ...values
  };
  store.assets.push(asset);
  await writeStore(store);
  return asset;
}

async function getAsset(userId, assetId, options = {}) {
  const store = await readStore();
  return store.assets.find((asset) => (
    asset._id === assetId &&
    asset.userId === userId &&
    (options.includeInactive || asset.isActive !== false)
  )) || null;
}

async function updateAsset(userId, assetId, updates) {
  const store = await readStore();
  const asset = store.assets.find((entry) => (
    entry._id === assetId &&
    entry.userId === userId &&
    entry.isActive !== false
  ));
  if (!asset) return null;

  Object.assign(asset, updates, { updatedAt: new Date().toISOString() });
  await writeStore(store);
  return asset;
}

async function archiveAsset(userId, assetId, encryptedData) {
  const store = await readStore();
  const asset = store.assets.find((entry) => entry._id === assetId && entry.userId === userId);
  if (!asset) return null;
  asset.isActive = false;
  asset.encryptedData = encryptedData;
  asset.updatedAt = new Date().toISOString();
  await writeStore(store);
  return asset;
}

async function getAssetHashes(userId) {
  const store = await readStore();
  return store.assets
    .filter((asset) => asset.userId === userId && asset.willHash)
    .map((asset) => ({
      _id: asset._id,
      title: asset.title,
      willHash: asset.willHash,
      onChainRegistered: Boolean(asset.onChainRegistered),
      blockchainTxHash: asset.blockchainTxHash || '',
      createdAt: asset.createdAt
    }));
}

async function listContacts(userId) {
  const store = await readStore();
  return store.contacts.filter((contact) => contact.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function createContact(values) {
  const store = await readStore();
  const now = new Date().toISOString();
  const contact = {
    _id: createId('contact'),
    phone: '',
    verificationStatus: 'pending',
    voteStatus: 'none',
    notificationsSent: 0,
    lastNotified: null,
    verificationToken: '',
    verificationRequestedAt: null,
    votedAt: null,
    createdAt: now,
    updatedAt: now,
    ...values
  };
  store.contacts.push(contact);
  await writeStore(store);
  return contact;
}

async function updateContact(userId, contactId, updates) {
  const store = await readStore();
  const contact = store.contacts.find((entry) => entry._id === contactId && entry.userId === userId);
  if (!contact) return null;
  Object.assign(contact, updates, { updatedAt: new Date().toISOString() });
  await writeStore(store);
  return contact;
}

async function deleteContact(userId, contactId) {
  const store = await readStore();
  const before = store.contacts.length;
  store.contacts = store.contacts.filter((contact) => !(contact.userId === userId && contact._id === contactId));
  await writeStore(store);
  return store.contacts.length !== before;
}

async function getWillDocument(userId) {
  const store = await readStore();
  return store.willDocuments.find((doc) => doc.userId === userId) || null;
}

async function saveWillDocument(userId, values) {
  const store = await readStore();
  const existing = store.willDocuments.find((doc) => doc.userId === userId);
  if (existing) {
    Object.assign(existing, values, { updatedAt: new Date().toISOString() });
    await writeStore(store);
    return existing;
  }

  const doc = {
    _id: createId('will'),
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    blockNumber: null,
    blockchainTxHash: '',
    proofRegisteredAt: null,
    proofStatus: 'draft',
    ...values
  };
  store.willDocuments.push(doc);
  await writeStore(store);
  return doc;
}

async function createActivity(values) {
  const store = await readStore();
  const activity = {
    _id: createId('activity'),
    actorType: 'user',
    actorId: null,
    description: '',
    severity: 'info',
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...values
  };
  store.activities.push(activity);
  await writeStore(store);
  return activity;
}

async function getRecentActivity(userId) {
  const store = await readStore();
  return store.activities
    .filter((item) => item.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);
}

async function getOverviewSummary(userId) {
  const store = await readStore();
  const assets = store.assets.filter((asset) => asset.userId === userId && asset.isActive !== false);
  const contacts = store.contacts.filter((contact) => contact.userId === userId);
  const will = store.willDocuments.find((doc) => doc.userId === userId) || null;
  const workflow = store.workflows.find((item) => item.userId === userId) || null;
  const unreadCount = store.notifications.filter((item) => item.userId === userId && !item.isRead).length;
  const activity = await getRecentActivity(userId);
  const user = store.users.find((entry) => entry._id === userId) || null;

  const trustAverage = computeTrustConfidence({ user, contacts, will, workflow });
  const integrityAverage = computeVaultIntegrity({ user, assets, contacts, will });

  return {
    assetCount: assets.length,
    contactCount: contacts.length,
    unreadCount,
    trustAverage,
    integrityAverage,
    categoryBreakdown: {},
    workflow,
    will,
    activity
  };
}

async function getSecuritySnapshot(userId, user) {
  const store = await readStore();
  const assets = store.assets.filter((asset) => asset.userId === userId && asset.isActive !== false);
  const contacts = store.contacts.filter((contact) => contact.userId === userId);
  const workflow = store.workflows.find((item) => item.userId === userId) || null;
  const encryptedAssets = assets.filter((asset) => asset.encryptionStrength === 'AES-256-GCM').length;
  const will = store.willDocuments.find((doc) => doc.userId === userId) || null;
  const checkins = store.checkins.filter((item) => item.userId === userId);

  return {
    walletConnected: Boolean(user.walletAddress),
    encryptionState: `${encryptedAssets}/${assets.length} AES-256-GCM`,
    vaultHealth: computeVaultIntegrity({ user, assets, contacts, will }),
    blockchainSync: computeBlockchainSync([...assets, ...checkins]),
    smartContractStatus: user.walletAddress ? 'ready' : 'degraded',
    ipfsAvailability: 'unconfigured',
    emergencyPaused: Boolean(workflow?.emergencyPaused),
    sessionSecurity: user.twoFactorEnabled ? 'enhanced' : 'standard',
    trustedContactCoverage: computeTrustedContactCoverage(contacts),
    lastCheckIn: user.lastCheckIn || null
  };
}

async function resetDemoState(userId) {
  const store = await readStore();
  const user = store.users.find((entry) => entry._id === userId);
  if (!user) {
    return null;
  }

  const resetTime = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

  user.lastCheckIn = resetTime;
  user.status = 'active';
  user.lvtBalance = 0;
  user.totalRewardsEarned = 0;
  user.checkInStreak = 0;
  user.updatedAt = new Date().toISOString();

  store.checkins = store.checkins.filter((item) => item.userId !== userId);
  store.notifications = store.notifications.filter((item) => !(item.userId === userId && item.type === 'reward_earned'));

  const workflow = store.workflows.find((item) => item.userId === userId);
  if (workflow) {
    workflow.status = 'active';
    workflow.warningAt = null;
    workflow.triggeredAt = null;
    workflow.releaseAt = null;
    workflow.lastHeartbeatAt = resetTime;
    workflow.lastEvaluationAt = new Date().toISOString();
    workflow.updatedAt = new Date().toISOString();
  }

  await writeStore(store);
  return user;
}

async function deleteUserData(userId) {
  const store = await readStore();
  const before = store.users.length;

  store.users = store.users.filter((user) => user._id !== userId);
  store.notifications = store.notifications.filter((item) => item.userId !== userId);
  store.workflows = store.workflows.filter((item) => item.userId !== userId);
  store.checkins = store.checkins.filter((item) => item.userId !== userId);
  store.activities = store.activities.filter((item) => item.userId !== userId);
  store.assets = store.assets.filter((item) => item.userId !== userId);
  store.contacts = store.contacts.filter((item) => item.userId !== userId);
  store.willDocuments = store.willDocuments.filter((item) => item.userId !== userId);

  await writeStore(store);
  return store.users.length !== before;
}

module.exports = {
  toSafeUser,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  createWorkflow,
  createNotification,
  getNotifications,
  markAllNotificationsRead,
  deleteNotification,
  createCheckIn,
  getCheckInHistory,
  saveCheckInTx,
  listAssets,
  createAsset,
  getAsset,
  updateAsset,
  archiveAsset,
  getAssetHashes,
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  getWillDocument,
  saveWillDocument,
  createActivity,
  getOverviewSummary,
  getSecuritySnapshot,
  resetDemoState,
  deleteUserData
};
