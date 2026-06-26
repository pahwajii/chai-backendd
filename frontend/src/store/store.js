 import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import videoSlice from './slices/videoSlice';
import tweetSlice from './slices/tweetSlice';
import playlistSlice from './slices/playlistSlice';
import commentSlice from './slices/commentSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    video: videoSlice,
    tweet: tweetSlice,
    playlist: playlistSlice,
    comment: commentSlice,
  },
});
