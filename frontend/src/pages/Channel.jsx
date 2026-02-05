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
  Plus
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
      // Fetch channel info
      const channelResponse = await fetch(`/api/v1/users/channel/${username}`);
      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        setChannel(channelData.data);
      }

      // Fetch channel videos
      const videosResponse = await fetch(`/api/v1/dashboard/videos/${channel?.id || username}`);
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        setVideos(videosData.data);
      }

      // Fetch playlists
      const playlistsResponse = await fetch(`/api/v1/playlists/user/${channel?.id || username}`);
      if (playlistsResponse.ok) {
        const playlistsData = await playlistsResponse.json();
        setPlaylists(playlistsData.data);
      }

      // Fetch tweets
      const tweetsResponse = await fetch(`/api/v1/tweets/user/${username}`);
      if (tweetsResponse.ok) {
        const tweetsData = await tweetsResponse.json();
        setTweets(tweetsData.data);
      }

      // Fetch subscribed channels
      const subscribedResponse = await fetch(`/api/v1/subscriptions/subscriber/${channel?.id || username}`);
      if (subscribedResponse.ok) {
        const subscribedData = await subscribedResponse.json();
        setSubscribedChannels(subscribedData.data);
      }

    } catch (error) {
      console.error('Error fetching channel data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const response = await fetch(`/api/v1/subscriptions/toggle/${channel?.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        setIsSubscribed(!isSubscribed);
        // Update subscriber count
        setChannel(prev => ({
          ...prev,
          subscribersCount: prev.subscribersCount + (isSubscribed ? -1 : 1)
        }));
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
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
                  <span>{formatViews(channel.subscribersCount || 0)} Subscribers</span>
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
                  {videos.map((video) => (
                    <Link
                      key={video._id}
                      to={`/video/${video._id}`}
                      className="group cursor-pointer"
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
                  {playlists.map((playlist) => (
                    <Link
                      key={playlist._id}
                      to={`/playlist/${playlist._id}`}
                      className="group cursor-pointer"
                    >
                      <div className="bg-dark-800 rounded-2xl overflow-hidden hover:bg-dark-700 transition-colors">
                        <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                          <Folder className="w-16 h-16 text-purple-400" />
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
                  {tweets.map((tweet) => (
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
                  {subscribedChannels.map((subscribedChannel) => (
                    <Link
                      key={subscribedChannel._id}
                      to={`/channel/${subscribedChannel.username}`}
                      className="group cursor-pointer"
                    >
                      <div className="bg-dark-800 rounded-2xl p-6 hover:bg-dark-700 transition-colors">
                        <div className="flex items-center space-x-4">
                          <img
                            src={subscribedChannel.avatar?.url || '/default-avatar.png'}
                            alt={subscribedChannel.fullName}
                            className="w-16 h-16 rounded-full"
                          />
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                              {subscribedChannel.fullName}
                            </h3>
                            <p className="text-gray-400">@{subscribedChannel.username}</p>
                            <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                              <Users className="w-4 h-4" />
                              <span>{formatViews(subscribedChannel.subscribersCount || 0)} subscribers</span>
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
    </div>
  );
};

export default Channel;