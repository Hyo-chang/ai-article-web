import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePosts } from '../../hooks/usePosts';
import { useAuth } from '../../services/AuthContext';
import { Eye, Heart, Search, PenSquare, ArrowLeft } from 'lucide-react';

export default function BoardPage() {
  const navigate = useNavigate();
  const { category } = useParams<{ category?: string }>();
  const [searchParams] = useSearchParams();
  const { categories, posts, loading, error, page, totalPages, totalElements, fetchPosts, searchPosts } = usePosts();
  const { isLoggedIn } = useAuth();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchKeyword(q);
      setIsSearching(true);
      searchPosts(q, 0);
    } else {
      setIsSearching(false);
      fetchPosts(category, 0);
    }
  }, [category, searchParams, fetchPosts, searchPosts]);

  const handleCategoryClick = (code?: string) => {
    setSearchKeyword('');
    setIsSearching(false);
    if (code) {
      navigate(`/board/${code}`);
    } else {
      navigate('/board');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      setIsSearching(true);
      navigate(`/board?q=${encodeURIComponent(searchKeyword.trim())}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (isSearching) {
      searchPosts(searchKeyword, newPage);
    } else {
      fetchPosts(category, newPage);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#090a0c] text-white">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090a0c]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-sm text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </button>
          <span className="text-xs font-medium uppercase tracking-widest text-white/50">
            Community
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* 타이틀 & 글쓰기 */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">커뮤니티</h1>
            <p className="mt-1.5 text-sm text-white/50 sm:mt-2 sm:text-base">자유롭게 소통하고 정보를 공유하세요</p>
          </div>
          {isLoggedIn && (
            <button
              onClick={() => navigate('/board/write')}
              className="flex items-center gap-1.5 self-start px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition font-medium sm:gap-2 sm:px-5 sm:py-2.5 sm:text-base"
            >
              <PenSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              글쓰기
            </button>
          )}
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 sm:mb-6">
          <button
            onClick={() => handleCategoryClick()}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition sm:px-4 sm:py-2 sm:text-base ${
              !category && !isSearching
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.categoryId}
              onClick={() => handleCategoryClick(cat.categoryCode)}
              className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition sm:px-4 sm:py-2 sm:text-base ${
                category === cat.categoryCode && !isSearching
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {cat.categoryName}
            </button>
          ))}
        </div>

        {/* 검색 */}
        <form onSubmit={handleSearch} className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="게시글 검색..."
              className="w-full py-3 pl-10 pr-4 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </form>

        {/* 검색 결과 안내 */}
        {isSearching && (
          <div className="mb-4 text-sm text-white/60">
            "{searchKeyword}" 검색 결과: {totalElements}건
            <button
              onClick={() => {
                setSearchKeyword('');
                setIsSearching(false);
                navigate('/board');
              }}
              className="ml-2 text-blue-400 hover:underline"
            >
              초기화
            </button>
          </div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="text-center py-12 text-red-400">{error}</div>
        )}

        {/* 게시글 목록 */}
        {!loading && !error && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/10 backdrop-blur-sm">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                게시글이 없습니다.
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.postId}
                  onClick={() => navigate(`/board/post/${post.postId}`)}
                  className={`p-4 cursor-pointer transition ${
                    post.isPinned
                      ? 'bg-red-500/10 hover:bg-red-500/15'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.isPinned && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-500 text-white font-medium">
                            공지
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">
                          {post.categoryName}
                        </span>
                        <h3 className="text-white font-medium truncate">
                          {post.title}
                        </h3>
                        {post.commentCount > 0 && (
                          <span className="text-blue-400 text-sm">[{post.commentCount}]</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/50">
                        <span>{post.authorName}</span>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likeCount}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
              className="px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition"
            >
              이전
            </button>
            <span className="px-4 py-2 text-white/70">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="px-3 py-2 rounded-lg border border-white/20 bg-white/5 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition"
            >
              다음
            </button>
          </div>
        )}

        {/* 비로그인 안내 */}
        {!isLoggedIn && (
          <div className="mt-8 text-center text-sm text-white/50">
            글을 작성하려면{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:underline"
            >
              로그인
            </button>
            이 필요합니다.
          </div>
        )}
      </div>
    </div>
  );
}
