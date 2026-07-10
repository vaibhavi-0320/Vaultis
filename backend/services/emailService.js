const nodemailer = require('nodemailer');

const isConfigured = () => {
  return process.env.GMAIL_USER && 
         process.env.GMAIL_PASS &&
         !process.env.GMAIL_USER.includes('YOUR_GMAIL');
};

const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { 
      user: process.env.GMAIL_USER, 
      pass: process.env.GMAIL_PASS 
    }
  });
};

const sendEmail = async (to, subject, html) => {
  if (!isConfigured()) {
    console.log(`[EMAIL SKIPPED] To: ${to} | Subject: ${subject}`);
    return { success: true, skipped: true };
  }
  try {
    await getTransporter().sendMail({
      from: `"VAULTIS" <${process.env.GMAIL_USER}>`,
      to, subject, html
    });
    return { success: true };
  } catch (error) {
    console.error('Email error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendWelcomeEmail = (email, name) => sendEmail(
  email,
  'Welcome to VAULTIS — Your Digital Legacy is Secure',
  `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h1 style="color:#3b82f6">Welcome to VAULTIS, ${name}!</h1>
    <p>Your digital inheritance vault is now active.</p>
    <p>You've received <strong>100 LVT tokens</strong> to get started.</p>
    <p>Remember to check in every 45 days to keep your vault active.</p>
    <a href="${process.env.FRONTEND_URL}/dashboard" 
       style="background:#3b82f6;color:white;padding:12px 24px;
       border-radius:8px;text-decoration:none;display:inline-block;
       margin-top:16px">Open Dashboard</a>
  </div>`
);

const sendCheckInReminder = (email, name, daysLeft) => sendEmail(
  email,
  `VAULTIS — Check-in Required (${daysLeft} days left)`,
  `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h2 style="color:#f59e0b">⚠️ Activity Check Required</h2>
    <p>Hi ${name},</p>
    <p>No activity detected on your VAULTIS account.</p>
    <p><strong>Check in within ${daysLeft} days</strong> or your 
    trusted contacts will be notified.</p>
    <a href="${process.env.FRONTEND_URL}/dashboard"
       style="background:#f59e0b;color:white;padding:12px 24px;
       border-radius:8px;text-decoration:none;display:inline-block;
       margin-top:16px">Check In Now</a>
  </div>`
);

const sendContactAlert = (contactEmail, contactName,
                           userName, userId, contactId, token) => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const tokenParam = `?token=${encodeURIComponent(token)}`;
  const confirmUrl =
    `${backendUrl}/api/contacts/vote/${userId}/${contactId}/confirmed${tokenParam}`;
  const denyUrl =
    `${backendUrl}/api/contacts/vote/${userId}/${contactId}/denied${tokenParam}`;
  return sendEmail(
    contactEmail,
    `VAULTIS — Please confirm status of ${userName}`,
    `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#8b5cf6">Trusted Contact Verification</h2>
      <p>Hi ${contactName},</p>
      <p>You are a trusted contact for <strong>${userName}</strong> 
      on VAULTIS.</p>
      <p>We have not detected activity from them in 60 days.</p>
      <p>Please confirm their status:</p>
      <a href="${confirmUrl}"
         style="background:#ef4444;color:white;padding:12px 24px;
         border-radius:8px;text-decoration:none;display:inline-block;
         margin-right:12px">Confirm Inactive</a>
      <a href="${denyUrl}"
         style="background:#22c55e;color:white;padding:12px 24px;
         border-radius:8px;text-decoration:none;display:inline-block">
        They Are Active</a>
    </div>`
  );
};

const sendAssetReleasedEmail = (email, name, assetCount, stage) => sendEmail(
  email,
  `VAULTIS — Stage ${stage} Assets Have Been Released`,
  `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
    <h2 style="color:#3b82f6">Assets Released</h2>
    <p>Hi ${name},</p>
    <p><strong>${assetCount} assets</strong> from Stage ${stage} 
    have been released to you.</p>
    <a href="${process.env.FRONTEND_URL}/beneficiary?public=true"
       style="background:#3b82f6;color:white;padding:12px 24px;
       border-radius:8px;text-decoration:none;display:inline-block;
       margin-top:16px">View Released Assets</a>
  </div>`
);

module.exports = { 
  sendWelcomeEmail, sendCheckInReminder, 
  sendContactAlert, sendAssetReleasedEmail 
};
