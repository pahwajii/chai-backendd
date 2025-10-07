import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, 
  Users, 
  Video, 
  MessageCircle, 
  Calendar, 
  Eye,
  ThumbsUp,
  Clock,
  Folder,
  User,
  Settings,
  Edit,
  Plus,
  Trash2
} from 'lucide-react';

const Channel = () => {
  const { username } = useParams();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [tweets, setTweets] = useState([]);
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const tabs = [
    { id: 'videos', label: 'Videos', icon: Video, count: videos.length },
    { id: 'playlist', label: 'Playlist', icon: Folder, count: playlists.length },
    { id: 'tweets', label: 'Tweets', icon: MessageCircle, count: tweets.length },
    { id: 'subscribed', label: 'Subscribed', icon: Users, count: subscribedChannels.length }
  ];

  useEffect(() => {
    fetchChannelData();
  }, [username]);


  const fetchChannelData = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      // Fetch channel info - using correct endpoint
      const channelResponse = await fetch(`http://localhost:8000/api/v1/users/c/${username}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        console.log('Channel data received:', channelData);
        setChannel(channelData.data);

        // Set subscription status from API response
        if (channelData.data.isSubscribed !== undefined) {
          setIsSubscribed(channelData.data.isSubscribed);
        }

        // Now fetch videos using the channel ID from the response
        const videosResponse = await fetch(`http://localhost:8000/api/v1/dashboard/videos/${channelData.data._id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          console.log('Videos data received:', videosData);
          setVideos(Array.isArray(videosData.data) ? videosData.data : []);
        }

        // Fetch playlists - using correct endpoint with user ID
        const playlistsResponse = await fetch(`http://localhost:8000/api/v1/playlists/user/${channelData.data._id}`);
        if (playlistsResponse.ok) {
          const playlistsData = await playlistsResponse.json();
          console.log('Playlists data received:', playlistsData);
          setPlaylists(Array.isArray(playlistsData.data) ? playlistsData.data : []);
        }

        // Fetch subscribed channels - using correct endpoint
        const subscribedResponse = await fetch(`http://localhost:8000/api/v1/subscriptions/subscriber/${channelData.data._id}`);
        if (subscribedResponse.ok) {
          const subscribedData = await subscribedResponse.json();
          console.log('Subscribed channels data received:', subscribedData);
          setSubscribedChannels(Array.isArray(subscribedData.data) ? subscribedData.data : []);
        }
      }

      // Fetch tweets - using correct endpoint
      const tweetsResponse = await fetch(`http://localhost:8000/api/v1/tweets/user/${username}`);
      if (tweetsResponse.ok) {
        const tweetsData = await tweetsResponse.json();
        console.log('Tweets data received:', tweetsData);
        setTweets(Array.isArray(tweetsData.data) ? tweetsData.data : []);
      }

    } catch (error) {
      console.error('Error fetching channel data:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSubscribe = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('You must be logged in to subscribe');
        return;
      }

      console.log('Toggling subscription for channel:', channel?._id);

      const response = await fetch(`http://localhost:8000/api/v1/subscriptions/toggle/${channel?._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Subscribe API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Subscribe response:', data);

        // Toggle subscription state
        setIsSubscribed(!isSubscribed);

        // Update subscriber count - we need to recalculate it
        // For now, just toggle locally, but ideally we'd refetch the channel data
        setChannel(prev => ({
          ...prev,
          subscribersCount: prev.subscribersCount + (isSubscribed ? -1 : 1)
        }));
      } else {
        const errorText = await response.text();
        console.error('Failed to toggle subscription:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  const handleDeleteVideo = async (videoId) => {
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
        // Remove video from local state
        setVideos(prev => prev.filter(video => video._id !== videoId));
        setDeleteConfirm(null);
        console.log('Video deleted successfully');
      } else {
        const errorData = await response.json();
        console.error('Error deleting video:', errorData.message);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    } finally {
      setDeleting(false);
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
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Channel not found</h2>
          <Link to="/" className="text-primary-400 hover:text-primary-300">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Channel Banner */}
      <div className="relative h-64 bg-gradient-to-r from-purple-600 to-pink-600">
        {channel.coverImage?.url && (
          <img
            src={channel.coverImage.url}
            alt="Channel banner"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Channel Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6 mb-8">
          <div className="flex items-center space-x-4">
            <img
              src={channel.avatar?.url || '/default-avatar.png'}
              alt={channel.fullName}
              className="w-24 h-24 rounded-full border-4 border-dark-600 shadow-2xl"
            />
            <div>
              <h1 className="text-3xl font-bold text-white">{channel.fullName}</h1>
              <p className="text-gray-400 text-lg">@{channel.username}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{formatViews(channel.subscriberscount || 0)} Subscribers</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Video className="w-4 h-4" />
                  <span>{channel.videosCount || 0} Videos</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 ml-auto">
            <button
              onClick={handleSubscribe}
              className={`px-6 py-3 rounded-xl transition-all font-medium ${
                isSubscribed
                  ? 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
              }`}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
            
            <button className="p-3 bg-dark-700 text-gray-300 hover:bg-dark-600 rounded-xl transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 bg-dark-800 rounded-2xl p-2 border border-dark-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-6 py-4 rounded-xl transition-all duration-200 font-medium ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-dark-600 text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'videos' && (
            <div>
              {videos.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No videos yet</h3>
                  <p className="text-gray-400">This channel hasn't uploaded any videos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.isArray(videos) && videos.map((video) => (
                    <div key={video._id} className="group relative">
                      <Link
                        to={`/video/${video._id}`}
                        className="block cursor-pointer"
                      >
                        <div className="relative overflow-hidden rounded-2xl">
                          <img
                            src={video.thumbnail?.url}
                            alt={video.title}
                            className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute bottom-3 right-3 bg-black/80 text-white text-sm px-2 py-1 rounded-lg backdrop-blur-sm">
                            {formatDuration(video.duration)}
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-2xl flex items-center justify-center">
                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                              <Play className="w-8 h-8 text-black ml-1" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <h3 className="font-semibold text-white line-clamp-2 group-hover:text-purple-400 transition-colors text-lg mb-2">
                            {video.title}
                          </h3>
                          <div className="flex items-center space-x-3 text-sm text-gray-400">
                            <span>{formatViews(video.views)} views</span>
                            <span>•</span>
                            <span>{formatDate(video.createdAt)}</span>
                          </div>
                        </div>
                      </Link>
                      
                      {/* Delete Button - Only show for video owner */}
                      {channel && channel._id === video.owner?._id && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirm(video);
                          }}
                          className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                          title="Delete video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'playlist' && (
            <div>
              {playlists.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No playlists yet</h3>
                  <p className="text-gray-400">This channel hasn't created any playlists.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.isArray(playlists) && playlists.map((playlist) => (
                    <Link
                      key={playlist._id}
                      to={`/playlist/${playlist._id}`}
                      className="group cursor-pointer"
                    >
                      <div className="bg-dark-800 rounded-2xl overflow-hidden hover:bg-dark-700 transition-colors">
                        <div className="aspect-video relative">
                          {playlist.videos && playlist.videos.length > 0 && playlist.videos[0]?.thumbnail?.url ? (
                            <img
                              src={playlist.videos[0].thumbnail.url}
                              alt={playlist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                              <Folder className="w-12 h-12 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors mb-2">
                            {playlist.name}
                          </h3>
                          <p className="text-sm text-gray-400 mb-2">
                            {playlist.description || 'No description'}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>{playlist.videos?.length || 0} videos</span>
                            <span>•</span>
                            <span>{formatDate(playlist.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tweets' && (
            <div>
              {tweets.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No tweets yet</h3>
                  <p className="text-gray-400">This channel hasn't posted any tweets.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(tweets) && tweets.map((tweet) => (
                    <div key={tweet._id} className="bg-dark-800 rounded-2xl p-6">
                      <div className="flex items-start space-x-4">
                        <img
                          src={channel.avatar?.url || '/default-avatar.png'}
                          alt={channel.fullName}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-white">{channel.fullName}</h4>
                            <span className="text-gray-400">@{channel.username}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-400">{formatDate(tweet.createdAt)}</span>
                          </div>
                          <p className="text-gray-300 mb-4">{tweet.content}</p>
                          <div className="flex items-center space-x-6">
                            <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                              <ThumbsUp className="w-4 h-4" />
                              <span>{tweet.likesCount || 0}</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
                              <MessageCircle className="w-4 h-4" />
                              <span>{tweet.commentsCount || 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscribed' && (
            <div>
              {subscribedChannels.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No subscriptions</h3>
                  <p className="text-gray-400">This channel hasn't subscribed to anyone yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.isArray(subscribedChannels) && subscribedChannels.map((subscription) => (
                    <Link
                      key={subscription._id}
                      to={`/channel/${subscription.channel?.username}`}
                      className="group cursor-pointer"
                    >
                      <div className="bg-dark-800 rounded-2xl p-6 hover:bg-dark-700 transition-colors">
                        <div className="flex items-center space-x-4">
                          <img
                            src={subscription.channel?.avatar?.url || '/default-avatar.png'}
                            alt={subscription.channel?.fullName}
                            className="w-16 h-16 rounded-full"
                          />
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                              {subscription.channel?.fullName}
                            </h3>
                            <p className="text-gray-400">@{subscription.channel?.username}</p>
                            <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                              <Users className="w-4 h-4" />
                              <span>{formatViews(subscription.channel?.subscribersCount || 0)} subscribers</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
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
                <h4 className="text-white font-medium">{deleteConfirm.title}</h4>
                <p className="text-gray-400 text-sm mt-1">
                  {formatViews(deleteConfirm.views)} views • {formatDate(deleteConfirm.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteVideo(deleteConfirm._id)}
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
    </div>
  );
};

export default Channel;