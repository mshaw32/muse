/**
 * Search across MemoryEntry ledger records and the local VaultIndexer index.
 *
 * Supports keyword, tag, and source search today. Semantic search is
 * exposed as a placeholder interface point for a future embeddings-backed
 * implementation (Phase 3+) and currently falls back to keyword matching.
 */

import { MemoryEntry, MemorySearchQuery, MemorySearchResult, VaultDocument } from "./MemoryModels";
import { MemoryStore } from "./MemoryStore";
import { VaultIndexer } from "./VaultIndexer";

function scoreText(haystack: string, needle: string): number {
  if (!needle) return 0;
  const normalizedHaystack = haystack.toLowerCase();
  const normalizedNeedle = needle.toLowerCase();
  if (!normalizedHaystack.includes(normalizedNeedle)) return 0;

  const occurrences = normalizedHaystack.split(normalizedNeedle).length - 1;
  return Math.min(1, 0.4 + occurrences * 0.15);
}

export class MemorySearch {
  private readonly memoryStore: MemoryStore;
  private readonly vaultIndexer: VaultIndexer;

  constructor(memoryStore: MemoryStore, vaultIndexer: VaultIndexer) {
    this.memoryStore = memoryStore;
    this.vaultIndexer = vaultIndexer;
  }

  search(query: MemorySearchQuery): MemorySearchResult[] {
    const mode: MemorySearchQuery["mode"] = query.mode ?? "keyword";
    const limit = query.limit ?? 10;

    let results: MemorySearchResult[];
    switch (mode) {
      case "tag":
        results = this.searchByTag(query.query);
        break;
      case "source":
        results = this.searchBySource(query.query);
        break;
      case "semantic":
        results = this.searchSemanticPlaceholder(query.query);
        break;
      case "keyword":
      default:
        results = this.searchByKeyword(query.query);
        break;
    }

    if (query.category) {
      results = results.filter((result) => result.entry.category === query.category);
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /** Search vault documents independently of the memory ledger. */
  searchVault(query: string, limit = 10): VaultDocument[] {
    const documents = this.vaultIndexer.getIndex();
    return documents
      .map((doc) => ({ doc, score: scoreText(`${doc.title} ${doc.excerpt}`, query) }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((result) => result.doc);
  }

  private searchByKeyword(query: string): MemorySearchResult[] {
    return this.memoryStore
      .all()
      .map((entry) => ({
        entry,
        score: scoreText(`${entry.title} ${entry.content}`, query),
        matchedOn: "keyword" as const,
      }))
      .filter((result) => result.score > 0);
  }

  private searchByTag(tag: string): MemorySearchResult[] {
    const normalized = tag.toLowerCase().replace(/^#/, "");
    return this.memoryStore
      .all()
      .filter((entry) => entry.tags.some((entryTag) => entryTag.toLowerCase() === normalized))
      .map((entry) => ({ entry, score: 0.9, matchedOn: "tag" as const }));
  }

  private searchBySource(source: string): MemorySearchResult[] {
    return this.memoryStore
      .all()
      .filter((entry) => entry.source === source)
      .map((entry) => ({ entry, score: 0.7, matchedOn: "source" as const }));
  }

  /**
   * Placeholder for a future embeddings/vector-similarity search.
   * Currently delegates to keyword search so callers get a usable result
   * today without depending on an unavailable embeddings backend.
   */
  private searchSemanticPlaceholder(query: string): MemorySearchResult[] {
    return this.searchByKeyword(query).map((result) => ({
      ...result,
      matchedOn: "semantic" as const,
    }));
  }
}

export type { MemoryEntry };
