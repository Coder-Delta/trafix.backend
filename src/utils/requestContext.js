export const getRequestId = (req) => req.headers['x-request-id'] || req.id || 'unknown-request';

export const createRequestContext = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  res.locals.requestId = requestId;
  next();
};

export default { getRequestId, createRequestContext };
