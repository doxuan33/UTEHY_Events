import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { Avatar } from '@/components/common/Avatar';
import { 
  Home, 
  Calendar, 
  User, 
  Users,
  Bell, 
  LogOut, 
  Search,
  PlusSquare,
  Menu,
  X,
  QrCode,
  Settings
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotificationsStore } from '@/store/notifications.store';

export const StudentLayout = () => {
  const { user, logout } = useAuthStore();
  const { unreadCount, connectRealtime, disconnectRealtime } = useNotificationsStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      connectRealtime();
    }
    return () => {
      disconnectRealtime();
    };
  }, [user]);

  const navItems = [
    { path: '/', icon: Home, label: 'Bảng tin' },
    { path: '/events', icon: Calendar, label: 'Sự kiện' },
    { path: '/clubs', icon: Users, label: 'CLB' },
    { path: '/scan-qr', icon: QrCode, label: 'Điểm danh' },
    { path: '/notifications', icon: Bell, label: 'Thông báo' },
    { path: '/profile', icon: User, label: 'Cá nhân' },
  ];

  const handleLogout = () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      authApi.logout(refreshToken).catch(console.error);
    }
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/logo.png" alt="UTEHY Social" className="h-10 w-auto object-contain" />
                <span className="hidden md:block text-xl font-bold text-gray-900 tracking-tight">
                  UTEHY Social
                </span>
              </Link>
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  placeholder="Tìm kiếm sự kiện, CLB..."
                />
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-1">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100 mr-2">
                <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                  P
                </div>
                <span className="text-xs font-bold text-blue-700">{user?.training_points || 0} RL</span>
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-1.5" />
                    {item.label}
                    {item.path === '/notifications' && unreadCount > 0 && (
                      <span className="ml-1.5 flex items-center justify-center h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="h-6 w-px bg-gray-200 mx-2" />
              <Link
                to="/settings"
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Cài đặt tài khoản"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="h-5 w-5" />
              </button>
              <Link to="/profile" className="ml-2">
                <Avatar src={user?.avatar_url} name={user?.full_name} size="sm" />
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              <button className="p-2 text-gray-500">
                <Search className="h-6 w-6" />
              </button>
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-500"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-200 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-base font-medium ${
                      isActive 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-6 w-6 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 rounded-xl text-base font-medium text-gray-600 hover:bg-gray-50"
              >
                <Settings className="h-6 w-6 mr-3" />
                Cài đặt tài khoản
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl"
              >
                <LogOut className="h-6 w-6 mr-3" />
                Đăng xuất
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center relative ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon className="h-6 w-6" />
              {item.path === '/notifications' && unreadCount > 0 && (
                <span className="absolute -top-1 right-2 flex items-center justify-center h-4 w-4 bg-red-500 text-white text-[8px] font-bold rounded-full border-2 border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
