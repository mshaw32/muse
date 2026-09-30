/**
 * Stub implementations for @muse/shared utilities
 * 
 * These were previously imported from the phantom @muse/shared package.
 * Phase 2-4 features can replace these with real implementations.
 */

// Type definitions that were in @muse/shared
export type EntityId = string;
export type ISOTimestamp = string;

// Logger stub
export class Logger {
  constructor(name: string) {
    this.name = name;
  }

  private name: string;

  debug(msg: string, ...args: any[]): void {
    console.debug(`[${this.name}] ${msg}`, ...args);
  }

  info(msg: string, ...args: any[]): void {
    console.info(`[${this.name}] ${msg}`, ...args);
  }

  warn(msg: string, ...args: any[]): void {
    console.warn(`[${this.name}] ${msg}`, ...args);
  }

  error(msg: string, ...args: any[]): void {
    console.error(`[${this.name}] ${msg}`, ...args);
  }
}

// Utility functions that were in @muse/shared
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}
