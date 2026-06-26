import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVideoById, likeVideo, dislikeVideo } from '../store/slices/videoSlice';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share, 
  Download, 
  Flag, 
  MoreHorizontal,
  Play,
  Clock,
  Eye
} from 'lucide-react';

const VideoPlayer = () => {
  const { videoId } = useParams();
  const dispatch = useDispatch();
  const { currentVideo, loading, error } = useSelector((state) => state.video);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    if (videoId) {
      dispatch(fetchVideoById(videoId));
    }
  }, [dispatch, videoId]);

  const handleLike = () => {
    if (isAuthenticated) {
      dispatch(likeVideo(videoId));
      setIsLiked(!isLiked);
      if (isDisliked) setIsDisliked(false);
    }
  };

  const handleDislike = () => {
    if (isAuthenticated) {
      dispatch(dislikeVideo(videoId));
      setIsDisliked(!isDisliked);
      if (isLiked) setIsLiked(false);
    }
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">Error loading video: {error}</p>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Video not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Section */}
        <div className="lg:col-span-2">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              src={currentVideo.videoFile?.url}
              controls
              className="w-full h-full"
              poster={currentVideo.thumbnail?.url}
            >
              Your browser does not support the video tag.
            </video>
          </div>

          {/* Video Info */}
          <div className="mt-4">
            <h1 className="text-xl font-semibold text-white mb-2">
              {currentVideo.title}
            </h1>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{formatViews(currentVideo.views)} views</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(currentVideo.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleLike}
                  disabled={isDisliked}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                    isLiked
                      ? 'bg-primary-600 text-white'
                      : isDisliked
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-dark-700 text-white hover:bg-dark-600'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Like</span>
                </button>
                <button
                  onClick={handleDislike}
                  disabled={isLiked}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                    isDisliked
                      ? 'bg-red-600 text-white'
                      : isLiked
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                      : 'bg-dark-700 text-white hover:bg-dark-600'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>Dislike</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 bg-dark-700 text-white rounded-full hover:bg-dark-600 transition-colors"
                >
                  <Share className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-dark-700 text-white rounded-full hover:bg-dark-600 transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button className="p-2 bg-dark-700 text-white rounded-full hover:bg-dark-600 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Channel Info */}
            <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg mb-4">
              <div className="flex items-center space-x-4">
                <Link to={`/channel/${currentVideo.owner?.username}`}>
                  <img
                    src={currentVideo.owner?.avatar?.url || '/default-avatar.png'}
                    alt={currentVideo.owner?.fullName}
                    className="w-12 h-12 rounded-full"
                  />
                </Link>
                <div>
                  <Link
                    to={`/channel/${currentVideo.owner?.username}`}
                    className="font-medium text-white hover:text-primary-400 transition-colors"
                  >
                    {currentVideo.owner?.fullName}
                  </Link>
                  <p className="text-sm text-gray-400">
                    @{currentVideo.owner?.username}
                  </p>
                </div>
              </div>
              <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full transition-colors">
                Subscribe
              </button>
            </div>

            {/* Description */}
            <div className="bg-dark-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  {currentVideo.views} views • {formatDate(currentVideo.createdAt)}
                </span>
              </div>
              <div className="text-white">
                {showDescription ? (
                  <p className="whitespace-pre-wrap">{currentVideo.description}</p>
                ) : (
                  <p className="line-clamp-3">{currentVideo.description}</p>
                )}
                {currentVideo.description.length > 200 && (
                  <button
                    onClick={() => setShowDescription(!showDescription)}
                    className="text-primary-400 hover:text-primary-300 mt-2"
                  >
                    {showDescription ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Related Videos</h3>
          {/* Related videos would be fetched from the API */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-40 h-24 bg-dark-700 rounded-lg flex-shrink-0">
                  <div className="w-full h-full bg-dark-600 rounded-lg flex items-center justify-center">
                    <Play className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white line-clamp-2 mb-1">
                    Related Video Title {i}
                  </h4>
                  <p className="text-sm text-gray-400 mb-1">Channel Name</p>
                  <p className="text-xs text-gray-500">1.2M views • 2 days ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share Message Notification */}
      {shareMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {shareMessage}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
