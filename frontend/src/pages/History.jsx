import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../store/slices/authSlice';
import { History as HistoryIcon, Play, Eye, Clock, Trash2, Filter, SortAsc } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const History = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    if (isAuthenticated) {
      fetchWatchHistory();
    }
  }, [isAuthenticated]);

  const fetchWatchHistory = async () => {
    try {
      setLoading(true);
      console.log('Fetching watch history...');
      const response = await fetch(`${API_BASE_URL}/users/History`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      console.log('Watch history response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Watch history data:', data);
        setWatchHistory(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch watch history:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching watch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (window.confirm('Are you sure you want to clear your watch history? This action cannot be undone.')) {
      try {
        // This would require a new API endpoint to clear history
        // For now, we'll just clear the local state
        setWatchHistory([]);
      } catch (error) {
        console.error('Error clearing history:', error);
      }
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
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
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

  const sortHistory = (history) => {
    const sortedHistory = [...history];
    
    switch (sortBy) {
      case 'recent':
        return sortedHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return sortedHistory.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'views':
        return sortedHistory.sort((a, b) => (b.views || 0) - (a.views || 0));
      case 'title':
        return sortedHistory.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      default:
        return sortedHistory;
    }
  };

  const filterHistory = (history) => {
    if (filterBy === 'all') return history;
    
    const now = new Date();
    const filterDate = new Date();
    
    switch (filterBy) {
      case 'today':
        filterDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return history;
    }
    
    return history.filter(video => new Date(video.createdAt) >= filterDate);
  };

  const processedHistory = sortHistory(filterHistory(watchHistory));

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <HistoryIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-white mb-2">Sign in to view watch history</h2>
        <p className="text-gray-400">You need to be signed in to view your watch history.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Watch History</h1>
          <p className="text-gray-400">Videos you've watched recently ({watchHistory.length})</p>
        </div>
        {watchHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filters and Sort */}
      {watchHistory.length > 0 && (
        <div className="flex flex-wrap items-center justify-between mb-6 bg-dark-800 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <SortAsc className="w-4 h-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="recent">Most recent</option>
              <option value="oldest">Oldest first</option>
              <option value="views">Most viewed</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : processedHistory.length === 0 ? (
        <div className="text-center py-12">
          <HistoryIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">
            {watchHistory.length === 0 ? 'No watch history' : 'No videos match your filter'}
          </h3>
          <p className="text-gray-400">
            {watchHistory.length === 0 
              ? 'Start watching videos to build your history' 
              : 'Try adjusting your filters to see more videos'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {processedHistory.map((video) => (
            <div key={video._id} className="flex space-x-4 p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors">
              <Link to={`/video/${video._id}`} className="relative w-80 h-48 flex-shrink-0">
                <img
                  src={video.thumbnail?.url}
                  alt={video.title}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration)}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
                </div>
              </Link>
              
              <div className="flex-1">
                <Link to={`/video/${video._id}`}>
                  <h3 className="text-lg font-medium text-white hover:text-primary-400 transition-colors line-clamp-2 mb-2">
                    {video.title}
                  </h3>
                </Link>
                
                <Link to={`/channel/${video.owner?.username}`} className="flex items-center space-x-2 mb-2">
                  <img
                    src={video.owner?.avatar?.url || '/default-avatar.png'}
                    alt={video.owner?.fullName}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-gray-400 hover:text-primary-400 transition-colors">
                    {video.owner?.fullName}
                  </span>
                </Link>
                
                <p className="text-gray-300 line-clamp-2 mb-3">
                  {video.description}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{formatViews(video.views)} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
