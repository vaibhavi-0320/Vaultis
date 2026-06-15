const ActivityLog = require('../models/ActivityLog');
const { isDatabaseReady } = require('../config/db');
const { createActivity } = require('../services/localStore');

async function recordActivity({
  userId,
  actorType = 'user',
  actorId = null,
  eventType,
  title,
  description,
  severity = 'info',
  metadata = {}
}) {
  if (!userId || !eventType || !title) {
    return null;
  }

  try {
    if (!isDatabaseReady()) {
      return await createActivity({
        userId,
        actorType,
        actorId,
        eventType,
        title,
        description: description || '',
        severity,
        metadata
      });
    }

    return await ActivityLog.create({
      userId,
      actorType,
      actorId,
      eventType,
      title,
      description: description || '',
      severity,
      metadata
    });
  } catch (error) {
    console.error('Activity log error:', error.message);
    return null;
  }
}

module.exports = { recordActivity };
