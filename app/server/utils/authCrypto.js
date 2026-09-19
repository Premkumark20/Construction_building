import crypto from 'crypto';

const AUTH_SALT = process.env.AUTH_SALT || 'sk_builders_secure_auth_salt_2026';

/**
 * Deterministically hash username with salt (HMAC-SHA256)
 * Stored in SQLite as a 64-character hex string so usernames are never in plain text.
 * @param {string} username
 * @returns {string} Hex hash of username
 */
export const hashUsername = (username) => {
  if (!username) return '';
  const clean = username.trim().toLowerCase();
  return crypto.createHmac('sha256', AUTH_SALT).update(clean).digest('hex');
};

/**
 * Hash password with a unique random 16-byte salt using scrypt
 * Returns format: "salt:hash"
 * @param {string} password
 * @returns {string} "salt:hash"
 */
export const hashPassword = (password) => {
  if (!password) throw new Error('Password is required for hashing.');
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
};

/**
 * Verify a plain password against the stored "salt:hash" string
 * @param {string} password
 * @param {string} storedHash
 * @returns {boolean}
 */
export const verifyPassword = (password, storedHash) => {
  if (!password || !storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    // Fallback for legacy plain-text password if any
    return password === storedHash;
  }
  const [salt, key] = parts;
  try {
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    return false;
  }
};
