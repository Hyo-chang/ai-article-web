export interface Article {
  articleId: number;
  articleUrl?: string;
  title: string;
  content: string;
  publisher?: string;
  publishedAt?: string | null;
  published_at?: string | null;  // 이전 호환성 유지
  contentCrawledAt?: string | null;
  isFullContentCrawled?: boolean;
  imageUrl?: string;
  image_url?: string;  // 이전 호환성 유지
  summarize?: string;
  categoryCode?: string;
  categoryName: string;  // 필수 필드로 변경
  word?: string;  // 키워드 JSON
}
