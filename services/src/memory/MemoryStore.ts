/**
 * File-backed persistence for MemoryEntry records.
 *
 * Entries are stored as a single JSON ledger under the vault's `sessions/`
 * folder by default, keeping MUSE's long-term memory alongside the rest of
 * the vault content rather than in an opaque database.
 */

import * as fs from "fs";
import * as path from "path";
import { generateId, nowISO } from "@muse/shared";
import { MemoryEntry, MemoryStoreRequest } from "./MemoryModels";

export class MemoryStore {
  private readonly filePath: string;
  private entries: MemoryEntry[] | null = null;

  constructor(directory: string, fileName = "memory-ledger.json") {
    this.filePath = path.join(directory, fileName);
  }

  private load(): MemoryEntry[] {
    if (this.entries) {
      return this.entries;
    }

    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.entries = JSON.parse(raw) as MemoryEntry[];
        return this.entries;
      }
    } catch {
      // Corrupt ledger — start fresh rather than crash memory storage.
    }

    this.entries = [];
    return this.entries;
  }

  private persist(): void {
    if (!this.entries) return;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.entries, null, 2), "utf-8");
  }

  add(request: MemoryStoreRequest): MemoryEntry {
    const entries = this.load();
    const timestamp = nowISO();
    const entry: MemoryEntry = {
      id: generateId("mem"),
      category: request.category,
      title: request.title,
      content: request.content,
      tags: request.tags ?? [],
      source: request.source ?? "user",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    entries.push(entry);
    this.persist();
    return entry;
  }

  all(): MemoryEntry[] {
    return [...this.load()];
  }

  getById(id: string): MemoryEntry | undefined {
    return this.load().find((entry) => entry.id === id);
  }

  remove(id: string): boolean {
    const entries = this.load();
    const index = entries.findIndex((entry) => entry.id === id);
    if (index === -1) return false;
    entries.splice(index, 1);
    this.persist();
    return true;
  }
}
