import type { Article } from "./article";

export interface ReadHistoryEntry {
  historyId: number;
  userId: number;
  articleId: number;
  readAt: string;
  article?: Article | null;
  articleTitle?: string | null;
  articleSummary?: string | null;
  articleImageUrl?: string | null;
}
