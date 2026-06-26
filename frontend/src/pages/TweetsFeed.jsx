import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { likeTweet, fetchTweetComments, addTweetComment } from '../store/slices/tweetSlice';
import { useRef } from 'react';
import {
  MessageCircle,
  ThumbsUp,
  User,
  Clock,
  Plus,
  Send
} from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TweetsFeed = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { comments } = useSelector((state) => state.tweet);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showComments, setShowComments] = useState({});
  const [newComments, setNewComments] = useState({});

  useEffect(() => {
    fetchTweets();
  }, [currentPage]);

  const fetchTweets = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/tweets/all?page=${currentPage}&limit=20`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Tweets feed data:', data);
        setTweets(data.data.tweets || []);
        setPagination(data.data.pagination);
      } else {
        console.error('Failed to fetch tweets');
      }
    } catch (error) {
      console.error('Error fetching tweets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  const handleLike = async (tweetId) => {
    if (user) {
      const result = await dispatch(likeTweet(tweetId));
      if (result.payload && result.payload.data && result.payload.data.data) {
        // Update local state with new like count
        setTweets(prevTweets =>
          prevTweets.map(tweet =>
            tweet._id === tweetId
              ? { ...tweet, likesCount: result.payload.data.data.totalLikes }
              : tweet
          )
        );
      }
    }
  };

  const handleReply = async (tweetId) => {
    if (!user) return;

    if (showComments[tweetId]) {
      setShowComments(prev => ({ ...prev, [tweetId]: false }));
    } else {
      setShowComments(prev => ({ ...prev, [tweetId]: true }));
      // Fetch comments if not already loaded
      if (!comments[tweetId]) {
        await dispatch(fetchTweetComments({ tweetId }));
      }
    }
  };

  const handleAddComment = async (tweetId) => {
    const content = (newComments[tweetId] || '').trim();
    if (content) {
      const result = await dispatch(addTweetComment({ tweetId, content }));
      if (result.payload) {
        // Update local state with new comment count
        setTweets(prevTweets =>
          prevTweets.map(tweet =>
            tweet._id === tweetId
              ? { ...tweet, commentsCount: (tweet.commentsCount || 0) + 1 }
              : tweet
          )
        );
      }
      setNewComments(prev => ({ ...prev, [tweetId]: '' }));
    }
  };

  if (loading && tweets.length === 0) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Tweets</h1>
            <p className="text-gray-400">Discover what people are talking about</p>
          </div>

          {user && (
            <Link
              to="/tweets" // This would be a create tweet page
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Post Tweet</span>
            </Link>
          )}
        </div>

        {/* Tweets Feed */}
        <div className="space-y-6">
          {tweets.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No tweets yet</h3>
              <p className="text-gray-400 mb-6">Be the first to share something!</p>
              {user && (
                <Link
                  to="/tweets"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Tweet</span>
                </Link>
              )}
            </div>
          ) : (
            tweets.map((tweet) => (
              <div key={tweet._id} className="bg-dark-800 rounded-2xl p-6">
                <div className="flex items-start space-x-4">
                  <Link
                    to={`/channel/${tweet.owner?.username}`}
                    className="flex-shrink-0"
                  >
                    <img
                      src={tweet.owner?.avatar?.url || '/default-avatar.png'}
                      alt={tweet.owner?.fullName}
                      className="w-12 h-12 rounded-full hover:ring-2 hover:ring-primary-500 transition-all"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Link
                        to={`/channel/${tweet.owner?.username}`}
                        className="font-semibold text-white hover:text-primary-400 transition-colors"
                      >
                        {tweet.owner?.fullName}
                      </Link>
                      <span className="text-gray-400">@{tweet.owner?.username}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400 text-sm flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(tweet.createdAt)}</span>
                      </span>
                    </div>

                    <p className="text-gray-300 mb-4 leading-relaxed">{tweet.content}</p>

                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(tweet._id)}
                        className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{tweet.likesCount || 0}</span>
                      </button>

                      <button
                        onClick={() => handleReply(tweet._id)}
                        className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{tweet.commentsCount || 0}</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    {showComments[tweet._id] && (
                      <div className="mt-4 border-t border-gray-700 pt-4">
                        {user && (
                          <div className="flex space-x-3 mb-4">
                            <img
                              src={user.avatar?.url || '/default-avatar.png'}
                              alt={user.fullName}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1 flex space-x-2">
                              <input
                                type="text"
                                value={newComments[tweet._id] || ''}
                                onChange={(e) => setNewComments(prev => ({ ...prev, [tweet._id]: e.target.value }))}
                                placeholder="Write a comment..."
                                className="flex-1 bg-dark-700 text-white placeholder-gray-400 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                              {(newComments[tweet._id] || '').trim() && (
                                <button
                                  onClick={() => handleAddComment(tweet._id)}
                                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Comments List */}
                        <div className="space-y-3">
                          {(comments[tweet._id] || []).map((comment) => (
                            <div key={comment._id} className="flex space-x-3">
                              <img
                                src={comment.owner?.avatar?.url || '/default-avatar.png'}
                                alt={comment.owner?.fullName}
                                className="w-6 h-6 rounded-full"
                              />
                              <div className="flex-1">
                                <div className="bg-dark-700 rounded-lg px-3 py-2">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-medium text-white text-sm">
                                      {comment.owner?.fullName}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                      @{comment.owner?.username}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 text-sm">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {pagination && currentPage < pagination.totalPages && (
          <div className="text-center mt-8">
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={loading}
              className="px-6 py-3 bg-dark-800 hover:bg-dark-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Tweets'}
            </button>
          </div>
        )}

        {/* Pagination Info */}
        {pagination && (
          <div className="text-center mt-4 text-gray-400 text-sm">
            Showing {tweets.length} of {pagination.totalTweets} tweets
          </div>
        )}
      </div>
    </div>
  );
};

export default TweetsFeed;