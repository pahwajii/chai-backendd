import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  User,
  Calendar,
  Eye,
  ThumbsUp,
  Play,
  Users,
  Settings,
  Edit3,
  Camera,
  Heart,
  MessageCircle,
  Video,
  Clock,
  Mail,
  MapPin,
  X,
  Save,
  Lock
} from 'lucide-react';
import { getCurrentUser, updateAccountDetails, updateUserAvatar, changeCurrentPassword } from '../store/slices/authSlice';
import { fetchVideos } from '../store/slices/videoSlice';
import { fetchTweets } from '../store/slices/tweetSlice';

const Profile = () => {
  const { username } = useParams();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { videos } = useSelector((state) => state.video);
  const { tweets } = useSelector((state) => state.tweet);
  const [activeTab, setActiveTab] = useState('videos');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [channelStats, setChannelStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // Check if it's the current user's profile
        if (username === user?.username) {
          setIsOwnProfile(true);
          setProfileUser(user);
          setUserId(user._id);
          setEditForm({
            fullName: user?.fullName || '',
            email: user?.email || ''
          });
          await dispatch(getCurrentUser());

          // Fetch user's videos
          await dispatch(fetchVideos({ userId: user._id }));

          // Fetch user's tweets
          await dispatch(fetchTweets(username));
        } else {
          setIsOwnProfile(false);
          // Fetch other user's profile data
          try {
            const response = await fetch(`http://localhost:8000/api/v1/users/c/${username}`);
            if (response.ok) {
              const data = await response.json();
              setProfileUser(data.data);
              setUserId(data.data._id);

              // Fetch user's videos
              await dispatch(fetchVideos({ userId: data.data._id }));

              // Fetch user's tweets
              await dispatch(fetchTweets(username));
            } else {
              setProfileUser({ username, fullName: username, avatar: null });
              setUserId(null);
            }
          } catch (error) {
            console.error('Error fetching user:', error);
            setProfileUser({ username, fullName: username, avatar: null });
            setUserId(null);
          }
        }

        // Fetch subscriptions data
        await fetchSubscriptions();
        await fetchChannelStats();
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [dispatch, username, user?.username]);

  useEffect(() => {
    if (user) {
      setEditForm({
        fullName: user.fullName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      // Fetch subscribers
      const subscribersResponse = await fetch(`http://localhost:8000/api/v1/subscriptions/channel/${user?._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (subscribersResponse.ok) {
        const subscribersData = await subscribersResponse.json();
        setSubscribers(subscribersData.data || []);
      }

      // Fetch subscribed channels
      const subscribedResponse = await fetch(`http://localhost:8000/api/v1/subscriptions/subscriber/${user?._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (subscribedResponse.ok) {
        const subscribedData = await subscribedResponse.json();
        setSubscribedChannels(subscribedData.data || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchChannelStats = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/dashboard/stats/${user?._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (response.ok) {
        const statsData = await response.json();
        setChannelStats(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching channel stats:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
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

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateAccountDetails(editForm));
      setIsEditing(false);
      // Refresh user data
      await dispatch(getCurrentUser());
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      fullName: user?.fullName || '',
      email: user?.email || ''
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      try {
        await dispatch(updateUserAvatar(file));
        // Refresh user data
        await dispatch(getCurrentUser());
      } catch (error) {
        console.error('Error updating avatar:', error);
      }
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    try {
      await dispatch(changeCurrentPassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      }));
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      alert('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  const tabs = [
    { id: 'videos', label: 'Videos', icon: Video, count: videos.length },
    { id: 'tweets', label: 'Tweets', icon: MessageCircle, count: tweets.length },
    { id: 'playlists', label: 'Playlists', icon: Play },
    { id: 'liked', label: 'Liked', icon: Heart },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-dark-800 rounded-2xl p-8 mb-8 shadow-xl border border-dark-700">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="relative">
              <img
                src={profileUser?.avatar?.url || '/default-avatar.png'}
                alt={profileUser?.fullName}
                className="w-32 h-32 rounded-full object-cover border-4 border-dark-600 shadow-2xl"
              />
              {isOwnProfile && (
                <label className="absolute bottom-2 right-2 p-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full transition-all shadow-lg cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-3">
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="text-3xl font-bold text-white bg-dark-800 border border-dark-600 rounded px-2 py-1"
                />
              ) : (
                <h1 className="text-3xl font-bold text-white">{profileUser?.fullName}</h1>
              )}
              {isOwnProfile && !isEditing && (
                <button
                  onClick={handleEditProfile}
                  className="p-3 text-gray-400 hover:text-white transition-colors bg-dark-700 hover:bg-dark-600 rounded-lg"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
              {isEditing && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    className="p-3 text-green-400 hover:text-green-300 transition-colors bg-dark-700 hover:bg-dark-600 rounded-lg"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-3 text-red-400 hover:text-red-300 transition-colors bg-dark-700 hover:bg-dark-600 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-400 mb-4 text-lg">@{profileUser?.username}</p>
            {isEditing && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-dark-800 border border-dark-600 rounded px-3 py-2 text-white"
                />
              </div>
            )}
            
            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(profileUser?.createdAt || new Date())}</span>
              </div>
              {channelStats && (
                <>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{formatViews(channelStats.totalViews)} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{channelStats.totalSubscribers} subscribers</span>
                  </div>
                </>
              )}
            </div>

            {/* Bio */}
            <p className="text-gray-300 mb-4">
              {profileUser?.bio || "No bio available"}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              {isOwnProfile ? (
                <>
                  <Link
                    to="/upload"
                    className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all shadow-lg font-medium"
                  >
                    <Video className="w-5 h-5" />
                    <span>Upload Video</span>
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all shadow-lg font-medium"
                  >
                    <Edit3 className="w-5 h-5" />
                    <span>Edit Profile</span>
                  </Link>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-3 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all shadow-lg font-medium">
                    <Users className="w-5 h-5" />
                    <span>Subscribe</span>
                  </button>
                  {isAuthenticated && (
                    <Link
                      to="/settings"
                      className="flex items-center space-x-3 px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-all border border-dark-600 font-medium"
                    >
                      <Settings className="w-5 h-5" />
                      <span>Settings</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Section */}
      {isOwnProfile && (
        <div className="bg-dark-800 rounded-2xl p-6 mb-8 border border-dark-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Change Password</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-white"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-white"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded px-3 py-2 text-white"
                placeholder="Confirm new password"
              />
            </div>
            <button
              onClick={handlePasswordChange}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all"
            >
              Change Password
            </button>
          </div>
        </div>
      )}

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
            <h2 className="text-xl font-semibold text-white mb-4">Videos</h2>
            {videos.length === 0 ? (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No videos yet</h3>
                <p className="text-gray-400">
                  {isOwnProfile ? "Upload your first video to get started!" : "This user hasn't uploaded any videos yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <Link
                    key={video._id}
                    to={`/video/${video._id}`}
                    className="group cursor-pointer"
                  >
                    <div className="relative">
                      <img
                        src={video.thumbnail?.url}
                        alt={video.title}
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <div className="absolute bottom-3 right-3 bg-black/80 text-white text-sm px-2 py-1 rounded-lg backdrop-blur-sm">
                        {formatDuration(video.duration)}
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3 className="font-medium text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                        {video.title}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{formatViews(video.views)}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(video.createdAt)}</span>
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
            <h2 className="text-xl font-semibold text-white mb-4">Tweets</h2>
            {tweets.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No tweets yet</h3>
                <p className="text-gray-400">
                  {isOwnProfile ? "Share your first tweet!" : "This user hasn't tweeted yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tweets.map((tweet) => (
                  <div key={tweet._id} className="bg-dark-800 rounded-lg p-6">
                    <div className="flex space-x-4">
                      <img
                        src={profileUser?.avatar?.url || '/default-avatar.png'}
                        alt={profileUser?.fullName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-white">{profileUser?.fullName}</span>
                          <span className="text-gray-400">@{profileUser?.username}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-sm text-gray-400">{formatDate(tweet.createdAt)}</span>
                        </div>
                        <p className="text-white whitespace-pre-wrap">{tweet.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Playlists</h2>
            <div className="text-center py-12">
              <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No playlists yet</h3>
              <p className="text-gray-400">
                {isOwnProfile ? "Create your first playlist!" : "This user hasn't created any playlists yet."}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'liked' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Liked Videos</h2>
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No liked videos yet</h3>
              <p className="text-gray-400">
                {isOwnProfile ? "Start liking videos to see them here!" : "This user hasn't liked any videos yet."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subscriptions Section */}
      {isOwnProfile && (
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subscribers */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Subscribers ({subscribers.length})</span>
            </h3>
            {subscribers.length === 0 ? (
              <p className="text-gray-400">No subscribers yet</p>
            ) : (
              <div className="space-y-3">
                {subscribers.slice(0, 5).map((subscriber) => (
                  <div key={subscriber._id} className="flex items-center space-x-3">
                    <img
                      src={subscriber.subscriber?.avatar?.url || '/default-avatar.png'}
                      alt={subscriber.subscriber?.fullName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="text-white font-medium">{subscriber.subscriber?.fullName}</p>
                      <p className="text-sm text-gray-400">@{subscriber.subscriber?.username}</p>
                    </div>
                  </div>
                ))}
                {subscribers.length > 5 && (
                  <p className="text-sm text-gray-400">And {subscribers.length - 5} more...</p>
                )}
              </div>
            )}
          </div>

          {/* Subscribed Channels */}
          <div className="bg-dark-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Subscribed Channels ({subscribedChannels.length})</span>
            </h3>
            {subscribedChannels.length === 0 ? (
              <p className="text-gray-400">Not subscribed to any channels yet</p>
            ) : (
              <div className="space-y-3">
                {subscribedChannels.slice(0, 5).map((subscription) => (
                  <Link
                    key={subscription._id}
                    to={`/channel/${subscription.channel?.username}`}
                    className="flex items-center space-x-3 hover:bg-dark-700 p-2 rounded-lg transition-colors"
                  >
                    <img
                      src={subscription.channel?.avatar?.url || '/default-avatar.png'}
                      alt={subscription.channel?.fullName}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="text-white font-medium">{subscription.channel?.fullName}</p>
                      <p className="text-sm text-gray-400">@{subscription.channel?.username}</p>
                    </div>
                  </Link>
                ))}
                {subscribedChannels.length > 5 && (
                  <p className="text-sm text-gray-400">And {subscribedChannels.length - 5} more...</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Profile;
