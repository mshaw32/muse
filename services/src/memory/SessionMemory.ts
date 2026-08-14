/**
 * Ephemeral, per-session working memory.
 *
 * Holds short-lived context (recent turns, scratch notes) that is useful
 * during a single MUSE session but not necessarily promoted to long-term
 * memory unless explicitly stored via MemoryService.
 */

import { EntityId, generateId, nowISO } from "@muse/shared";

export interface SessionMemoryItem {
  id: EntityId;
  key: string;
  value: unknown;
  createdAt: string;
}

export class SessionMemory {
  private readonly sessionId: EntityId;
  private readonly items: Map<string, SessionMemoryItem> = new Map();

  constructor(sessionId: EntityId = generateId("session")) {
    this.sessionId = sessionId;
  }

  getSessionId(): EntityId {
    return this.sessionId;
  }

  set(key: string, value: unknown): SessionMemoryItem {
    const item: SessionMemoryItem = {
      id: generateId("smem"),
      key,
      value,
      createdAt: nowISO(),
    };
    this.items.set(key, item);
    return item;
  }

  get(key: string): unknown {
    return this.items.get(key)?.value;
  }

  has(key: string): boolean {
    return this.items.has(key);
  }

  delete(key: string): boolean {
    return this.items.delete(key);
  }

  clear(): void {
    this.items.clear();
  }

  snapshot(): SessionMemoryItem[] {
    return Array.from(this.items.values());
  }
}
