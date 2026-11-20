import 'dotenv/config';

const NODE_ENVS = ['development', 'test', 'production'] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
}

const MIN_PRODUCTION_SECRET_LENGTH = 32;

/**
 * Validates environment variables and returns a typed config.
 * Collects every problem before throwing so a misconfigured deploy fails once, clearly.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const errors: string[] = [];

  const nodeEnv = (env.NODE_ENV ?? 'development') as NodeEnv;
  if (!NODE_ENVS.includes(nodeEnv)) {
    errors.push(`NODE_ENV must be one of: ${NODE_ENVS.join(', ')}`);
  }

  const rawPort = env.PORT ?? '3000';
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || port < 1 || port > 65535) {
    errors.push('PORT must be an integer between 1 and 65535');
  }

  const mongodbUri = env.MONGODB_URI?.trim() ?? '';
  if (!mongodbUri) {
    errors.push('MONGODB_URI is required');
  }

  const jwtSecret = env.JWT_SECRET ?? '';
  if (!jwtSecret) {
    errors.push('JWT_SECRET is required');
  } else if (nodeEnv === 'production' && jwtSecret.length < MIN_PRODUCTION_SECRET_LENGTH) {
    errors.push(`JWT_SECRET must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production`);
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return {
    nodeEnv,
    port,
    mongodbUri,
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN ?? '1h',
  };
}
