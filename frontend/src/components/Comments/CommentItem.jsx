import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import { updateComment, deleteComment } from '../../store/slices/commentSlice';

const CommentItem = ({ comment }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.comment);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment?.content || '');
  const [showMenu, setShowMenu] = useState(false);


  const isOwner = user && comment?.owner?._id === user._id;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  const handleUpdate = async () => {
    if (!editContent.trim() || !comment?._id) return;

    try {
      await dispatch(updateComment({ commentId: comment._id, content: editContent.trim() }));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!comment?._id) return;

    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await dispatch(deleteComment(comment._id));
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  const handleCancel = () => {
    setEditContent(comment?.content || '');
    setIsEditing(false);
  };

  return (
    <div className="flex space-x-3 p-4 bg-dark-800 rounded-lg">
      {/* User Avatar */}
      <img
        src={comment?.owner?.avatar?.url || '/default-avatar.png'}
        alt={comment?.owner?.username || 'User'}
        className="w-10 h-10 rounded-full flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium text-sm">
              {comment?.owner?.fullName || 'Unknown User'}
            </span>
            <span className="text-gray-400 text-xs">
              {formatDate(comment?.createdAt)}
            </span>
          </div>

          {/* Menu for owner */}
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 bg-dark-700 rounded-lg shadow-lg py-1 z-10">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-dark-600 w-full text-left"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      handleDelete();
                      setShowMenu(false);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-dark-600 w-full text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-primary-500"
              rows={3}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleUpdate}
                disabled={loading || !editContent.trim()}
                className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-300 text-sm leading-relaxed">
            {comment?.content || ''}
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentItem;