import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePost } from '../../hooks/usePost';
import { useAuth } from '../../services/AuthContext';
import { getApiBaseUrl } from '@/lib/api';
import { CommentItem } from '../../types/post';
import { Heart, Eye, MessageCircle, ArrowLeft, Edit, Trash2, CornerDownRight, Send } from 'lucide-react';

export default function PostDetailPage() {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const { post, loading, error, fetchPost, togglePostLike, createComment, deleteComment, toggleCommentLike } = usePost();
  const { isLoggedIn, user } = useAuth();

  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ commentId: number; authorName: string } | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchPost(parseInt(postId));
    }
  }, [postId, fetchPost]);

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (post) {
      await togglePostLike(post.postId);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!newComment.trim() || !post) return;

    setSubmitting(true);
    const success = await createComment(post.postId, newComment.trim());
    if (success) {
      setNewComment('');
    }
    setSubmitting(false);
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!replyContent.trim() || !post || !replyTo) return;

    setSubmitting(true);
    const success = await createComment(post.postId, replyContent.trim(), replyTo.commentId);
    if (success) {
      setReplyContent('');
      setReplyTo(null);
    }
    setSubmitting(false);
  };

  const handleDeletePost = async () => {
    if (!post) return;
    if (!confirm('게시글을 삭제하시겠습니까?')) return;

    const token = user?.token;
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    const res = await fetch(`${getApiBaseUrl()}/api/posts/${post.postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      navigate('/board');
    } else {
      alert('삭제 실패');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!post) return;
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    await deleteComment(commentId, post.postId);
  };

  const handleCommentLike = async (commentId: number) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    await toggleCommentLike(commentId);
    if (post) {
      fetchPost(post.postId);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderComment = (comment: CommentItem, isReply: boolean = false) => (
    <div key={comment.commentId} className={`${isReply ? 'ml-8 mt-3' : 'py-4'}`}>
      <div className="flex items-start gap-3">
        {isReply && <CornerDownRight className="w-4 h-4 text-white/40 mt-1" />}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {comment.authorProfileImageUrl ? (
              <img
                src={comment.authorProfileImageUrl}
                alt=""
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/20" />
            )}
            <span className="font-medium text-white text-sm">
              {comment.authorName}
            </span>
            <span className="text-xs text-white/50">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <p className="text-white/80 text-sm mb-2">
            {comment.content}
          </p>
          <div className="flex items-center gap-4 text-xs text-white/50">
            <button
              onClick={() => handleCommentLike(comment.commentId)}
              className={`flex items-center gap-1 hover:text-red-400 ${
                comment.isLikedByCurrentUser ? 'text-red-400' : ''
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${comment.isLikedByCurrentUser ? 'fill-current' : ''}`} />
              {comment.likeCount}
            </button>
            {!isReply && isLoggedIn && (
              <button
                onClick={() => setReplyTo({ commentId: comment.commentId, authorName: comment.authorName })}
                className="hover:text-blue-400"
              >
                답글
              </button>
            )}
            {comment.isAuthor && (
              <button
                onClick={() => handleDeleteComment(comment.commentId)}
                className="hover:text-red-400"
              >
                삭제
              </button>
            )}
          </div>

          {/* 답글 입력 */}
          {replyTo?.commentId === comment.commentId && (
            <form onSubmit={handleReplySubmit} className="mt-3 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`@${replyTo.authorName}에게 답글...`}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/40 focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={submitting || !replyContent.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyTo(null);
                  setReplyContent('');
                }}
                className="px-3 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20"
              >
                취소
              </button>
            </form>
          )}

          {/* 대댓글 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0c] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#090a0c] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || '게시글을 찾을 수 없습니다.'}</p>
          <button
            onClick={() => navigate('/board')}
            className="text-blue-400 hover:underline"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0c] text-white py-6 sm:py-8">
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        {/* 뒤로가기 */}
        <button
          onClick={() => navigate('/board')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          목록으로
        </button>

        {/* 게시글 */}
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-4 backdrop-blur-sm sm:p-6 sm:mb-6">
          <div className="mb-4">
            <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/60">
              {post.categoryName}
            </span>
          </div>

          <h1 className="text-xl font-bold text-white mb-3 sm:text-2xl sm:mb-4">
            {post.title}
          </h1>

          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {post.authorProfileImageUrl ? (
                <img
                  src={post.authorProfileImageUrl}
                  alt=""
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20" />
              )}
              <div>
                <p className="font-medium text-white">{post.authorName}</p>
                <p className="text-sm text-white/50">{formatDate(post.createdAt)}</p>
              </div>
            </div>

            {post.isAuthor && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/board/edit/${post.postId}`)}
                  className="p-2 text-white/50 hover:text-blue-400 hover:bg-white/10 rounded-lg transition"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDeletePost}
                  className="p-2 text-white/50 hover:text-red-400 hover:bg-white/10 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div
            className="py-6 text-white/80 whitespace-pre-wrap min-h-[200px]"
          >
            {post.content}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {post.commentCount}
              </span>
            </div>

            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
                post.isLikedByCurrentUser
                  ? 'border-red-500 text-red-400 bg-red-500/20'
                  : 'border-white/20 text-white/50 hover:border-red-500 hover:text-red-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${post.isLikedByCurrentUser ? 'fill-current' : ''}`} />
              좋아요 {post.likeCount}
            </button>
          </div>
        </article>

        {/* 댓글 섹션 */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm sm:p-6">
          <h2 className="text-lg font-bold text-white mb-4">
            댓글 {post.commentCount}
          </h2>

          {/* 댓글 입력 */}
          {isLoggedIn ? (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white placeholder-white/40 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  댓글 작성
                </button>
              </div>
            </form>
          ) : (
            <p className="mb-6 text-sm text-white/50">
              댓글을 작성하려면{' '}
              <button onClick={() => navigate('/login')} className="text-blue-400 hover:underline">
                로그인
              </button>
              이 필요합니다.
            </p>
          )}

          {/* 댓글 목록 */}
          <div className="divide-y divide-white/10">
            {post.comments.length === 0 ? (
              <p className="text-center py-8 text-white/50">
                첫 댓글을 작성해보세요!
              </p>
            ) : (
              post.comments.map((comment) => renderComment(comment))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
