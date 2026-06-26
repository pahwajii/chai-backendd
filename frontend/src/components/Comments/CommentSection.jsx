import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageCircle, Send } from 'lucide-react';
import { fetchComments, addComment, clearComments } from '../../store/slices/commentSlice';
import CommentItem from './CommentItem';

const CommentSection = ({ videoId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { comments, loading, error, pagination } = useSelector((state) => state.comment);

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch comments when component mounts or videoId changes
    if (videoId) {
      dispatch(fetchComments({ videoId }));
    }

    // Clear comments when component unmounts
    return () => {
      dispatch(clearComments());
    };
  }, [videoId, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await dispatch(addComment({ videoId, content: newComment.trim() }));
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadMoreComments = () => {
    if (pagination.page < pagination.totalPages) {
      dispatch(fetchComments({
        videoId,
        page: pagination.page + 1,
        limit: pagination.limit
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <div className="flex items-center space-x-2">
        <MessageCircle className="w-5 h-5 text-primary-400" />
        <h3 className="text-lg font-semibold text-white">
          Comments ({pagination.totalComments})
        </h3>
      </div>

      {/* Add Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex space-x-3">
            <img
              src={user.avatar?.url || '/default-avatar.png'}
              alt={user.fullName}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {newComment.length}/500
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Posting...' : 'Comment'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-6 bg-dark-800 rounded-lg">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">Please log in to comment</p>
          <button className="text-primary-400 hover:text-primary-300 underline">
            Sign in
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading && comments.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (Array.isArray(comments) && comments.length > 0) ? (
          <>
            {comments.map((comment) => (
              <CommentItem key={comment._id || Math.random()} comment={comment} />
            ))}

            {/* Load More Button */}
            {pagination.page < pagination.totalPages && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMoreComments}
                  disabled={loading}
                  className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Comments'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 bg-dark-800 rounded-lg">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">No comments yet</p>
            <p className="text-gray-500 text-sm">Be the first to share your thoughts!</p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-600/20 border border-red-600/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CommentSection;