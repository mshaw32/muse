/**
 * Public facade for the MUSE Memory Layer.
 *
 * Combines long-term ledger storage (MemoryStore), local vault indexing
 * (VaultIndexer), and search (MemorySearch) into a single service used by
 * backend routes and, eventually, the Electron shell directly.
 */

import { Logger } from "@muse/shared";
import { MemoryEntry, MemorySearchQuery, MemorySearchResult, MemoryStoreRequest, VaultDocument } from "./MemoryModels";
import { MemoryStore } from "./MemoryStore";
import { VaultIndexer } from "./VaultIndexer";
import { MemorySearch } from "./MemorySearch";

export interface MemoryServiceOptions {
  dataDirectory: string;
  vaultRoot: string;
}

export class MemoryService {
  private readonly memoryStore: MemoryStore;
  private readonly vaultIndexer: VaultIndexer;
  private readonly memorySearch: MemorySearch;
  private readonly logger: Logger;

  constructor(options: MemoryServiceOptions, logger: Logger = new Logger("muse:memory")) {
    this.memoryStore = new MemoryStore(options.dataDirectory);
    this.vaultIndexer = new VaultIndexer(options.vaultRoot);
    this.memorySearch = new MemorySearch(this.memoryStore, this.vaultIndexer);
    this.logger = logger;

    // Build the initial vault index eagerly so search works immediately.
    this.vaultIndexer.reindex();
  }

  store(request: MemoryStoreRequest): MemoryEntry {
    const entry = this.memoryStore.add(request);
    this.logger.info("Stored memory entry", { id: entry.id, category: entry.category });
    return entry;
  }

  search(query: MemorySearchQuery): MemorySearchResult[] {
    return this.memorySearch.search(query);
  }

  searchVault(query: string, limit?: number): VaultDocument[] {
    return this.memorySearch.searchVault(query, limit);
  }

  reindexVault(): VaultDocument[] {
    const documents = this.vaultIndexer.reindex();
    this.logger.info("Reindexed vault", { documentCount: documents.length });
    return documents;
  }

  listAll(): MemoryEntry[] {
    return this.memoryStore.all();
  }

  getById(id: string): MemoryEntry | undefined {
    return this.memoryStore.getById(id);
  }

  remove(id: string): boolean {
    return this.memoryStore.remove(id);
  }
}
