import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

// The secret that signs login tokens. Anyone who knows it can forge a login as ANY user
// (including admin), so the server refuses to start without a long, private value.
const JWT_SECRET = process.env.JWT_SECRET;
const KNOWN_BAD_SECRETS = [
  'super-secret-kano-laundry-jwt-key-2026',
  'change-me',
  'secret',
];
if (!JWT_SECRET || JWT_SECRET.length < 32 || KNOWN_BAD_SECRETS.includes(JWT_SECRET)) {
  throw new Error(
    'JWT_SECRET is missing, too short (<32 chars) or a known example value. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))" ' +
      'and put it in server/.env as JWT_SECRET=...'
  );
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user details from database to ensure up-to-date role and status
    const result = await query(
      `SELECT u.id, u.email, u.role, u.full_name, u.phone,
              c.id AS customer_id,
              l.id AS laundry_id, l.business_name, l.is_approved
       FROM users u
       LEFT JOIN customers c ON c.user_id = u.id
       LEFT JOIN laundries l ON l.user_id = u.id
       WHERE u.id = $1`,
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    return res.status(403).json({ error: 'Invalid or forged authentication token.' });
  }
}

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err || !decoded) {
      req.user = null;
      return next();
    }
    try {
      const result = await query(
        `SELECT u.id, u.email, u.role, u.full_name,
                c.id AS customer_id,
                l.id AS laundry_id, l.business_name
         FROM users u
         LEFT JOIN customers c ON c.user_id = u.id
         LEFT JOIN laundries l ON l.user_id = u.id
         WHERE u.id = $1`,
        [decoded.id]
      );
      req.user = result.rows[0] || null;
    } catch {
      req.user = null;
    }
    next();
  });
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export default {
  authenticateToken,
  requireRole,
  optionalAuth,
  generateToken,
};
