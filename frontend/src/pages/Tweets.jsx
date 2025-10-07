import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTweets, createTweet, deleteTweet, likeTweet, fetchTweetComments, addTweetComment } from '../store/slices/tweetSlice';
import {
  MessageCircle,
  Heart,
  Trash2,
  Edit3,
  Send,
  User,
  Clock
} from 'lucide-react';

const Tweets = () => {
  const dispatch = useDispatch();
  const { tweets, loading, error, comments } = useSelector((state) => state.tweet);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [newTweet, setNewTweet] = useState('');
  const [editingTweet, setEditingTweet] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showComments, setShowComments] = useState({});
  const [newComments, setNewComments] = useState({});

  useEffect(() => {
    if (isAuthenticated && user?.username) {
      dispatch(fetchTweets(user.username));
    }
  }, [dispatch, isAuthenticated, user?.username]);

  const handleCreateTweet = async (e) => {
    e.preventDefault();
    if (newTweet.trim()) {
      await dispatch(createTweet({ content: newTweet.trim() }));
      setNewTweet('');
      // Refresh tweets
      if (user?.username) {
        dispatch(fetchTweets(user.username));
      }
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    if (window.confirm('Are you sure you want to delete this tweet?')) {
      await dispatch(deleteTweet(tweetId));
      // Refresh tweets
      if (user?.username) {
        dispatch(fetchTweets(user.username));
      }
    }
  };

  const handleLikeTweet = async (tweetId) => {
    if (isAuthenticated) {
      await dispatch(likeTweet(tweetId));
    }
  };

  const handleEditTweet = (tweet) => {
    setEditingTweet(tweet._id);
    setEditContent(tweet.content);
  };

  const handleSaveEdit = async (tweetId) => {
    if (editContent.trim()) {
      await dispatch(updateTweet({ tweetId, content: editContent.trim() }));
      setEditingTweet(null);
      setEditContent('');
      // Refresh tweets
      if (user?.username) {
        dispatch(fetchTweets(user.username));
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingTweet(null);
    setEditContent('');
  };

  const handleToggleComments = async (tweetId) => {
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
      await dispatch(addTweetComment({ tweetId, content }));
      setNewComments(prev => ({ ...prev, [tweetId]: '' }));
      // Refresh tweets to get updated comment count
      if (user?.username) {
        dispatch(fetchTweets(user.username));
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-white mb-2">Sign in to view tweets</h2>
        <p className="text-gray-400">You need to be signed in to view and create tweets.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Tweets</h1>
        <p className="text-gray-400">Share your thoughts with the community</p>
      </div>

      {/* Create Tweet Form */}
      <div className="bg-dark-800 rounded-lg p-6 mb-6">
        <form onSubmit={handleCreateTweet}>
          <div className="flex space-x-4">
            <img
              src={user?.avatar?.url || '/default-avatar.png'}
              alt={user?.fullName}
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <textarea
                value={newTweet}
                onChange={(e) => setNewTweet(e.target.value)}
                placeholder="What's happening?"
                className="w-full bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none"
                rows="3"
                maxLength="280"
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-400">
                  {newTweet.length}/280
                </span>
                <button
                  type="submit"
                  disabled={!newTweet.trim() || loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Tweet</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Tweets List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400">Error loading tweets: {error}</p>
        </div>
      ) : tweets.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No tweets yet</h3>
          <p className="text-gray-400">Share your first tweet to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tweets.map((tweet) => (
            <div key={tweet._id} className="bg-dark-800 rounded-lg p-6">
              <div className="flex space-x-4">
                <img
                  src={user?.avatar?.url || '/default-avatar.png'}
                  alt={user?.fullName}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-white">{user?.fullName}</span>
                    <span className="text-gray-400">@{user?.username}</span>
                    <span className="text-gray-500">•</span>
                    <div className="flex items-center space-x-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-sm">{formatDate(tweet.createdAt)}</span>
                    </div>
                  </div>
                  
                  {editingTweet === tweet._id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-dark-700 text-white placeholder-gray-400 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                        rows="3"
                        maxLength="280"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
                          {editContent.length}/280
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveEdit(tweet._id)}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-white mb-4 whitespace-pre-wrap">{tweet.content}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <button
                            onClick={() => handleLikeTweet(tweet._id)}
                            className="flex items-center space-x-2 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Heart className="w-4 h-4" />
                            <span>{tweet.likesCount || 0}</span>
                          </button>

                          <button
                            onClick={() => handleToggleComments(tweet._id)}
                            className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{tweet.commentsCount || 0}</span>
                          </button>
                        </div>
                        
                        {user?._id === tweet.owner && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditTweet(tweet)}
                              className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTweet(tweet._id)}
                              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Comments Section */}
                      {showComments[tweet._id] && (
                        <div className="mt-4 border-t border-gray-700 pt-4">
                          <div className="flex space-x-3 mb-4">
                            <img
                              src={user?.avatar?.url || '/default-avatar.png'}
                              alt={user?.fullName}
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
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tweets;
