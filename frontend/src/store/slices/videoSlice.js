import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Async thunks
export const fetchVideos = createAsyncThunk(
  'video/fetchVideos',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch videos');
    }
  }
);

export const fetchVideoById = createAsyncThunk(
  'video/fetchVideoById',
  async (videoId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/videos/${videoId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch video');
    }
  }
);

export const uploadVideo = createAsyncThunk(
  'video/uploadVideo',
  async (videoData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('title', videoData.title);
      formData.append('description', videoData.description);
      formData.append('video', videoData.video);
      formData.append('thumbnail', videoData.thumbnail);

      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/videos/publish`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload video');
    }
  }
);

export const likeVideo = createAsyncThunk(
  'video/likeVideo',
  async (videoId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/likes/toggle/v/${videoId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like video');
    }
  }
);

export const dislikeVideo = createAsyncThunk(
  'video/dislikeVideo',
  async (videoId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/dislikes/toggle/v/${videoId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to dislike video');
    }
  }
);

export const fetchLikedVideos = createAsyncThunk(
  'video/fetchLikedVideos',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/likes/liked-videos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch liked videos');
    }
  }
);

const initialState = {
  videos: [],
  currentVideo: null,
  likedVideos: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalVideos: 0,
  },
};

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentVideo: (state) => {
      state.currentVideo = null;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch videos
      .addCase(fetchVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = action.payload.data.docs || action.payload.data;
        state.pagination = {
          page: action.payload.data.page || 1,
          limit: action.payload.data.limit || 10,
          totalPages: action.payload.data.totalPages || 1,
          totalVideos: action.payload.data.totalDocs || action.payload.data.length || 0,
        };
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch video by ID
      .addCase(fetchVideoById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideoById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentVideo = action.payload.data;
      })
      .addCase(fetchVideoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload video
      .addCase(uploadVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadVideo.fulfilled, (state, action) => {
        state.loading = false;
        state.videos.unshift(action.payload.data);
      })
      .addCase(uploadVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Like video
      .addCase(likeVideo.fulfilled, (state, action) => {
        // Update like and dislike counts in current video
        if (state.currentVideo) {
          state.currentVideo.likesCount = action.payload.data.totalLikes;
          state.currentVideo.dislikesCount = action.payload.data.totalDislikes;
        }
      })
      // Dislike video
      .addCase(dislikeVideo.fulfilled, (state, action) => {
        // Update like and dislike counts in current video
        if (state.currentVideo) {
          state.currentVideo.likesCount = action.payload.data.totalLikes;
          state.currentVideo.dislikesCount = action.payload.data.totalDislikes;
        }
      })
      // Fetch liked videos
      .addCase(fetchLikedVideos.fulfilled, (state, action) => {
        state.likedVideos = action.payload.data;
      });
  },
});

export const { clearError, clearCurrentVideo, setSearchQuery } = videoSlice.actions;
export default videoSlice.reducer;
