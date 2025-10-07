import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchLikedVideos } from '../store/slices/videoSlice';
import { ThumbsUp, Play, Eye, Clock, Filter, SortAsc, SortDesc } from 'lucide-react';

const LikedVideos = () => {
  const dispatch = useDispatch();
  const { likedVideos, loading } = useSelector((state) => state.video);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchLikedVideos());
    }
  }, [dispatch, isAuthenticated]);

  const formatViews = (views) => {
    if (!views || views === undefined || views === null) {
      return '0';
    }
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown';
      
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch (error) {
      return 'Unknown';
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

  const sortVideos = (videos) => {
    const sortedVideos = [...videos];
    
    switch (sortBy) {
      case 'recent':
        return sortedVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return sortedVideos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'views':
        return sortedVideos.sort((a, b) => (b.video?.views || 0) - (a.video?.views || 0));
      case 'title':
        return sortedVideos.sort((a, b) => (a.video?.title || '').localeCompare(b.video?.title || ''));
      default:
        return sortedVideos;
    }
  };

  const filterVideos = (videos) => {
    if (filterBy === 'all') return videos;
    
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
        return videos;
    }
    
    return videos.filter(like => new Date(like.createdAt) >= filterDate);
  };

  const processedVideos = sortVideos(filterVideos(likedVideos));

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <ThumbsUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-white mb-2">Sign in to view liked videos</h2>
        <p className="text-gray-400">You need to be signed in to view your liked videos.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Liked Videos</h1>
        <p className="text-gray-400">Videos you've liked ({likedVideos.length})</p>
      </div>

      {/* Filters and Sort */}
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : processedVideos.length === 0 ? (
        <div className="text-center py-12">
          <ThumbsUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">
            {likedVideos.length === 0 ? 'No liked videos yet' : 'No videos match your filter'}
          </h3>
          <p className="text-gray-400">
            {likedVideos.length === 0 
              ? 'Start liking videos to see them here' 
              : 'Try adjusting your filters to see more videos'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {processedVideos.map((like) => {
            if (!like || !like.video) {
              console.warn('Invalid like object:', like);
              return null;
            }
            return (
            <Link
              key={like._id}
              to={`/video/${like.video?._id}`}
              className="group cursor-pointer"
            >
              <div className="relative">
                <img
                  src={like.video?.thumbnail?.url}
                  alt={like.video?.title}
                  className="w-full aspect-video object-cover rounded-lg"
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(like.video?.duration)}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                  <ThumbsUp className="w-3 h-3" />
                  <span>Liked</span>
                </div>
              </div>
              <div className="mt-3">
                <h3 className="font-medium text-white line-clamp-2 group-hover:text-primary-400 transition-colors">
                  {like.video?.title}
                </h3>
                <div className="flex items-center space-x-2 mt-1 text-sm text-gray-400">
                  <span className="hover:text-primary-400 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/channel/${like.video?.owner?.username}`;
                        }}>
                    {like.video?.owner?.username}
                  </span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{formatViews(like.video?.views)}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(like.video?.createdAt)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Liked {formatDate(like.createdAt)}
                </p>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LikedVideos;
