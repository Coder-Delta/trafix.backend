import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/httpError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw new HttpError('VALIDATION_ERROR', 'Email and password are required.', 400);
    }

    const token = jwt.sign({
      sub: 'operator_placeholder',
      email,
      role: 'operator',
    }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      success: true,
      data: {
        access_token: token,
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: 'operator_placeholder',
          email,
          role: 'operator',
        },
      },
      message: 'TODO: replace with real authentication flow',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body || {};

    if (!refresh_token) {
      throw new HttpError('VALIDATION_ERROR', 'Refresh token is required.', 400);
    }

    const payload = { sub: 'operator_placeholder', role: 'operator' };
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      success: true,
      data: {
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: 3600,
      },
      message: 'TODO: implement refresh token rotation',
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new HttpError('UNAUTHORIZED', 'Authentication required to access this resource.', 401);
    }

    res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email || 'operator@example.com',
        role: req.user.role,
        created_at: new Date().toISOString(),
      },
      message: 'TODO: load user from persistence layer',
    });
  } catch (error) {
    next(error);
  }
};

export default { login, refreshToken, getCurrentUser };
