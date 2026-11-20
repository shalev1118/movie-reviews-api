import { loadConfig } from '../../../src/config/env';

const validEnv = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017/movie-reviews',
  JWT_SECRET: 'a-test-secret-that-is-long-enough-1234',
};

describe('loadConfig', () => {
  it('applies defaults for optional variables', () => {
    expect(loadConfig(validEnv)).toEqual({
      nodeEnv: 'development',
      port: 3000,
      mongodbUri: validEnv.MONGODB_URI,
      jwtSecret: validEnv.JWT_SECRET,
      jwtExpiresIn: '1h',
    });
  });

  it('reads explicit values', () => {
    const config = loadConfig({ ...validEnv, NODE_ENV: 'production', PORT: '8080', JWT_EXPIRES_IN: '15m' });

    expect(config).toMatchObject({ nodeEnv: 'production', port: 8080, jwtExpiresIn: '15m' });
  });

  it('rejects missing required variables, listing all of them', () => {
    expect(() => loadConfig({})).toThrow(/MONGODB_URI is required.*JWT_SECRET is required/s);
  });

  it.each(['abc', '0', '70000', '3000.5'])('rejects invalid PORT %p', (port) => {
    expect(() => loadConfig({ ...validEnv, PORT: port })).toThrow(/PORT must be an integer between 1 and 65535/);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => loadConfig({ ...validEnv, NODE_ENV: 'staging' })).toThrow(/NODE_ENV must be one of/);
  });

  it('requires a strong JWT_SECRET in production', () => {
    expect(() => loadConfig({ ...validEnv, NODE_ENV: 'production', JWT_SECRET: 'short' })).toThrow(
      /JWT_SECRET must be at least 32 characters in production/,
    );
  });
});
