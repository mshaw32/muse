/**
 * File-backed persistence for conversations.
 *
 * Conversations are persisted under the vault's `sessions/` folder so a
 * user's conversation history lives alongside the rest of their long-term
 * memory rather than in an opaque database file.
 */

import * as fs from "fs";
import * as path from "path";
import { Conversation } from "./ConversationModels";

export class ConversationStore {
  private readonly filePath: string;
  private conversations: Conversation[] | null = null;

  constructor(directory: string, fileName = "conversations.json") {
    this.filePath = path.join(directory, fileName);
  }

  private load(): Conversation[] {
    if (this.conversations) return this.conversations;

    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.conversations = JSON.parse(raw) as Conversation[];
        return this.conversations;
      }
    } catch {
      // Corrupt file — start fresh.
    }

    this.conversations = [];
    return this.conversations;
  }

  private persist(): void {
    if (!this.conversations) return;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.conversations, null, 2), "utf-8");
  }

  all(): Conversation[] {
    return [...this.load()];
  }

  getById(id: string): Conversation | undefined {
    return this.load().find((conversation) => conversation.id === id);
  }

  upsert(conversation: Conversation): Conversation {
    const conversations = this.load();
    const index = conversations.findIndex((existing) => existing.id === conversation.id);

    if (index === -1) {
      conversations.push(conversation);
    } else {
      conversations[index] = conversation;
    }

    this.persist();
    return conversation;
  }

  remove(id: string): boolean {
    const conversations = this.load();
    const index = conversations.findIndex((conversation) => conversation.id === id);
    if (index === -1) return false;
    conversations.splice(index, 1);
    this.persist();
    return true;
  }
}
