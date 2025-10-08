import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload as UploadIcon, 
  Video, 
  Image, 
  X, 
  Check,
  AlertCircle,
  FileVideo,
  ImageIcon
} from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Upload = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [error, setError] = useState('');
  
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  
  

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleVideoFile(e.dataTransfer.files[0]);
    }
  };

  const handleVideoFile = (file) => {
    if (file.type.startsWith('video/')) {
      setSelectedVideo(file);
      setError('');
    } else {
      setError('Please select a valid video file');
    }
  };

  const handleVideoInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleVideoFile(e.target.files[0]);
    }
  };

  const handleThumbnailInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedThumbnail(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!selectedVideo || !title.trim()) {
      setError('Please select a video and enter a title');
      return;
    }

    // Check file sizes
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    const maxThumbnailSize = 10 * 1024 * 1024; // 10MB

    if (selectedVideo.size > maxVideoSize) {
      setError('Video file is too large. Maximum size is 100MB');
      return;
    }

    if (selectedThumbnail && selectedThumbnail.size > maxThumbnailSize) {
      setError('Thumbnail file is too large. Maximum size is 10MB');
      return;
    }

    console.log(`Video file size: ${(selectedVideo.size / 1024 / 1024).toFixed(2)}MB`);
    if (selectedThumbnail) {
      console.log(`Thumbnail file size: ${(selectedThumbnail.size / 1024 / 1024).toFixed(2)}MB`);
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', selectedVideo);
      if (selectedThumbnail) {
        formData.append('thumbnail', selectedThumbnail);
      }
      formData.append('title', title);
      formData.append('description', description);

      // Get the access token from localStorage
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('You must be logged in to upload videos');
        setUploadStatus('error');
        setIsUploading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/videos/publish`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus('success');
        setUploadProgress(100);
        
        // Redirect to the uploaded video after a short delay
        setTimeout(() => {
          navigate(`/video/${data.data._id}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Upload failed');
        setUploadStatus('error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedVideo(null);
    setSelectedThumbnail(null);
    setTitle('');
    setDescription('');
    setUploadStatus('idle');
    setUploadProgress(0);
    setError('');
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload Videos</h1>
          <p className="text-gray-400">Share your content with the world</p>
        </div>

        <div className="bg-dark-800 rounded-2xl p-8">
          {/* Video Upload Area */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Video File *
            </label>
            
            <div
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-purple-500 bg-purple-500/10'
                  : selectedVideo
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedVideo ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {selectedVideo.name}
                    </h3>
                    <p className="text-gray-400">
                      {formatFileSize(selectedVideo.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <UploadIcon className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Drag and drop video files to upload
                    </h3>
                    <p className="text-gray-400 mb-4">
                      Your videos will be private until you publish them.
                    </p>
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all font-medium"
                    >
                      Select Files
                    </button>
                  </div>
                </div>
              )}
              
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Thumbnail
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => thumbnailInputRef.current?.click()}
                className="px-6 py-3 bg-dark-700 text-gray-300 hover:bg-dark-600 rounded-xl transition-colors font-medium"
              >
                Choose file
              </button>
              <span className="text-gray-400">
                {selectedThumbnail ? selectedThumbnail.name : 'No file chosen'}
              </span>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Title Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Description Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter video description"
              rows={4}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Upload Progress */}
          {uploadStatus === 'uploading' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Uploading...</span>
                <span className="text-sm text-gray-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-dark-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center space-x-3">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">
                  Video uploaded successfully! Redirecting...
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={resetUpload}
              disabled={isUploading}
              className="px-6 py-3 bg-dark-700 text-gray-300 hover:bg-dark-600 rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            
            <button
              onClick={handleUpload}
              disabled={isUploading || !selectedVideo || !title.trim()}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadIcon className="w-4 h-4" />
                  <span>Upload Video</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;