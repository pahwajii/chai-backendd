import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Play,
  Clock,
  Eye,
  User,
  ThumbsUp,
  Share,
  MoreHorizontal,
  Edit3,
  Trash2,
  Plus
} from 'lucide-react';
import { fetchUserPlaylists } from '../store/slices/playlistSlice';

const PlaylistDetail = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    isPublic: true
  });

  useEffect(() => {
    fetchPlaylistDetails();
  }, [playlistId]);

  const fetchPlaylistDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/v1/playlists/${playlistId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylist(data.data);
      } else {
        setError('Failed to load playlist');
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
      setError('Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlaylist = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:8000/api/v1/playlists/${playlistId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylist(data.data);
        setShowEditForm(false);
      } else {
        console.error('Failed to update playlist');
      }
    } catch (error) {
      console.error('Error updating playlist:', error);
    }
  };

  const handleRemoveVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to remove this video from the playlist?')) {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`http://localhost:8000/api/v1/playlists/${playlistId}/video/${videoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setPlaylist(prev => ({ ...prev, videos: prev.videos.filter(v => v._id !== videoId) }));
        } else {
          console.error('Failed to remove video');
        }
      } catch (error) {
        console.error('Error removing video:', error);
      }
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
    const numViews = Number(views) || 0;
    if (numViews >= 1000000) {
      return `${(numViews / 1000000).toFixed(1)}M`;
    } else if (numViews >= 1000) {
      return `${(numViews / 1000).toFixed(1)}K`;
    }
    return numViews.toString();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Playlist not found</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link to="/playlists" className="text-primary-400 hover:text-primary-300">
            Back to playlists
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user && playlist.owner && user._id === playlist.owner._id;

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Playlist Header */}
        <div className="bg-dark-800 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Playlist Thumbnail */}
            <div className="flex-shrink-0">
              {/* Alternate between three images for playlist thumbnails */}
              {(() => {
                const images = [
                  '/play3.png',
                  '/playl.png',
                  '/playlist1.png'
                ];
                // Use playlistId to pick image (fallback to 0 if not available)
                let idx = 0;
                if (playlistId) {
                  // Try to get a number from playlistId (hash-like)
                  let sum = 0;
                  for (let i = 0; i < playlistId.length; i++) {
                    sum += playlistId.charCodeAt(i);
                  }
                  idx = sum % images.length;
                }
                return (
                  <img
                    src={images[idx]}
                    alt="Playlist thumbnail"
                    className="w-48 h-32 object-cover rounded-xl"
                  />
                );
              })()}
            </div>

            {/* Playlist Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{playlist.name}</h1>
                  <p className="text-gray-400 text-lg mb-4">{playlist.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{playlist.videos?.length || 0} videos</span>
                    <span>•</span>
                    <span>Created {formatDate(playlist.createdAt)}</span>
                    {playlist.isPublic ? (
                      <span className="text-green-400">Public</span>
                    ) : (
                      <span className="text-gray-400">Private</span>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <div className="flex items-center space-x-2">
                    <button onClick={() => { setEditData({ name: playlist.name, description: playlist.description || '', isPublic: playlist.isPublic }); setShowEditForm(true); }} className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                      <Share className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Owner Info */}
              <div className="flex items-center space-x-4">
                <Link
                  to={`/channel/${playlist.owner?.username}`}
                  className="flex items-center space-x-3 hover:bg-dark-700 rounded-lg p-2 transition-colors"
                >
                  <img
                    src={playlist.owner?.avatar?.url || '/default-avatar.png'}
                    alt={playlist.owner?.fullName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="text-white font-medium">{playlist.owner?.fullName}</p>
                    <p className="text-gray-400 text-sm">
                      {formatViews(playlist.owner?.subscribersCount || 0)} subscribers
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Playlist Form */}
        {showEditForm && (
          <div className="bg-dark-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Edit Playlist</h3>
            <form onSubmit={handleUpdatePlaylist} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter playlist name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-3 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Enter playlist description"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editData.isPublic}
                    onChange={(e) => setEditData({ ...editData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-primary-600 bg-dark-700 border-gray-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-300">Public playlist</span>
                </label>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Update Playlist
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Videos List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white mb-6">Videos</h2>

          {playlist.videos && playlist.videos.length > 0 ? (
            <div className="space-y-3">
              {playlist.videos.map((video, index) => (
                <Link
                  key={video._id}
                  to={`/video/${video._id}`}
                  className="flex space-x-4 bg-dark-800 rounded-xl p-4 hover:bg-dark-700 transition-colors group"
                >
                  {/* Video Number */}
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-dark-700 rounded-lg text-gray-400 font-medium">
                    {index + 1}
                  </div>

                  {/* Video Thumbnail */}
                  <div className="flex-shrink-0 relative">
                    {video.thumbnail?.url ? (
                      <img
                        src={video.thumbnail.url}
                        alt={video.title}
                        className="w-40 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-40 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center rounded-lg">
                      <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium line-clamp-2 group-hover:text-primary-400 transition-colors mb-1">
                      {video.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
                      <span>{formatViews(video.views)} views</span>
                      <span>•</span>
                      <span>{formatDate(video.createdAt)}</span>
                    </div>
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {video.description}
                    </p>
                  </div>

                  {/* Video Owner */}
                  <div className="flex-shrink-0 text-right flex flex-col items-end space-y-2">
                    <span
                      className="text-gray-400 hover:text-white text-sm cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/channel/${video.owner?.username}`);
                      }}
                    >
                      {video.owner?.fullName}
                    </span>
                    {isOwner && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveVideo(video._id); }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No videos in this playlist</h3>
              <p className="text-gray-400 mb-6">Add some videos to get started</p>
              {isOwner && (
                <Link
                  to="/"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Browse videos</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistDetail;