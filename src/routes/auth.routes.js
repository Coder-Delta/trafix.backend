import express from 'express';
import { login, refreshToken, getCurrentUser } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { publicAccess, requireOperator, requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

const loginSchema = {
  validate: (payload) => {
    const body = payload || {};
    const errors = [];

    if (!body.email || typeof body.email !== 'string') errors.push({ path: ['email'], message: 'email is required and must be a string' });
    if (!body.password || typeof body.password !== 'string') errors.push({ path: ['password'], message: 'password is required and must be a string' });

    if (errors.length) {
      const error = new Error('login validation failed');
      error.details = errors;
      error.name = 'ValidationError';
      return { error, value: body };
    }

    return { value: body, error: null };
  },
};

const refreshSchema = {
  validate: (payload) => {
    const body = payload || {};
if (!body.refresh_token || typeof body.refresh_token !== 'string') {
      const error = new Error('refresh_token is required');
      error.details = [{ path: ['refresh_token'], message: 'refresh_token is required and must be a string' }];
      error.name = 'ValidationError';
      return { error, value: body };
    }
    return { value: body, error: null };
  },
};

router.post('/login', publicAccess, validate(loginSchema), login);
router.post('/refresh', publicAccess, validate(refreshSchema), refreshToken);
router.get('/me', requireOperator, getCurrentUser);

export default router;
