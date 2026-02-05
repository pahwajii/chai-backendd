import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Maximize, 
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Share,
  Clock,
  Eye,
  User,
  Heart
} from 'lucide-react';

const VideoDetail = () => {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchVideoDetails();
    fetchRecommendations();
  }, [videoId]);

  const fetchVideoDetails = async () => {
    try {
      const response = await fetch(`/api/v1/videos/${videoId}`);
      if (response.ok) {
        const data = await response.json();
        setVideo(data.data);
        setDuration(data.data.duration || 0);
      }
    } catch (error) {
      console.error('Error fetching video:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(`/api/v1/videos/recommendations/${videoId}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.data);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
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

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/v1/likes/toggle/v/${videoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        setIsLiked(!isLiked);
        if (isDisliked) setIsDisliked(false);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleDislike = async () => {
    try {
      // Implement dislike functionality
      setIsDisliked(!isDisliked);
      if (isLiked) setIsLiked(false);
    } catch (error) {
      console.error('Error toggling dislike:', error);
    }
  };

  const handleSave = async () => {
    try {
      // Implement save functionality
      setIsSaved(!isSaved);
    } catch (error) {
      console.error('Error toggling save:', error);
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
              <div className="aspect-video bg-dark-800 flex items-center justify-center">
                {video.videoFile?.url ? (
                  <video
                    className="w-full h-full object-cover"
                    poster={video.thumbnail?.url}
                    controls
                  >
                    <source src={video.videoFile.url} type="video/mp4" />
                  </video>
                ) : (
                  <div className="text-center">
                    <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Video not available</p>
                  </div>
                )}
              </div>
              
              {/* Custom Video Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePlayPause}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white" />
                    )}
                  </button>
                  
                  <div className="flex-1 bg-white/20 rounded-full h-1">
                    <div 
                      className="bg-red-500 h-full rounded-full transition-all"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  
                  <span className="text-white text-sm">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                  
                  <button
                    onClick={handleVolumeToggle}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  
                  <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <Settings className="w-5 h-5 text-white" />
                  </button>
                  
                  <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <Maximize className="w-5 h-5 text-white" />
                  </button>
                  
                  <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-white" />
                  </button>
                </div>
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
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                      isLiked 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{video.likesCount || 0}</span>
                  </button>
                  
                  <button
                    onClick={handleDislike}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                      isDisliked 
                        ? 'bg-red-600 text-white' 
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
                  
                  <button className="flex items-center space-x-2 px-4 py-2 bg-dark-700 text-gray-300 hover:bg-dark-600 rounded-full transition-colors">
                    <Share className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Channel Info */}
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-2xl">
                <div className="flex items-center space-x-4">
                  <Link to={`/channel/${video.owner?.username}`}>
                    <img
                      src={video.owner?.avatar?.url || '/default-avatar.png'}
                      alt={video.owner?.fullName}
                      className="w-12 h-12 rounded-full"
                    />
                  </Link>
                  <div>
                    <Link 
                      to={`/channel/${video.owner?.username}`}
                      className="text-lg font-semibold text-white hover:text-primary-400 transition-colors"
                    >
                      {video.owner?.fullName}
                    </Link>
                    <p className="text-sm text-gray-400">
                      {formatViews(video.owner?.subscribersCount || 0)} subscribers
                    </p>
                  </div>
                </div>
                
                <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all font-medium">
                  Subscribe
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
    </div>
  );
};

export default VideoDetail;
