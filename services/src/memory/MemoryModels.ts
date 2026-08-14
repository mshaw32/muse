/**
 * Domain models for the MUSE Memory Layer (long-term vault-backed memory).
 */

import { EntityId, ISOTimestamp } from "@muse/shared";

export type MemoryCategory =
  | "preference"
  | "decision"
  | "project"
  | "goal"
  | "action-history"
  | "conversation-summary"
  | "meeting-note"
  | "technology-note"
  | "customer"
  | "learning"
  | "priority"
  | "playbook"
  | "certification";

export interface MemoryEntry {
  id: EntityId;
  category: MemoryCategory;
  title: string;
  content: string;
  tags: string[];
  source: "user" | "conversation" | "action" | "vault-import";
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface MemoryStoreRequest {
  category: MemoryCategory;
  title: string;
  content: string;
  tags?: string[];
  source?: MemoryEntry["source"];
}

export type MemorySearchMode = "keyword" | "semantic" | "tag" | "source";

export interface MemorySearchQuery {
  query: string;
  mode?: MemorySearchMode;
  category?: MemoryCategory;
  limit?: number;
}

export interface MemorySearchResult {
  entry: MemoryEntry;
  score: number;
  matchedOn: MemorySearchMode;
}

/** A single indexed document discovered under the vault directory tree. */
export interface VaultDocument {
  id: EntityId;
  relativePath: string;
  folder: string;
  title: string;
  excerpt: string;
  tags: string[];
  updatedAt: ISOTimestamp;
}
