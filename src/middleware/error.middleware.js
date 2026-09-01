export const errorHandler = (error, req, res, next) => {
  const requestId = req.id || req.headers['x-request-id'] || 'unknown-request';
  const statusCode = Number(error.statusCode || 500);
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'An unexpected error occurred.';

  const payload = {
    success: false,
    error: {
      code,
      message,
      request_id: requestId,
      details: error.details || null,
    },
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.error.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};

export const notFoundHandler = (req, res) => {
  const requestId = req.id || req.headers['x-request-id'] || 'unknown-request';

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found.',
      request_id: requestId,
      details: null,
    },
  });
};

export default { errorHandler, notFoundHandler };
