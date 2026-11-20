/** Body of every error response. See docs/architecture.md, "Error format". */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type DatabaseState = 'connected' | 'connecting' | 'disconnected' | 'disconnecting';

export interface HealthStatus {
  status: 'ok';
  database: DatabaseState;
  uptime: number;
  timestamp: string;
}
