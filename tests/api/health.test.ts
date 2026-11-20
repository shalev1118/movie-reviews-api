import request from 'supertest';
import { createApp } from '../../src/app';

describe('GET /health', () => {
  const app = createApp();

  it('responds 200 with service status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body).toEqual({
      status: 'ok',
      database: expect.stringMatching(/^(connected|connecting|disconnected|disconnecting)$/),
      uptime: expect.any(Number),
      timestamp: expect.any(String),
    });
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });

  it('reports the database as disconnected when no connection is open', async () => {
    const res = await request(app).get('/health');

    expect(res.body.database).toBe('disconnected');
  });
});

describe('unknown routes', () => {
  const app = createApp();

  it('respond 404 with the standard error shape', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: 'NOT_FOUND', message: 'Route GET /does-not-exist not found' },
    });
  });
});
