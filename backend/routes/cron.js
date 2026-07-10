const express = require('express');
const { runDeadManSwitch } = require('../services/cronJob');

const router = express.Router();

// Vercel Cron Jobs send `Authorization: Bearer <CRON_SECRET>` automatically when
// a CRON_SECRET env var is configured on the project. On serverless, node-cron
// (server.js's startCronJobs) never runs — this endpoint is the replacement,
// meant to be hit on a schedule by Vercel Cron (see vercel.json) or an external
// scheduler. Requires CRON_SECRET in production to prevent public triggering.
router.get('/run', async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = req.headers.authorization || '';
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  } else if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      success: false,
      message: 'CRON_SECRET is not configured. Refusing to run unauthenticated in production.'
    });
  }

  try {
    await runDeadManSwitch();
    res.json({ success: true, message: 'Dead man switch evaluation complete', ranAt: new Date().toISOString() });
  } catch (error) {
    console.error('POST /cron/run error:', error);
    res.status(500).json({ success: false, message: 'Cron run failed', error: error.message });
  }
});

module.exports = router;
