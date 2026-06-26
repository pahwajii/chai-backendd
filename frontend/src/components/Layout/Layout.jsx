import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Search, 
  Library, 
  History, 
  PlaySquare, 
  ThumbsUp, 
  Settings, 
  Menu, 
  X,
  Upload,
  User,
  LogOut,
  MessageCircle,
  Play
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const sidebarItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Library, label: 'Library', path: '/playlists' },
    { icon: History, label: 'History', path: '/history' },
    { icon: PlaySquare, label: 'Your Videos', path: isAuthenticated ? `/channel/${user?.username}` : '/login' },
    { icon: ThumbsUp, label: 'Liked Videos', path: '/liked' },
    { icon: MessageCircle, label: 'Tweets', path: '/tweets' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-dark-900 border-b border-dark-700 z-50">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-dark-800 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="flex items-center space-x-3">
              <img src="/feedflow2.png" alt="FeedTube" className="w-12 h-12 rounded-full shadow-lg" />
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-blue-600 bg-clip-text text-transparent">
                feedtube
              </span>
            </Link>
          </div>

          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-dark-800 border border-dark-600 rounded-full px-6 py-3 pl-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/upload"
                  className="p-3 hover:bg-dark-800 rounded-lg transition-colors"
                  title="Upload"
                >
                  <Upload className="w-6 h-6" />
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-3 p-2 hover:bg-dark-800 rounded-lg transition-colors">
                    <img
                      src={user?.avatar?.url || '/default-avatar.png'}
                      alt={user?.fullName}
                      className="w-10 h-10 rounded-full border-2 border-dark-600"
                    />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-dark-800 border border-dark-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-4 border-b border-dark-700">
                      <p className="font-semibold text-white">{user?.fullName}</p>
                      <p className="text-sm text-gray-400">@{user?.username}</p>
                    </div>
                    <div className="py-2">
                      <Link
                        to={`/channel/${user?.username}`}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-dark-700 transition-colors"
                      >
                        <User className="w-5 h-5" />
                        <span>Your Channel</span>
                      </Link>
                      <Link
                        to={`/profile/${user?.username}`}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-dark-700 transition-colors"
                      >
                        <User className="w-5 h-5" />
                        <span>Your Profile</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-dark-700 transition-colors w-full text-left"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-6 py-2 text-gray-300 hover:text-white transition-colors font-medium"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all font-medium shadow-lg"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 bottom-0 w-72 bg-dark-900 border-r border-dark-700 transform transition-transform duration-300 z-40 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-6">
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-200 border ${
                    isActive(item.path)
                      ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border-purple-500/30 shadow-lg'
                      : 'text-gray-400 hover:bg-dark-800 hover:text-white border-transparent hover:border-dark-600'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-6 h-6" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-72' : 'lg:ml-72'
      }`}>
        <div className="min-h-screen bg-dark-900">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
