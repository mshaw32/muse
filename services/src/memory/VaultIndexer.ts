/**
 * Local filesystem indexer for the MUSE vault.
 *
 * Scans the vault directory tree (projects/, customers/, learning/, etc.)
 * for markdown notes and builds a lightweight in-memory index used by
 * MemorySearch. This is strictly a local filesystem operation — MUSE does
 * not crawl Microsoft Graph or any enterprise data source here.
 */

import * as fs from "fs";
import * as path from "path";
import { generateId } from "@muse/shared";
import { VaultDocument } from "./MemoryModels";

const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);
const IGNORED_DIRECTORIES = new Set([".git", ".obsidian", "node_modules"]);

export class VaultIndexer {
  private readonly vaultRoot: string;
  private index: VaultDocument[] = [];

  constructor(vaultRoot: string) {
    this.vaultRoot = vaultRoot;
  }

  /** Rebuilds the in-memory index by walking the vault directory tree. */
  reindex(): VaultDocument[] {
    const documents: VaultDocument[] = [];

    if (fs.existsSync(this.vaultRoot)) {
      this.walk(this.vaultRoot, documents);
    }

    this.index = documents;
    return documents;
  }

  getIndex(): VaultDocument[] {
    return [...this.index];
  }

  private walk(directory: string, documents: VaultDocument[]): void {
    let dirEntries: fs.Dirent[];
    try {
      dirEntries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of dirEntries) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) continue;
        this.walk(path.join(directory, entry.name), documents);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!MARKDOWN_EXTENSIONS.has(ext)) continue;

      const fullPath = path.join(directory, entry.name);
      const document = this.parseDocument(fullPath);
      if (document) documents.push(document);
    }
  }

  private parseDocument(fullPath: string): VaultDocument | null {
    try {
      const raw = fs.readFileSync(fullPath, "utf-8");
      const relativePath = path.relative(this.vaultRoot, fullPath);
      const folder = path.dirname(relativePath).split(path.sep)[0] ?? "";
      const stats = fs.statSync(fullPath);

      const headingMatch = raw.match(/^#\s+(.+)$/m);
      const title = headingMatch?.[1]?.trim() ?? path.basename(fullPath, path.extname(fullPath));

      const tagMatches = raw.match(/#[a-zA-Z0-9_-]+/g) ?? [];
      const tags = Array.from(new Set(tagMatches.map((tag) => tag.slice(1))));

      const plainText = raw.replace(/^#.*$/m, "").trim();
      const excerpt = plainText.slice(0, 240).replace(/\s+/g, " ").trim();

      return {
        id: generateId("vault-doc"),
        relativePath,
        folder,
        title,
        excerpt,
        tags,
        updatedAt: stats.mtime.toISOString(),
      };
    } catch {
      return null;
    }
  }
}
