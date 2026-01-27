export interface Article {
  articleId: number;
  title: string;
  content: string;
  image_url: string;
  categoryCode?: string;
  categoryName?: string;
  published_at?: string | null;
  publishedAt?: string | null;
}
