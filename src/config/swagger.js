export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Trafix AI Backend API',
    version: '0.0.1',
    description: 'OpenAPI-ready scaffold for the Trafix AI backend. Implementation details are intentionally stubbed.',
  },
  servers: [{ url: '/api/v1', description: 'API base URL' }],
  paths: {
    '/events/detection': { post: { summary: 'Receive AI detection event' } },
    '/events/batch': { post: { summary: 'Receive batched AI detection events' } },
    '/cameras': { get: { summary: 'List cameras' } },
    '/vehicles/search': { get: { summary: 'Search vehicles' } },
    '/traffic': { get: { summary: 'Get traffic overview' } },
    '/analytics/overview': { get: { summary: 'Get analytics overview' } },
    '/auth/login': { post: { summary: 'Operator login' } },
    '/auth/refresh': { post: { summary: 'Refresh access token' } },
    '/auth/me': { get: { summary: 'Current user profile' } },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

export default openApiSpec;
