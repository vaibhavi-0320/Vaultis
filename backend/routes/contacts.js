const express = require('express');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { isDatabaseReady } = require('../config/db');
const {
  createContact: createLocalContact,
  deleteContact: deleteLocalContact,
  listContacts,
  updateContact: updateLocalContact,
  updateUser: updateLocalUser
} = require('../services/localStore');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const contacts = isDatabaseReady()
      ? await Contact.find({ userId: req.user._id })
      : await listContacts(req.user._id);
    res.json({ success: true, contacts });
  } catch (error) {
    console.error('GET / error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, email, trustWeight, relationship, phone } = req.body;
    if (!name || !email) return res.status(400).json({
      success: false, message: 'Name and email required'
    });
    const trustScore = trustWeight === 'high' ? 90 :
      trustWeight === 'medium' ? 60 : 30;
    const contact = isDatabaseReady()
      ? await Contact.create({
        userId: req.user._id, name, email,
        trustWeight: trustWeight || 'medium',
        trustScore, relationship: relationship || 'other',
        phone: phone || ''
      })
      : await createLocalContact({
        userId: req.user._id,
        name,
        email,
        trustWeight: trustWeight || 'medium',
        trustScore,
        relationship: relationship || 'other',
        phone: phone || ''
      });
    res.status(201).json({ success: true, contact });
  } catch (error) {
    console.error('POST / error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      const contact = await updateLocalContact(req.user._id, req.params.id, req.body);
      if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
      return res.json({ success: true, contact });
    }
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body, { new: true }
    );
    if (!contact) return res.status(404).json({
      success: false, message: 'Contact not found'
    });
    res.json({ success: true, contact });
  } catch (error) {
    console.error('PUT /:id error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    if (isDatabaseReady()) {
      await Contact.findOneAndDelete({
        _id: req.params.id, userId: req.user._id
      });
    } else {
      await deleteLocalContact(req.user._id, req.params.id);
    }
    res.json({ success: true, message: 'Contact removed' });
  } catch (error) {
    console.error('DELETE /:id error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

const applyVote = async (userId, contactId, vote) => {
  if (!['confirmed', 'denied'].includes(vote)) {
    const error = new Error('Invalid vote');
    error.statusCode = 400;
    throw error;
  }

  let contact;
  let confirmedCount;

  if (!isDatabaseReady()) {
    contact = await updateLocalContact(userId, contactId, {
      voteStatus: vote,
      votedAt: new Date().toISOString()
    });
    if (!contact) {
      const error = new Error('Contact not found');
      error.statusCode = 404;
      throw error;
    }
    const { listContacts: listLocalContacts } = require('../services/localStore');
    const allContacts = await listLocalContacts(userId);
    confirmedCount = allContacts.filter((c) => c.voteStatus === 'confirmed').length;
  } else {
    contact = await Contact.findOneAndUpdate(
      { _id: contactId, userId },
      { voteStatus: vote, votedAt: new Date() },
      { new: true }
    );

    if (!contact) {
      const error = new Error('Contact not found');
      error.statusCode = 404;
      throw error;
    }

    confirmedCount = await Contact.countDocuments({
      userId,
      voteStatus: 'confirmed'
    });
  }

  if (confirmedCount >= 2) {
    if (isDatabaseReady()) {
      await User.findByIdAndUpdate(userId, { status: 'triggered' });
    } else {
      await updateLocalUser(userId, { status: 'triggered' });
    }
  }

  return { contact, confirmedCount };
};

router.get('/confirm/:userId/:contactId/:vote', async (req, res) => {
  try {
    const { userId, contactId, vote } = req.params;
    const { contact, confirmedCount } = await applyVote(userId, contactId, vote);
    res.json({
      success: true,
      vote,
      contact: {
        id: contact._id,
        name: contact.name
      },
      confirmedCount
    });
  } catch (error) {
    console.error('GET /confirm error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.'
    });
  }
});

// Public vote route (email link)
router.get('/vote/:userId/:contactId/:vote', async (req, res) => {
  try {
    const { userId, contactId, vote } = req.params;
    const { contact } = await applyVote(userId, contactId, vote);
    // Redirect to frontend confirmation page
    res.redirect(
      `${process.env.FRONTEND_URL}/confirm/${userId}/${contactId}/${vote}?name=${encodeURIComponent(contact.name)}`
    );
  } catch (error) {
    console.error('GET /vote error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
