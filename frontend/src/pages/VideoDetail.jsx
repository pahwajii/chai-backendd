import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Play,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share,
  Clock,
  Eye,
  User,
  Heart,
  Trash2,
  Plus,
  Check
} from 'lucide-react';
import { fetchUserPlaylists, addVideoToPlaylist } from '../store/slices/playlistSlice';
import CommentSection from '../components/Comments/CommentSection';

const VideoDetail = () => {
  const { videoId } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { playlists, loading: playlistLoading } = useSelector((state) => state.playlist);

  const [video, setVideo] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedPlaylists, setSelectedPlaylists] = useState(new Set());
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    fetchVideoDetails();
    fetchRecommendations();
    addToWatchHistory();
  }, [videoId]);

  // Check subscription status when video or user changes
  useEffect(() => {
    if (video && user) {
      checkSubscriptionStatus();
      // Set like/dislike status from video data
      setIsLiked(video.isLikedByUser || false);
      setIsDisliked(video.isDislikedByUser || false);
    }
  }, [video, user]);

  // Video state monitoring (removed for cleaner console)

  const fetchVideoDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/videos/${videoId}`);
      if (response.ok) {
        const data = await response.json();
        // Video data loaded successfully
        console.log('Video data received:', data.data);
        console.log('Video owner:', data.data.owner);
        console.log('Video owner username:', data.data.owner?.username);
        setVideo(data.data);
        setDuration(data.data.duration || 0);
        setVideoError(false); // Reset error state when new video loads

        // Set like/dislike status from video data
        if (user && data.data) {
          setIsLiked(data.data.isLikedByUser || false);
          setIsDisliked(data.data.isDislikedByUser || false);
        }
      } else {
        console.error('Failed to fetch video:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };


  const checkSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token || !user || !video?.owner?._id) {
        console.log('Missing data for subscription check:', { token: !!token, user: !!user, ownerId: video?.owner?._id });
        return;
      }

      console.log('Checking subscription status for channel:', video.owner._id);

      // Check if user is subscribed to this channel
      // We can use the getSubscribedChannels API to check
      const response = await fetch(`http://localhost:8000/api/v1/subscriptions/subscriber/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Subscription check API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Subscription check data:', data);
        // Check if current channel is in subscribed channels
        const isSubscribedToChannel = data.data.some(sub => sub.channel?._id === video.owner._id);
        console.log('Is subscribed to channel:', isSubscribedToChannel);
        setIsSubscribed(isSubscribedToChannel);
      } else {
        const errorText = await response.text();
        console.error('Failed to check subscription status:', response.status, errorText);
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setIsSubscribed(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/videos/recommendations/${videoId}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.data);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const addToWatchHistory = async () => {
    try {
      // Only add to watch history if user is logged in
      const token = localStorage.getItem('accessToken');
      const userId = user?._id;

      if (!token || !userId) {
        console.log('No access token or user found, skipping watch history');
        return;
      }

      console.log('Adding video to watch history:', videoId, 'for user:', userId);
      const response = await fetch(`http://localhost:8000/api/v1/users/watch-history/${videoId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Watch history API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Successfully added to watch history:', data);
      } else {
        const errorText = await response.text();
        console.error('Failed to add to watch history:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error adding to watch history:', error);
    }
  };

  const formatDuration = (seconds) => {
    const numSeconds = Number(seconds) || 0;
    const hours = Math.floor(numSeconds / 3600);
    const minutes = Math.floor((numSeconds % 3600) / 60);
    const secs = Math.floor(numSeconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
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


  const handleLike = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('You must be logged in to like videos');
        return;
      }

      console.log('Toggling like for video:', videoId, 'current isLiked:', isLiked);

      const response = await fetch(`http://localhost:8000/api/v1/likes/toggle/v/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      console.log('Like API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Like toggle response:', data);

        // Update the like state based on the response
        setIsLiked(!isLiked);

        // Update the video's like and dislike counts
        setVideo(prev => ({
          ...prev,
          likesCount: data.data.totalLikes,
          dislikesCount: data.data.totalDislikes
        }));

        // If user liked, remove dislike
        if (isDisliked) setIsDisliked(false);
      } else {
        const errorText = await response.text();
        console.error('Failed to toggle like:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDislike = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('You must be logged in to dislike videos');
        return;
      }

      console.log('Toggling dislike for video:', videoId, 'current isDisliked:', isDisliked);

      const response = await fetch(`http://localhost:8000/api/v1/dislikes/toggle/v/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      console.log('Dislike API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Dislike toggle response:', data);

        // Update the dislike state based on the response
        setIsDisliked(!isDisliked);

        // Update the video's like and dislike counts
        setVideo(prev => ({
          ...prev,
          likesCount: data.data.totalLikes,
          dislikesCount: data.data.totalDislikes
        }));

        // If user disliked, remove like
        if (isLiked) setIsLiked(false);
      } else {
        const errorText = await response.text();
        console.error('Failed to toggle dislike:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error toggling dislike:', error);
    }
  };

  const handleSave = async () => {
    try {
      if (!user) {
        console.error('You must be logged in to save videos to playlists');
        return;
      }

      // Fetch user playlists if not already loaded
      if (playlists.length === 0) {
        await dispatch(fetchUserPlaylists(user._id));
      }

      // Initialize with empty selection - user can choose which playlists to add to
      setSelectedPlaylists(new Set());

      setShowPlaylistModal(true);
    } catch (error) {
      console.error('Error opening playlist modal:', error);
    }
  };

  const handlePlaylistSelection = async (playlistId) => {
    const newSelected = new Set(selectedPlaylists);
    if (newSelected.has(playlistId)) {
      newSelected.delete(playlistId);
    } else {
      newSelected.add(playlistId);
    }
    setSelectedPlaylists(newSelected);
  };

  const handleSaveToPlaylists = async () => {
    try {
      // Add video to selected playlists
      for (const playlistId of selectedPlaylists) {
        await dispatch(addVideoToPlaylist({ playlistId, videoId }));
      }

      setShowPlaylistModal(false);
      setIsSaved(true);
    } catch (error) {
      console.error('Error saving to playlists:', error);
    }
  };

  const handleSubscribe = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('You must be logged in to subscribe');
        return;
      }

      if (!video?.owner?._id) {
        console.error('Channel information not available');
        return;
      }

      // Validate that the channelId is a valid format
      const channelId = video.owner._id.toString().trim();
      if (!channelId || channelId.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(channelId)) {
        console.error('Invalid channel ID format:', channelId);
        return;
      }

      console.log('Toggling subscription for channel:', channelId, 'current isSubscribed:', isSubscribed);
      console.log('Channel ID type:', typeof channelId, 'value:', channelId);

      const response = await fetch(`http://localhost:8000/api/v1/subscriptions/toggle/${channelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Subscribe API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Subscribe toggle response:', data);

        // Toggle subscription state
        setIsSubscribed(!isSubscribed);

        // Update subscriber count from API response
        setVideo(prev => ({
          ...prev,
          owner: {
            ...prev.owner,
            subscribersCount: data.data.subscriberCount
          }
        }));
      } else {
        const errorText = await response.text();
        console.error('Failed to toggle subscription:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  const handleDeleteVideo = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('You must be logged in to delete videos');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/v1/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        // Redirect to home page after successful deletion
        window.location.href = '/';
      } else {
        const errorData = await response.json();
        console.error('Error deleting video:', errorData.message);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = async () => {
    try {
      const videoUrl = `${window.location.origin}/video/${videoId}`;
      
      // Try to use the modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(videoUrl);
        setShareMessage('Link copied to clipboard!');
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = videoUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setShareMessage('Link copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy text: ', err);
          setShareMessage('Failed to copy link');
        }
        
        document.body.removeChild(textArea);
      }
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setShareMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error sharing video:', error);
      setShareMessage('Failed to copy link');
      setTimeout(() => {
        setShareMessage('');
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Video not found</h2>
          <Link to="/" className="text-primary-400 hover:text-primary-300">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Video Section */}
          <div className="lg:col-span-2">

            {/* Video Player */}
            <div className="relative bg-black rounded-2xl overflow-hidden mb-6">
              <div className="aspect-video bg-dark-800" style={{ position: 'relative', overflow: 'hidden' }}>
                {video.videoFile?.url ? (
                  <video
                    className="w-full h-full"
                    poster={video.thumbnail?.url}
                    controls
                    preload="metadata"
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    src={video.videoFile.url}
                    onError={(e) => {
                      console.error('Video load error:', e);
                      setVideoError(true);
                    }}
                    onCanPlay={() => {
                      setVideoError(false);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-center">
                    <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Video not available</p>
                    {videoError ? (
                      <p className="text-gray-500 text-sm mt-2">Failed to load video file</p>
                    ) : (
                      <p className="text-gray-500 text-sm mt-2">No video file URL found</p>
                    )}
                    {video.videoFile?.url && (
                      <p className="text-gray-500 text-xs mt-1">URL: {video.videoFile.url}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Video Information */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-white">{video.title}</h1>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>{formatViews(video.views)} views</span>
                  <span>•</span>
                  <span>{formatDate(video.createdAt)}</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleLike}
                    disabled={isDisliked}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                      isLiked
                        ? 'bg-primary-600 text-white'
                        : isDisliked
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{video.likesCount || 0}</span>
                  </button>
                  
                  <button
                    onClick={handleDislike}
                    disabled={isLiked}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                      isDisliked
                        ? 'bg-red-600 text-white'
                        : isLiked
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>{video.dislikesCount || 0}</span>
                  </button>
                  
                  <button
                    onClick={handleSave}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                      isSaved 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 bg-dark-700 text-gray-300 hover:bg-dark-600 rounded-full transition-colors"
                  >
                    <Share className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  
                  {/* Delete Button - Only show for video owner */}
                  {video.owner && video.owner._id === localStorage.getItem('userId') && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white hover:bg-red-500 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Channel Info */}
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-2xl">
                <div className="flex items-center space-x-4">
                  {video.owner?.username ? (
                    <Link to={`/channel/${video.owner.username}`}>
                      <img
                        src={video.owner?.avatar?.url || '/default-avatar.png'}
                        alt={video.owner?.fullName}
                        className="w-12 h-12 rounded-full"
                      />
                    </Link>
                  ) : (
                    <img
                      src={video.owner?.avatar?.url || '/default-avatar.png'}
                      alt={video.owner?.fullName}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    {video.owner?.username ? (
                      <Link
                        to={`/channel/${video.owner.username}`}
                        className="text-lg font-semibold text-white hover:text-primary-400 transition-colors"
                      >
                        {video.owner?.fullName}
                      </Link>
                    ) : (
                      <span className="text-lg font-semibold text-white">
                        {video.owner?.fullName}
                      </span>
                    )}
                    <p className="text-sm text-gray-400">
                      {formatViews(video.owner?.subscribersCount || 0)} subscribers
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleSubscribe}
                  className={`px-6 py-3 rounded-xl transition-all font-medium ${
                    isSubscribed
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                  }`}
                >
                  {isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
              </div>

              {/* Video Description */}
              <div className="bg-dark-800 rounded-2xl p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{formatViews(video.views)} views</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">{formatDate(video.createdAt)}</span>
                  </div>
                </div>

                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    {video.description || "No description available for this video."}
                  </p>
                </div>
              </div>

              {/* Comments Section */}
              <CommentSection videoId={videoId} />
            </div>
          </div>

          {/* Recommendations Sidebar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Recommended</h3>
            
            {recommendations.map((recVideo) => (
              <Link
                key={recVideo._id}
                to={`/video/${recVideo._id}`}
                className="flex space-x-3 group hover:bg-dark-800 rounded-xl p-2 transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={recVideo.thumbnail?.url}
                    alt={recVideo.title}
                    className="w-40 h-24 object-cover rounded-lg"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                    {formatDuration(recVideo.duration)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {recVideo.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {recVideo.owner?.fullName}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                    <span>{formatViews(recVideo.views)} views</span>
                    <span>•</span>
                    <span>{formatDate(recVideo.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
            
            {recommendations.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No recommendations available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Delete Video</h3>
                <p className="text-gray-400">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-300 mb-2">Are you sure you want to delete this video?</p>
              <div className="bg-dark-700 rounded-lg p-3">
                <h4 className="text-white font-medium">{video.title}</h4>
                <p className="text-gray-400 text-sm mt-1">
                  {formatViews(video.views)} views • {formatDate(video.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVideo}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Video'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Selection Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Save to Playlist</h3>
                <p className="text-gray-400">Select playlists to add this video</p>
              </div>
            </div>

            {playlistLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">You don't have any playlists yet</p>
                <Link
                  to="/playlists"
                  className="text-primary-400 hover:text-primary-300 underline"
                  onClick={() => setShowPlaylistModal(false)}
                >
                  Create your first playlist
                </Link>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {playlists.map((playlist) => (
                  <div
                    key={playlist._id}
                    onClick={() => handlePlaylistSelection(playlist._id)}
                    className="flex items-center space-x-3 p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-dark-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {playlist.videos && playlist.videos.length > 0 ? (
                        <img
                          src={playlist.videos[0]?.thumbnail?.url}
                          alt={playlist.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Bookmark className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">{playlist.name}</h4>
                      <p className="text-gray-400 text-sm">
                        {playlist.videos?.length || 0} videos
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedPlaylists.has(playlist._id)
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-gray-500'
                    }`}>
                      {selectedPlaylists.has(playlist._id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToPlaylists}
                disabled={playlistLoading}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {playlistLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Message Notification */}
      {shareMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {shareMessage}
        </div>
      )}
    </div>
  );
};

export default VideoDetail;
