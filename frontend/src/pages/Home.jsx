import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchVideos } from '../store/slices/videoSlice';
import { Play, Clock, Eye, ThumbsUp } from 'lucide-react';

const Home = () => {
  const dispatch = useDispatch();
  const { videos, loading, error } = useSelector((state) => state.video);

  useEffect(() => {
    dispatch(fetchVideos());
  }, [dispatch]);

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
        <p className="text-red-400">Error loading videos: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
              <Play className="w-16 h-16 text-purple-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">No videos available</h3>
            <p className="text-gray-400 text-center max-w-md">
              There are no videos here available. Please try to search something else.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                    <span className="hover:text-white transition-colors">{video.owner?.username}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{formatViews(video.views)}</span>
                    </div>
                    <span>•</span>
                    <span>{formatDate(video.createdAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
