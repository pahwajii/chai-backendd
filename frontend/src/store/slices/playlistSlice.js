import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Async thunks
export const fetchUserPlaylists = createAsyncThunk(
  'playlist/fetchUserPlaylists',
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/playlists/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch playlists');
    }
  }
);

export const addVideoToPlaylist = createAsyncThunk(
  'playlist/addVideoToPlaylist',
  async ({ playlistId, videoId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/playlists/${playlistId}/video/${videoId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add video to playlist');
    }
  }
);

export const createPlaylist = createAsyncThunk(
  'playlist/createPlaylist',
  async (playlistData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/playlists`, playlistData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create playlist');
    }
  }
);

const initialState = {
  playlists: [],
  loading: false,
  error: null,
};

const playlistSlice = createSlice({
  name: 'playlist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addPlaylist: (state, action) => {
      state.playlists.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user playlists
      .addCase(fetchUserPlaylists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPlaylists.fulfilled, (state, action) => {
        state.loading = false;
        state.playlists = action.payload.data || [];
      })
      .addCase(fetchUserPlaylists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add video to playlist
      .addCase(addVideoToPlaylist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addVideoToPlaylist.fulfilled, (state, action) => {
        state.loading = false;
        // Update the playlist in the state
        const updatedPlaylist = action.payload.data;
        const index = state.playlists.findIndex(p => p._id === updatedPlaylist._id);
        if (index !== -1) {
          state.playlists[index] = updatedPlaylist;
        }
      })
      .addCase(addVideoToPlaylist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create playlist
      .addCase(createPlaylist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPlaylist.fulfilled, (state, action) => {
        state.loading = false;
        state.playlists.unshift(action.payload.data);
      })
      .addCase(createPlaylist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, addPlaylist } = playlistSlice.actions;
export default playlistSlice.reducer;