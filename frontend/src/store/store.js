import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import videoSlice from './slices/videoSlice';
import tweetSlice from './slices/tweetSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    video: videoSlice,
    tweet: tweetSlice,
  },
});
