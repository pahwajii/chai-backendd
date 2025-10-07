import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Async thunks
export const fetchComments = createAsyncThunk(
  'comment/fetchComments',
  async ({ videoId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/comments/${videoId}`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { data: { docs: [], page: 1, limit: 10, totalPages: 1, totalDocs: 0 } };
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comments');
    }
  }
);

export const addComment = createAsyncThunk(
  'comment/addComment',
  async ({ videoId, content }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_BASE_URL}/comments/${videoId}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add comment');
    }
  }
);

export const updateComment = createAsyncThunk(
  'comment/updateComment',
  async ({ commentId, content }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_BASE_URL}/comments/${commentId}`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update comment');
    }
  }
);

export const deleteComment = createAsyncThunk(
  'comment/deleteComment',
  async (commentId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(`${API_BASE_URL}/comments/${commentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { ...response.data, commentId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete comment');
    }
  }
);

const initialState = {
  comments: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalComments: 0,
  },
};

const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearComments: (state) => {
      state.comments = [];
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch comments
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        const commentsData = action.payload.data.docs || action.payload.data || [];
        state.comments = Array.isArray(commentsData) ? commentsData : [];
        state.pagination = {
          page: action.payload.data.page || 1,
          limit: action.payload.data.limit || 10,
          totalPages: action.payload.data.totalPages || 1,
          totalComments: action.payload.data.totalDocs || (Array.isArray(commentsData) ? commentsData.length : 0) || 0,
        };
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add comment
      .addCase(addComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.loading = false;
        state.comments.unshift(action.payload.data);
        state.pagination.totalComments += 1;
      })
      .addCase(addComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update comment
      .addCase(updateComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.comments.findIndex(comment => comment._id === action.payload.data._id);
        if (index !== -1) {
          state.comments[index] = action.payload.data;
        }
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete comment
      .addCase(deleteComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = state.comments.filter(comment => comment._id !== action.payload.commentId);
        state.pagination.totalComments -= 1;
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearComments } = commentSlice.actions;
export default commentSlice.reducer;