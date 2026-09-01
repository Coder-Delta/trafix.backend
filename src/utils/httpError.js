export class HttpError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.name = 'HttpError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const createHttpError = (code, message, statusCode, details = null) =>
  new HttpError(code, message, statusCode, details);

export default { HttpError, createHttpError };
