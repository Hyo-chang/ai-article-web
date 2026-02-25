import { useState, useCallback } from 'react';
import { PostDetail, CommentItem } from '../types/post';
import { getApiBaseUrl } from '@/lib/api';

export function usePost() {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeader = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return {};
    try {
      const user = JSON.parse(userStr);
      return user.token ? { 'Authorization': `Bearer ${user.token}` } : {};
    } catch {
      return {};
    }
  };

  // 게시글 상세 조회
  const fetchPost = useCallback(async (postId: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/posts/${postId}`, {
        headers: getAuthHeader()
      });
      if (!res.ok) throw new Error('게시글을 찾을 수 없습니다.');
      const data: PostDetail = await res.json();
      setPost(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 게시글 수정
  const updatePost = useCallback(async (postId: number, title: string, content: string): Promise<boolean> => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ title, content })
      });
      if (!res.ok) throw new Error('게시글 수정 실패');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  // 게시글 좋아요 토글
  const togglePostLike = useCallback(async (postId: number): Promise<boolean | null> => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      if (!res.ok) throw new Error('좋아요 처리 실패');
      const data = await res.json();

      // 로컬 상태 업데이트
      if (post && post.postId === postId) {
        setPost({
          ...post,
          isLikedByCurrentUser: data.isLiked,
          likeCount: data.isLiked ? post.likeCount + 1 : post.likeCount - 1
        });
      }

      return data.isLiked;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [post]);

  // 댓글 작성
  const createComment = useCallback(async (postId: number, content: string, parentCommentId?: number): Promise<boolean> => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ content, parentCommentId: parentCommentId || null })
      });
      if (!res.ok) throw new Error('댓글 작성 실패');

      // 댓글 목록 새로고침
      await fetchPost(postId);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchPost]);

  // 댓글 수정
  const updateComment = useCallback(async (commentId: number, content: string): Promise<boolean> => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/posts/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ content })
      });
      if (!res.ok) throw new Error('댓글 수정 실패');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  // 댓글 삭제
  const deleteComment = useCallback(async (commentId: number, postId: number): Promise<boolean> => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/posts/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });
      if (!res.ok) throw new Error('댓글 삭제 실패');

      // 댓글 목록 새로고침
      await fetchPost(postId);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [fetchPost]);

  // 댓글 좋아요 토글
  const toggleCommentLike = useCallback(async (commentId: number): Promise<boolean | null> => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/posts/comments/${commentId}/like`, {
        method: 'POST',
        headers: getAuthHeader()
      });
      if (!res.ok) throw new Error('좋아요 처리 실패');
      const data = await res.json();
      return data.isLiked;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    post,
    loading,
    error,
    fetchPost,
    updatePost,
    togglePostLike,
    createComment,
    updateComment,
    deleteComment,
    toggleCommentLike,
    setPost
  };
}
