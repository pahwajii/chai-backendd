import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVideos } from '../store/slices/videoSlice';
import { Search as SearchIcon, Play, Eye, Clock } from 'lucide-react';

const Search = () => {
  const dispatch = useDispatch();
  const { videos, loading } = useSelector((state) => state.video);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      dispatch(fetchVideos({ query: searchQuery }));
    }
  }, [dispatch, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      dispatch(fetchVideos({ query: searchQuery }));
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-4">Search</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative max-w-2xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos..."
            className="w-full bg-dark-800 border border-gray-600 rounded-lg px-4 py-3 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </form>
      </div>

      {/* Search Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : videos.length === 0 && searchQuery ? (
        <div className="text-center py-12">
          <SearchIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No results found</h3>
          <p className="text-gray-400">Try different keywords or check your spelling</p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <div key={video._id} className="flex space-x-4 p-4 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors">
              <div className="relative w-80 h-48 flex-shrink-0">
                <img
                  src={video.thumbnail?.url}
                  alt={video.title}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                  {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-2 line-clamp-2">
                  {video.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{formatViews(video.views)} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                </div>
                <p className="text-gray-300 line-clamp-2 mb-2">
                  {video.description}
                </p>
                <div className="flex items-center space-x-2">
                  <img
                    src={video.owner?.avatar?.url || '/default-avatar.png'}
                    alt={video.owner?.fullName}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm text-gray-400">{video.owner?.fullName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
