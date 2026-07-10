const express = require('express');
const crypto = require('crypto');
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

const CONTACT_UPDATE_FIELDS = ['name', 'email', 'trustWeight', 'relationship', 'phone'];

const pickAllowedFields = (body, fields) => fields.reduce((acc, field) => {
  if (Object.prototype.hasOwnProperty.call(body, field)) {
    acc[field] = body[field];
  }
  return acc;
}, {});

const tokensMatch = (provided, expected) => {
  if (!expected || !provided) return false;
  const providedBuf = Buffer.from(String(provided));
  const expectedBuf = Buffer.from(String(expected));
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
};

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
    const updates = pickAllowedFields(req.body, CONTACT_UPDATE_FIELDS);

    if (!isDatabaseReady()) {
      const contact = await updateLocalContact(req.user._id, req.params.id, updates);
      if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
      return res.json({ success: true, contact });
    }
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates, { new: true }
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

const applyVote = async (userId, contactId, vote, token) => {
  if (!['confirmed', 'denied'].includes(vote)) {
    const error = new Error('Invalid vote');
    error.statusCode = 400;
    throw error;
  }

  let contact;
  let confirmedCount;

  if (!isDatabaseReady()) {
    const { listContacts: listLocalContacts } = require('../services/localStore');
    const existing = (await listLocalContacts(userId)).find((c) => c._id === contactId);
    if (!existing) {
      const error = new Error('Contact not found');
      error.statusCode = 404;
      throw error;
    }
    if (!tokensMatch(token, existing.verificationToken)) {
      const error = new Error('Invalid or expired confirmation link');
      error.statusCode = 403;
      throw error;
    }

    contact = await updateLocalContact(userId, contactId, {
      voteStatus: vote,
      votedAt: new Date().toISOString(),
      verificationToken: ''
    });
    const allContacts = await listLocalContacts(userId);
    confirmedCount = allContacts.filter((c) => c.voteStatus === 'confirmed').length;
  } else {
    const existing = await Contact.findOne({ _id: contactId, userId });
    if (!existing) {
      const error = new Error('Contact not found');
      error.statusCode = 404;
      throw error;
    }
    if (!tokensMatch(token, existing.verificationToken)) {
      const error = new Error('Invalid or expired confirmation link');
      error.statusCode = 403;
      throw error;
    }

    contact = await Contact.findOneAndUpdate(
      { _id: contactId, userId },
      { voteStatus: vote, votedAt: new Date(), verificationToken: '' },
      { new: true }
    );

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

// Public vote route (email link) — the sole endpoint that casts a vote.
// Token-gated to prevent forging a beneficiary confirmation without the emailed link.
// Redirects to the frontend confirm page, which only ever displays the result.
router.get('/vote/:userId/:contactId/:vote', async (req, res) => {
  const { userId, contactId, vote } = req.params;
  try {
    const { contact } = await applyVote(userId, contactId, vote, req.query.token);
    res.redirect(
      `${process.env.FRONTEND_URL}/confirm/${userId}/${contactId}/${vote}?success=true&name=${encodeURIComponent(contact.name)}`
    );
  } catch (error) {
    console.error('GET /vote error:', error);
    const message = error.statusCode ? error.message : 'Something went wrong. Please try again.';
    res.redirect(
      `${process.env.FRONTEND_URL}/confirm/${userId}/${contactId}/${vote}?success=false&error=${encodeURIComponent(message)}`
    );
  }
});

module.exports = router;
