import { HttpError } from '../utils/httpError.js';

export const validate = (schema) => (req, res, next) => {
  if (!schema || typeof schema.validate !== 'function') {
    return next();
  }

  const result = schema.validate(req.body, { abortEarly: false, allowUnknown: false });

  if (result.error) {
    const details = result.error.details?.map((item) => ({
      field: item.path.join('.'),
      message: item.message,
    })) || [];

    return next(new HttpError('VALIDATION_ERROR', 'Request validation failed.', 400, details));
  }

  req.body = result.value;
  return next();
};

export const validateQuery = (schema) => (req, res, next) => {
  if (!schema || typeof schema.validate !== 'function') {
    return next();
  }

  const result = schema.validate(req.query, { abortEarly: false, allowUnknown: true });

  if (result.error) {
    const details = result.error.details?.map((item) => ({
      field: item.path.join('.'),
      message: item.message,
    })) || [];

    return next(new HttpError('VALIDATION_ERROR', 'Query validation failed.', 400, details));
  }

  req.query = result.value;
  return next();
};

export default { validate, validateQuery };
