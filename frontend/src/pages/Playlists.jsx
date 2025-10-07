import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Library, 
  Plus, 
  Play, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff,
  Clock,
  Video,
  MoreHorizontal
} from 'lucide-react';
import { getCurrentUser } from '../store/slices/authSlice';

const Playlists = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    isPublic: true
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylists();
    }
  }, [isAuthenticated]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/v1/playlists/user/${user?._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlaylist = (playlist) => {
    setEditingPlaylist(playlist);
    setNewPlaylist({ name: playlist.name, description: playlist.description || '', isPublic: playlist.isPublic });
    setShowEditForm(true);
  };

  const handleSubmitPlaylist = async (e) => {
    e.preventDefault();
    try {
      const url = editingPlaylist ? `http://localhost:8000/api/v1/playlists/${editingPlaylist._id}` : 'http://localhost:8000/api/v1/playlists';
      const method = editingPlaylist ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(newPlaylist),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingPlaylist) {
          setPlaylists(playlists.map(p => p._id === editingPlaylist._id ? { ...data.data, videos: data.data.videos.slice(0, 1) } : p));
        } else {
          setPlaylists([{ ...data.data, videos: data.data.videos.slice(0, 1) }, ...playlists]);
        }
        setNewPlaylist({ name: '', description: '', isPublic: true });
        setShowCreateForm(false);
        setShowEditForm(false);
        setEditingPlaylist(null);
      }
    } catch (error) {
      console.error('Error saving playlist:', error);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/playlists/${playlistId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (response.ok) {
          setPlaylists(playlists.filter(playlist => playlist._id !== playlistId));
        }
      } catch (error) {
        console.error('Error deleting playlist:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <Library className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-white mb-2">Sign in to manage playlists</h2>
        <p className="text-gray-400">You need to be signed in to create and manage playlists.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Playlists</h1>
          <p className="text-gray-400">Organize your favorite videos</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Create/Edit Playlist Form */}
      {(showCreateForm || showEditForm) && (
        <div className="bg-dark-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">{editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}</h3>
          <form onSubmit={handleSubmitPlaylist} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Playlist Name *
              </label>
              <input
                type="text"
                value={newPlaylist.name}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
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
                value={newPlaylist.description}
                onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                rows="3"
                className="w-full px-4 py-3 bg-dark-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="Enter playlist description"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newPlaylist.isPublic}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, isPublic: e.target.checked })}
                  className="w-4 h-4 text-primary-600 bg-dark-700 border-gray-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-300">Public playlist</span>
              </label>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); setShowEditForm(false); setEditingPlaylist(null); }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                {editingPlaylist ? 'Update Playlist' : 'Create Playlist'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Playlists Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-12">
          <Library className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No playlists yet</h3>
          <p className="text-gray-400 mb-6">Create your first playlist to organize your favorite videos</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Playlist</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <Link key={playlist._id} to={`/playlist/${playlist._id}`} className="bg-dark-800 rounded-lg overflow-hidden group block hover:bg-dark-750 transition-colors">
              <div className="relative">
                {playlist.videos && playlist.videos.length > 0 && playlist.videos[0]?.thumbnail?.url ? (
                  <img
                    src={playlist.videos[0].thumbnail.url}
                    alt={playlist.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <Video className="w-12 h-12 text-white" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  {playlist.isPublic ? (
                    <Eye className="w-4 h-4 text-green-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {playlist.name}
                  </h3>
                  <div className="relative group/menu">
                    <button className="p-1 text-gray-400 hover:text-white transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-8 w-48 bg-dark-700 border border-gray-600 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
                      <div className="py-2">
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditPlaylist(playlist); }} className="flex items-center space-x-3 px-4 py-2 hover:bg-dark-600 transition-colors w-full text-left text-white">
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeletePlaylist(playlist._id); }}
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-dark-600 transition-colors w-full text-left text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                  {playlist.description || 'No description'}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Video className="w-4 h-4" />
                    <span>{playlist.videos?.length || 0} videos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(playlist.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Playlists;
