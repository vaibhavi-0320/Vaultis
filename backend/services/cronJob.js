const cron = require('node-cron');
const User = require('../models/User');
const Contact = require('../models/Contact');
const Asset = require('../models/Asset');
const Notification = require('../models/Notification');
const InheritanceWorkflow = require('../models/InheritanceWorkflow');
const WillDocument = require('../models/WillDocument');
const { sendCheckInReminder, sendContactAlert, sendAssetReleasedEmail } = require('./emailService');
const { recordActivity } = require('../utils/activity');
const { registerWill } = require('./blockchainService');
const { generateToken } = require('./encryptionService');

const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    await Notification.create({ userId, type, title, message, data });
  } catch (err) {
    console.error('Notification create error:', err.message);
  }
};

const runDeadManSwitch = async () => {
  console.log(`[CRON] Running dead man switch check: ${new Date().toISOString()}`);

  try {
    const usersNeedingSync = await User.find({
      walletAddress: { $ne: '' },
      onChainRegistered: false
    }).select('_id walletAddress ethereumAddress')

    for (const user of usersNeedingSync) {
      const will = await WillDocument.findOne({ userId: user._id, proofStatus: { $ne: 'registered' } })
      if (!will?.sha256Hash) {
        continue
      }

      const result = await registerWill(will.sha256Hash)
      if (result.success) {
        await Promise.all([
          User.findByIdAndUpdate(user._id, {
            onChainRegistered: true,
            inheritanceTxHash: result.txHash || ''
          }),
          WillDocument.findByIdAndUpdate(will._id, {
            proofStatus: 'registered',
            blockchainTxHash: result.txHash || '',
            proofRegisteredAt: new Date()
          })
        ])
        console.log(`[CRON] On-chain will sync confirmed for user ${user._id}`)
      } else {
        console.log(`[CRON] On-chain will sync simulated for user ${user._id}: ${result.error || 'simulation mode'}`)
      }
    }

    const now = new Date();
    const day45ago = new Date(now - 45 * 24 * 60 * 60 * 1000);
    const day60ago = new Date(now - 60 * 24 * 60 * 60 * 1000);

    const warnUsers = await User.find({
      lastCheckIn: { $lt: day45ago },
      status: 'active'
    });

    for (const user of warnUsers) {
      await sendCheckInReminder(user.email, user.name, 15);
      await User.findByIdAndUpdate(user._id, { status: 'warning' });
      await InheritanceWorkflow.findOneAndUpdate(
        { userId: user._id },
        { status: 'warning', warningAt: now, lastEvaluationAt: now },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await createNotification(
        user._id,
        'warning',
        'Check-in required',
        'No activity for 45 days. Check in within 15 days.',
        { daysInactive: 45 }
      );

      await recordActivity({
        userId: user._id,
        actorType: 'system',
        eventType: 'inheritance_warning',
        title: 'Heartbeat warning issued',
        description: 'No recent check-in detected; warning window has started.',
        severity: 'warning'
      });
    }

    const triggerUsers = await User.find({
      lastCheckIn: { $lt: day60ago },
      status: 'warning'
    });

    for (const user of triggerUsers) {
      const contacts = await Contact.find({ userId: user._id });
      for (const contact of contacts) {
        const token = generateToken();
        await sendContactAlert(contact.email, contact.name, user.name, user._id, contact._id, token);
        await Contact.findByIdAndUpdate(contact._id, {
          notificationsSent: contact.notificationsSent + 1,
          lastNotified: new Date(),
          verificationToken: token
        });
      }

      await User.findByIdAndUpdate(user._id, { status: 'triggered' });
      await InheritanceWorkflow.findOneAndUpdate(
        { userId: user._id },
        {
          status: 'triggered',
          triggeredAt: now,
          lastEvaluationAt: now,
          releaseAt: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await createNotification(
        user._id,
        'triggered',
        'Inheritance triggered',
        'Trusted contacts have been notified.',
        { triggeredAt: new Date() }
      );

      await recordActivity({
        userId: user._id,
        actorType: 'system',
        eventType: 'inheritance_triggered',
        title: 'Inheritance sequence triggered',
        description: 'Trusted contacts were alerted after inactivity threshold breach.',
        severity: 'critical'
      });
    }

    const triggeredUsers = await User.find({ status: 'triggered' });
    for (const user of triggeredUsers) {
      const confirmedCount = await Contact.countDocuments({
        userId: user._id,
        voteStatus: 'confirmed'
      });

      if (confirmedCount < 2) {
        continue;
      }

      const daysSinceTrigger = Math.floor((now - user.updatedAt) / (1000 * 60 * 60 * 24));
      let stageToRelease = 0;
      if (daysSinceTrigger >= 7) stageToRelease = 3;
      else if (daysSinceTrigger >= 3) stageToRelease = 2;
      else if (daysSinceTrigger >= 1) stageToRelease = 1;

      if (stageToRelease === 0) {
        continue;
      }

      const assets = await Asset.find({
        userId: user._id,
        releaseStage: { $lte: stageToRelease },
        isReleased: false
      });

      if (!assets.length) {
        continue;
      }

      await Asset.updateMany(
        { userId: user._id, releaseStage: { $lte: stageToRelease } },
        { isReleased: true, releasedAt: new Date() }
      );

      const beneficiaries = [...new Set(assets.map((asset) => asset.beneficiaryEmail))];
      for (const email of beneficiaries) {
        const beneficiaryAssets = assets.filter((asset) => asset.beneficiaryEmail === email);
        await sendAssetReleasedEmail(
          email,
          beneficiaryAssets[0].beneficiaryName,
          beneficiaryAssets.length,
          stageToRelease
        );
      }

      await createNotification(
        user._id,
        'asset_released',
        `Stage ${stageToRelease} released`,
        `${assets.length} assets released to beneficiaries.`
      );

      await recordActivity({
        userId: user._id,
        actorType: 'system',
        eventType: 'beneficiary_release',
        title: `Stage ${stageToRelease} release executed`,
        description: `${assets.length} assets unlocked for beneficiaries.`,
        severity: 'critical'
      });
    }
  } catch (error) {
    console.error('[CRON] Error:', error.message);
  }
};

const startCronJobs = () => {
  cron.schedule(process.env.CRON_SCHEDULE || '0 0 * * *', runDeadManSwitch);
  console.log('Cron jobs started (dead man switch active)');
};

module.exports = { startCronJobs, runDeadManSwitch };
