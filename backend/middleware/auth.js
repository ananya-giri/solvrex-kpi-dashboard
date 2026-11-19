import jwt from 'jsonwebtoken';
import db from '../database/dataStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'zero-spend-kpi-dashboard-secret-key-2026';

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};

/**
 * Enforce role access control.
 * Allowed roles: Manager, Analyst, Admin
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Role '${req.user.role}' is not authorized to access this resource.` 
      });
    }
    next();
  };
};

/**
 * Crucial Spec Requirement:
 * "Access control: an analyst cannot open, guess or export another analyst's Individual view."
 * "Role checks on the server, no analyst data in another analyst's export."
 */
export const enforceAnalystIsolation = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  // Managers and Admins can see any analyst
  if (req.user.role === 'Manager' || req.user.role === 'Admin') {
    return next();
  }

  // Analyst role: Must only query their own analyst_id
  if (req.user.role === 'Analyst') {
    const requestedAnalyst = req.query.analystId || req.body.analystId || req.params.analystId;
    
    // If no analyst requested, automatically lock it to their own ID
    if (!requestedAnalyst || requestedAnalyst === 'all') {
      req.query.analystId = req.user.id;
      if (req.body) req.body.analystId = req.user.id;
      return next();
    }

    // If they attempted to query/guess someone else's ID
    if (requestedAnalyst !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden: Access restricted. You can only view and export your own individual data.'
      });
    }
  }

  next();
};
