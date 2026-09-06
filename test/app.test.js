import test from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import app from '../src/app.js';

test('GET /health returns ok status', async () => {
  const response = await supertest(app).get('/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.status, 'ok');
  assert.equal(response.body.data.service, 'trafix-ai-backend');
  assert.ok(response.headers['x-request-id']);
});

test('GET /api/v1/openapi returns spec', async () => {
  const response = await supertest(app).get('/api/v1/openapi');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.openapi);
  assert.equal(response.body.data.info.title, 'Trafix AI Backend API');
});

test('POST /api/v1/auth/login issues a token', async () => {
  const response = await supertest(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@example.com', password: 'secret123' });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(response.body.data.access_token);
  assert.equal(response.body.data.user.email, 'admin@example.com');
});

test('POST /api/v1/auth/login rejects missing credentials', async () => {
  const response = await supertest(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@example.com' });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'VALIDATION_ERROR');
});

test('GET /api/v1/auth/me requires authentication', async () => {
  const response = await supertest(app).get('/api/v1/auth/me');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'UNAUTHORIZED');
});

test('unknown routes return 404', async () => {
  const response = await supertest(app).get('/definitely-not-real');

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, 'NOT_FOUND');
});
