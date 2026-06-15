const express = require('express');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { isDatabaseReady } = require('../config/db');
const {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead
} = require('../services/localStore');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const result = isDatabaseReady()
      ? {
          notifications: await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50),
          unreadCount: await Notification.countDocuments({ userId: req.user._id, isRead: false })
        }
      : await getNotifications(req.user._id);

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('GET / error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.put('/read-all', protect, async (req, res) => {
  try {
    if (isDatabaseReady()) {
      await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    } else {
      await markAllNotificationsRead(req.user._id);
    }

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('PUT /read-all error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    if (isDatabaseReady()) {
      await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    } else {
      await deleteNotification(req.user._id, req.params.id);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /:id error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
