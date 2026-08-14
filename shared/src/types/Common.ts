/**
 * Common primitive types shared across MUSE services, backend routes,
 * and the Electron desktop shell.
 */

/** ISO-8601 timestamp string. */
export type ISOTimestamp = string;

/** Generic unique identifier. */
export type EntityId = string;

/** Standard approval lifecycle for consequential actions. */
export type ApprovalStatus = "not_required" | "pending" | "approved" | "rejected";

/** Generic paged result wrapper used by search/list APIs. */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Standard envelope returned by mock/service layer calls that may fail. */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function ok<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

export function fail<T>(error: string): ServiceResult<T> {
  return { success: false, error };
}

export function nowISO(): ISOTimestamp {
  return new Date().toISOString();
}

export function generateId(prefix = "id"): EntityId {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}
