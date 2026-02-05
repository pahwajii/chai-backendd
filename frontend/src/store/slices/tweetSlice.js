import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Async thunks
export const fetchTweets = createAsyncThunk(
  'tweet/fetchTweets',
  async (username, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tweets/user/${username}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tweets');
    }
  }
);

export const createTweet = createAsyncThunk(
  'tweet/createTweet',
  async (tweetData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/tweets`, tweetData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create tweet');
    }
  }
);

export const updateTweet = createAsyncThunk(
  'tweet/updateTweet',
  async ({ tweetId, content }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.patch(`${API_BASE_URL}/tweets/${tweetId}`, { content }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update tweet');
    }
  }
);

export const deleteTweet = createAsyncThunk(
  'tweet/deleteTweet',
  async (tweetId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_BASE_URL}/tweets/${tweetId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return tweetId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete tweet');
    }
  }
);

export const likeTweet = createAsyncThunk(
  'tweet/likeTweet',
  async (tweetId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_BASE_URL}/likes/toggle/t/${tweetId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to like tweet');
    }
  }
);

const initialState = {
  tweets: [],
  loading: false,
  error: null,
};

const tweetSlice = createSlice({
  name: 'tweet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTweets: (state) => {
      state.tweets = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tweets
      .addCase(fetchTweets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTweets.fulfilled, (state, action) => {
        state.loading = false;
        state.tweets = action.payload.data;
      })
      .addCase(fetchTweets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create tweet
      .addCase(createTweet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTweet.fulfilled, (state, action) => {
        state.loading = false;
        state.tweets.unshift(action.payload.data);
      })
      .addCase(createTweet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update tweet
      .addCase(updateTweet.fulfilled, (state, action) => {
        const index = state.tweets.findIndex(tweet => tweet._id === action.payload.data._id);
        if (index !== -1) {
          state.tweets[index] = action.payload.data;
        }
      })
      // Delete tweet
      .addCase(deleteTweet.fulfilled, (state, action) => {
        state.tweets = state.tweets.filter(tweet => tweet._id !== action.payload);
      });
  },
});

export const { clearError, clearTweets } = tweetSlice.actions;
export default tweetSlice.reducer;
