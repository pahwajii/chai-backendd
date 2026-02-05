import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import VideoDetail from './pages/VideoDetail';
import Channel from './pages/Channel';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Tweets from './pages/Tweets';
import Playlists from './pages/Playlists';
import LikedVideos from './pages/LikedVideos';
import History from './pages/History';
import Search from './pages/Search';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
                  <Route path="/video/:videoId" element={<VideoDetail />} />
              <Route path="/channel/:username" element={<Channel />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/tweets" element={<Tweets />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/liked" element={<LikedVideos />} />
              <Route path="/history" element={<History />} />
              <Route path="/search" element={<Search />} />
            </Routes>
          </Layout>
        </div>
      </Router>
    </Provider>
  );
}

export default App;