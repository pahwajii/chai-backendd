import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { store } from './store/store';
import { initializeAuth } from './store/slices/authSlice';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import VideoDetail from './pages/VideoDetail';
import Channel from './pages/Channel';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Tweets from './pages/Tweets';
import TweetsFeed from './pages/TweetsFeed';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import LikedVideos from './pages/LikedVideos';
import History from './pages/History';
import Search from './pages/Search';
import UpdateAccountPage from './pages/UpdateAccountPage';

function AppContent() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize authentication on app start
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/settings" element={<UpdateAccountPage />} />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
                   <Route path="/video/:videoId" element={<VideoDetail />} />
               <Route path="/channel/:username" element={<Channel />} />
               <Route path="/profile/:username" element={<Profile />} />
               <Route path="/upload" element={<Upload />} />
               <Route path="/tweets" element={<TweetsFeed />} />
               <Route path="/playlists" element={<Playlists />} />
               <Route path="/playlist/:playlistId" element={<PlaylistDetail />} />
               <Route path="/liked" element={<LikedVideos />} />
               <Route path="/history" element={<History />} />
               <Route path="/search" element={<Search />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;