import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePosts } from '../../hooks/usePosts';
import { usePost } from '../../hooks/usePost';
import { ArrowLeft } from 'lucide-react';

export default function PostWritePage() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId?: string }>();
  const isEditMode = !!postId;

  const { categories, createPost } = usePosts();
  const { post, fetchPost, updatePost } = usePost();

  const [categoryCode, setCategoryCode] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = useMemo(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }, []);

  const isLoggedIn = !!user?.token;
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || false;

  useEffect(() => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (isEditMode && postId) {
      fetchPost(parseInt(postId)).then((data) => {
        if (data) {
          if (!data.isAuthor) {
            alert('본인의 게시글만 수정할 수 있습니다.');
            navigate('/board');
            return;
          }
          setCategoryCode(data.categoryCode);
          setTitle(data.title);
          setContent(data.content);
        }
      });
    }
  }, [isEditMode, postId, isLoggedIn, navigate, fetchPost]);

  useEffect(() => {
    if (!isEditMode && categories.length > 0 && !categoryCode) {
      setCategoryCode(categories[0].categoryCode);
    }
  }, [categories, isEditMode, categoryCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryCode) {
      setError('카테고리를 선택해주세요.');
      return;
    }
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      if (isEditMode && postId) {
        const success = await updatePost(parseInt(postId), title.trim(), content.trim());
        if (success) {
          navigate(`/board/post/${postId}`);
        } else {
          setError('수정에 실패했습니다.');
        }
      } else {
        const newPostId = await createPost(categoryCode, title.trim(), content.trim(), isPinned);
        if (newPostId) {
          navigate(`/board/post/${newPostId}`);
        } else {
          setError('작성에 실패했습니다.');
        }
      }
    } catch (err) {
      setError('오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          뒤로가기
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {isEditMode ? '게시글 수정' : '새 게시글 작성'}
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                카테고리
              </label>
              <select
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                disabled={isEditMode}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">카테고리 선택</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryCode}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                maxLength={100}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
                {title.length}/100
              </p>
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={15}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 관리자 전용: 공지 설정 */}
            {isAdmin && !isEditMode && (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="isPinned" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  공지로 등록 (상단 고정)
                </label>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? '처리 중...' : isEditMode ? '수정하기' : '작성하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
