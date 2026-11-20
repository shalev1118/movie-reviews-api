// Deterministic environment for every test run; never uses real credentials.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-only-secret-not-for-production';
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/movie-reviews-test';
