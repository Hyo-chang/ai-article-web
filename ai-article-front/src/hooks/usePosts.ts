import { useState, useEffect, useCallback } from 'react';
import { PostCategory, PostListItem, PageResponse } from '../types/post';
import { getApiBaseUrl } from '@/lib/api';

const getToken = (): string | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.token || null;
  } catch {
    return null;
  }
};

export function usePosts() {
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 카테고리 목록 조회
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/posts/categories`);
      if (!res.ok) throw new Error('카테고리 조회 실패');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('카테고리 조회 오류:', err);
    }
  }, []);

  // 게시글 목록 조회
  const fetchPosts = useCallback(async (categoryCode?: string, pageNum: number = 0, size: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      let url = `${getApiBaseUrl()}/api/posts?page=${pageNum}&size=${size}`;
      if (categoryCode) {
        url += `&category=${categoryCode}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('게시글 조회 실패');
      const data: PageResponse<PostListItem> = await res.json();
      setPosts(data.content);
      setPage(data.number);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 게시글 검색
  const searchPosts = useCallback(async (keyword: string, pageNum: number = 0, size: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/posts/search?q=${encodeURIComponent(keyword)}&page=${pageNum}&size=${size}`);
      if (!res.ok) throw new Error('검색 실패');
      const data: PageResponse<PostListItem> = await res.json();
      setPosts(data.content);
      setPage(data.number);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 게시글 작성
  const createPost = useCallback(async (categoryCode: string, title: string, content: string, isPinned?: boolean): Promise<number | null> => {
    const token = getToken();
    console.log('createPost - token:', token ? 'exists' : 'null');
    if (!token) {
      setError('로그인이 필요합니다.');
      return null;
    }

    try {
      console.log('createPost - sending request to:', `${getApiBaseUrl()}/api/posts`);
      const res = await fetch(`${getApiBaseUrl()}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categoryCode, title, content, isPinned: isPinned || false })
      });
      console.log('createPost - response status:', res.status);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.log('createPost - error response:', errorData);
        throw new Error(errorData.message || '게시글 작성 실패');
      }
      const data = await res.json();
      return data.postId;
    } catch (err: any) {
      console.error('createPost - error:', err);
      setError(err.message);
      return null;
    }
  }, []);

  // 게시글 삭제
  const deletePost = useCallback(async (postId: number): Promise<boolean> => {
    const token = getToken();
    if (!token) {
      setError('로그인이 필요합니다.');
      return false;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('게시글 삭제 실패');
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    posts,
    loading,
    error,
    page,
    totalPages,
    totalElements,
    fetchPosts,
    searchPosts,
    createPost,
    deletePost,
    setPage
  };
}
