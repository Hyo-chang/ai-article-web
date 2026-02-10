// 게시판 관련 타입 정의

export interface PostCategory {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  description: string;
}

export interface PostListItem {
  postId: number;
  title: string;
  authorName: string;
  authorId: number;
  categoryCode: string;
  categoryName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
}

export interface PostDetail {
  postId: number;
  title: string;
  content: string;
  authorName: string;
  authorId: number;
  authorProfileImageUrl: string | null;
  categoryCode: string;
  categoryName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLikedByCurrentUser: boolean;
  isAuthor: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  comments: CommentItem[];
}

export interface CommentItem {
  commentId: number;
  postId: number;
  parentCommentId: number | null;
  content: string;
  authorName: string;
  authorId: number;
  authorProfileImageUrl: string | null;
  likeCount: number;
  isLikedByCurrentUser: boolean;
  isAuthor: boolean;
  createdAt: string;
  updatedAt: string;
  replies: CommentItem[];
}

export interface PostCreateRequest {
  categoryCode: string;
  title: string;
  content: string;
  isPinned?: boolean;
}

export interface PostUpdateRequest {
  title: string;
  content: string;
}

export interface CommentCreateRequest {
  parentCommentId?: number | null;
  content: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
