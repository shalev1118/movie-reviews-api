import mongoose from 'mongoose';
import type { DatabaseState, HealthStatus } from '../types/api';

// Mongoose readyState codes: https://mongoosejs.com/docs/api/connection.html#Connection.prototype.readyState
const READY_STATES: Record<number, DatabaseState> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export function getDatabaseState(): DatabaseState {
  return READY_STATES[mongoose.connection.readyState] ?? 'disconnected';
}

/** Liveness report: the process is up; the database state is informational. */
export function getHealthStatus(): HealthStatus {
  return {
    status: 'ok',
    database: getDatabaseState(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
}
