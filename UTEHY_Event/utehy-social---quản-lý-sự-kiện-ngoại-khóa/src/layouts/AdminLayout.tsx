import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/api/auth.api';
import { 
  Shield, 
  Users, 
  CalendarCheck, 
  BarChart3, 
  Settings, 
  Tag,
  LogOut,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      authApi.logout(refreshToken).catch(console.error);
    }
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', icon: BarChart3, label: 'Tổng quan' },
    { path: '/admin/events', icon: CalendarCheck, label: 'Duyệt sự kiện' },
    { path: '/admin/categories', icon: Tag, label: 'Danh mục' },
    { path: '/admin/users', icon: Users, label: 'Sinh viên' },
    { path: '/admin/pages', icon: Shield, label: 'Câu lạc bộ' },
    { path: '/admin/settings', icon: Settings, label: 'Hệ thống' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden h-16 bg-gray-900 text-white flex items-center justify-between px-4 sticky top-0 z-50">
        <Link to="/admin" className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold tracking-tight">UTEHY Admin</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-400"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 bg-gray-900 text-white flex-col fixed inset-y-0">
        <div className="p-8">
          <Link to="/admin" className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">UTEHY Admin</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all group ${
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 mr-3 transition-colors ${isActive ? 'text-blue-400' : 'group-hover:text-blue-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3.5 text-sm font-semibold text-red-400 rounded-xl hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="md:hidden fixed inset-0 z-40 bg-gray-900 pt-16"
          >
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-4 text-base font-semibold rounded-xl ${
                      isActive 
                        ? 'bg-white/10 text-white' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mr-4 ${isActive ? 'text-blue-400' : ''}`} />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-4 text-base font-semibold text-red-400 hover:bg-red-500/10 rounded-xl"
                >
                  <LogOut className="h-6 w-6 mr-4" />
                  Đăng xuất
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 min-h-screen flex flex-col">
        <header className="hidden md:flex h-20 bg-white border-b border-gray-200 items-center justify-between px-10 sticky top-0 z-10">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhanh..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900">{user?.full_name}</span>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">Superuser</span>
            </div>
            <div className="h-12 w-12 bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-400 font-bold">
              {user?.full_name?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-10 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
