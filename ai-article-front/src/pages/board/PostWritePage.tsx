import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePosts } from '../../hooks/usePosts';
import { usePost } from '../../hooks/usePost';
import { useAuth } from '../../services/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { useNoAds } from '../../hooks/useNoAds';

export default function PostWritePage() {
  useNoAds();
  const navigate = useNavigate();
  const { postId } = useParams<{ postId?: string }>();
  const isEditMode = !!postId;

  const { user, isLoggedIn } = useAuth();
  const { categories, createPost } = usePosts();
  const { fetchPost, updatePost } = usePost();

  const [categoryCode, setCategoryCode] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-[#090a0c] text-white py-6 sm:py-8">
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/board')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>목록으로</span>
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:p-6 md:p-8">
          <h1 className="text-xl font-bold text-white mb-6 sm:text-2xl sm:mb-8">
            {isEditMode ? '게시글 수정' : '새 게시글 작성'}
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                카테고리
              </label>
              <select
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                disabled={isEditMode}
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="" className="bg-[#1a1c20]">카테고리 선택</option>
                {categories.map((cat) => (
                  <option key={cat.categoryId} value={cat.categoryCode} className="bg-[#1a1c20]">
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                maxLength={100}
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-white/40 text-right">
                {title.length}/100
              </p>
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
                rows={15}
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/30 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 관리자 전용: 공지 설정 */}
            {isAdmin && !isEditMode && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-white/10 border-white/30 rounded focus:ring-red-500"
                />
                <label htmlFor="isPinned" className="text-sm font-medium text-red-400">
                  공지로 등록 (상단 고정)
                </label>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/board')}
                className="px-6 py-3 border border-white/20 rounded-lg text-white/70 hover:bg-white/5 transition"
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
