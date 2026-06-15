/**
 * Input validation schemas for all API endpoints
 * Provides consistent, secure input validation across the application
 */

// Simple validation utilities (alternative to Zod for lighter weight)
// These can be replaced with Zod later for more comprehensive validation

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateWalletAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

const validateTxHash = (hash) => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

const validatePassword = (password) => {
  // At least 12 characters with uppercase, lowercase, number, and symbol
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
  return passwordRegex.test(password);
};

const validateNumber = (value, min = 0, max = Infinity) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

const validateString = (value, minLength = 1, maxLength = Infinity) => {
  const str = String(value).trim();
  return str.length >= minLength && str.length <= maxLength;
};

const validateEnum = (value, allowedValues) => {
  return allowedValues.includes(String(value).toLowerCase());
};

// Sanitize helpers
const sanitizeString = (value) => {
  return String(value).trim().slice(0, 1000); // Limit length
};

const sanitizeHTML = (value) => {
  // Remove HTML tags
  return String(value)
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 1000);
};

// Validation schemas for common operations
const schemas = {
  // Auth
  auth: {
    register: {
      validate: (data) => {
        const errors = [];
        
        if (!data.name || !validateString(data.name, 2, 100)) {
          errors.push('Name must be 2-100 characters');
        }
        
        if (!data.email || !validateEmail(data.email)) {
          errors.push('Valid email required');
        }
        
        if (!data.password || !validatePassword(data.password)) {
          errors.push('Password must be 12+ chars with uppercase, lowercase, number, and symbol (@$!%*?&)');
        }
        
        return { valid: errors.length === 0, errors };
      }
    },
    login: {
      validate: (data) => {
        const errors = [];
        
        if (!data.email || !validateEmail(data.email)) {
          errors.push('Valid email required');
        }
        
        if (!data.password || !validateString(data.password, 1, 500)) {
          errors.push('Password required');
        }
        
        return { valid: errors.length === 0, errors };
      }
    },
    wallet: {
      validate: (data) => {
        const errors = [];
        
        if (!data.walletAddress || !validateWalletAddress(data.walletAddress)) {
          errors.push('Invalid wallet address format (must be 0x + 40 hex chars)');
        }
        
        if (!data.walletType || !validateEnum(data.walletType, ['metamask', 'none'])) {
          errors.push('Wallet type must be metamask or none');
        }
        
        return { valid: errors.length === 0, errors };
      }
    },
    profile: {
      validate: (data) => {
        const errors = [];
        
        if (data.name && !validateString(data.name, 2, 100)) {
          errors.push('Name must be 2-100 characters');
        }
        
        if (data.checkInIntervalDays && !validateNumber(data.checkInIntervalDays, 1, 365)) {
          errors.push('Check-in interval must be 1-365 days');
        }
        
        if (data.primaryBeneficiaryEmail && !validateEmail(data.primaryBeneficiaryEmail)) {
          errors.push('Primary beneficiary email must be valid');
        }
        
        return { valid: errors.length === 0, errors };
      }
    }
  },

  // Assets
  assets: {
    create: {
      validate: (data) => {
        const errors = [];
        
        if (!data.title || !validateString(data.title, 1, 255)) {
          errors.push('Asset title required (1-255 chars)');
        }
        
        if (!data.assetType || !validateString(data.assetType, 1, 50)) {
          errors.push('Asset type required');
        }
        
        if (!data.data || typeof data.data !== 'string') {
          errors.push('Asset data required and must be encrypted string');
        }
        
        if (data.data && data.data.length > 10000000) {
          errors.push('Asset data too large (max 10MB)');
        }
        
        if (data.beneficiaryEmail && !validateEmail(data.beneficiaryEmail)) {
          errors.push('Beneficiary email must be valid');
        }
        
        if (data.priority && !validateEnum(data.priority, ['low', 'medium', 'high'])) {
          errors.push('Priority must be low, medium, or high');
        }
        
        return { valid: errors.length === 0, errors };
      }
    }
  },

  // Contacts
  contacts: {
    create: {
      validate: (data) => {
        const errors = [];
        
        if (!data.name || !validateString(data.name, 1, 100)) {
          errors.push('Contact name required (1-100 chars)');
        }
        
        if (!data.email || !validateEmail(data.email)) {
          errors.push('Contact email required and must be valid');
        }
        
        if (data.weight && !validateNumber(data.weight, 0, 100)) {
          errors.push('Contact weight must be 0-100');
        }
        
        if (data.requiredToConfirm && !validateString(data.requiredToConfirm, 1, 10)) {
          errors.push('Invalid required confirmations value');
        }
        
        return { valid: errors.length === 0, errors };
      }
    }
  },

  // Check-in
  checkin: {
    saveTx: {
      validate: (data) => {
        const errors = [];
        
        if (!data.txHash || !validateTxHash(data.txHash)) {
          errors.push('txHash must be valid Sepolia transaction hash (0x + 64 hex chars)');
        }
        
        if (data.blockNumber && !validateNumber(data.blockNumber, 0)) {
          errors.push('Block number must be a valid positive number');
        }
        
        if (data.lvtRewarded && !validateNumber(data.lvtRewarded, 0, 1000000)) {
          errors.push('LVT rewarded must be between 0 and 1,000,000');
        }
        
        if (data.gasUsed && !validateNumber(data.gasUsed, 0)) {
          errors.push('Gas used must be a valid positive number');
        }
        
        if (data.network && !validateString(data.network, 1, 100)) {
          errors.push('Network name must be 1-100 characters');
        }
        
        if (data.method && !validateString(data.method, 1, 50)) {
          errors.push('Method must be 1-50 characters');
        }
        
        if (data.status && !validateEnum(data.status, ['confirmed', 'pending', 'failed'])) {
          errors.push('Status must be confirmed, pending, or failed');
        }
        
        return { valid: errors.length === 0, errors };
      }
    }
  },

  // Will
  will: {
    create: {
      validate: (data) => {
        const errors = [];
        
        if (!data.content || !validateString(data.content, 10, 50000)) {
          errors.push('Will content required (10-50000 chars)');
        }
        
        if (data.testator && !validateString(data.testator, 2, 100)) {
          errors.push('Testator name must be 2-100 characters');
        }
        
        if (data.beneficiaries && !Array.isArray(data.beneficiaries)) {
          errors.push('Beneficiaries must be an array');
        }
        
        if (data.beneficiaries && data.beneficiaries.length > 100) {
          errors.push('Too many beneficiaries (max 100)');
        }
        
        return { valid: errors.length === 0, errors };
      }
    }
  },

  // Tokens
  tokens: {
    stake: {
      validate: (data) => {
        const errors = [];
        
        if (!data.amount || !validateNumber(data.amount, 0.00001, 1000000000)) {
          errors.push('Stake amount must be between 0.00001 and 1,000,000,000');
        }
        
        return { valid: errors.length === 0, errors };
      }
    }
  },

  // Notifications
  notifications: {
    create: {
      validate: (data) => {
        const errors = [];
        
        if (!data.type || !validateString(data.type, 1, 50)) {
          errors.push('Notification type required (1-50 chars)');
        }
        
        if (!data.title || !validateString(data.title, 1, 255)) {
          errors.push('Notification title required (1-255 chars)');
        }
        
        if (!data.message || !validateString(data.message, 1, 5000)) {
          errors.push('Notification message required (1-5000 chars)');
        }
        
        return { valid: errors.length === 0, errors };
      }
    }
  }
};

module.exports = {
  // Validators
  validateEmail,
  validateWalletAddress,
  validateTxHash,
  validatePassword,
  validateNumber,
  validateString,
  validateEnum,

  // Sanitizers
  sanitizeString,
  sanitizeHTML,

  // Schemas
  schemas
};
