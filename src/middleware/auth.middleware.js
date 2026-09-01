import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/httpError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export const publicAccess = (req, res, next) => next();

export const authorize = (roles = ['operator']) => (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return next(new HttpError('UNAUTHORIZED', 'Authentication token is required.', 401));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.sub || decoded.userId || 'unknown-user',
      role: decoded.role || 'operator',
      email: decoded.email || null,
    };

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(new HttpError('FORBIDDEN', 'User role is not allowed to perform this action.', 403));
    }

    return next();
  } catch (error) {
    return next(new HttpError('UNAUTHORIZED', 'Invalid or expired token.', 401));
  }
};

export const requireOperator = authorize(['operator', 'admin']);
export const requireAdmin = authorize(['admin']);

export const authOptional = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.sub || decoded.userId || 'unknown-user',
      role: decoded.role || 'operator',
      email: decoded.email || null,
    };
    return next();
  } catch (error) {
    req.user = null;
    return next();
  }
};

export default {
  publicAccess,
  authorize,
  requireOperator,
  requireAdmin,
  authOptional,
};
