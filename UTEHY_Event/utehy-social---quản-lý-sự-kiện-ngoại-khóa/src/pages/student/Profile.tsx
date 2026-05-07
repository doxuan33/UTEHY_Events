import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { registrationsApi } from '@/api/registrations.api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Settings, 
  Award, 
  History, 
  ShieldCheck, 
  ChevronRight,
  Star,
  Trophy,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Profile = () => {
  const { user } = useAuthStore();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await registrationsApi.getMyRegistrations({ limit: 5 });
        const data = res.data.data;
        setRegistrations(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const stats = [
    { label: 'Sự kiện', value: registrations.length.toString(), icon: History, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Điểm RL', value: user?.training_points?.toString() || '0', icon: Award, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Huy hiệu', value: '4', icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  ];

  const badges = [
    { name: 'Tân binh', description: 'Tham gia sự kiện đầu tiên', icon: Star, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    { name: 'Năng nổ', description: 'Tham gia 5 sự kiện', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { name: 'Chuyên gia', description: 'Đạt 50 điểm rèn luyện', icon: Award, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    { name: 'Tình nguyện viên', description: 'Tham gia sự kiện tình nguyện', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <Avatar 
              src={user?.avatar_url} 
              name={user?.full_name} 
              size="xl" 
              className="border-4 border-white shadow-lg" 
            />
            <div className="flex space-x-3">
              <Link to="/settings">
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Settings className="h-4 w-4 mr-2" />
                  Cài đặt
                </Button>
              </Link>
              <Link to="/settings">
                <Button size="sm" className="rounded-xl">
                  Chỉnh sửa
                </Button>
              </Link>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.full_name}</h1>
            <p className="text-gray-500 flex items-center mt-1">
              <ShieldCheck className="h-4 w-4 mr-1 text-blue-500" />
              Sinh viên • MSSV: {user?.student_id || 'Chưa cập nhật'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                  <div className={`mx-auto h-10 w-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-2`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Achievements */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Bộ sưu tập Huy hiệu</h2>
            <button className="text-sm font-medium text-blue-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {badges.map((badge) => (
              <div key={badge.name} className="flex items-center p-3 rounded-2xl bg-gray-50 border border-gray-100 space-x-3">
                <div className={`h-12 w-12 ${badge.bg} rounded-full flex items-center justify-center border-2 ${badge.border}`}>
                  <badge.icon className={`h-6 w-6 ${badge.color}`} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{badge.name}</h4>
                  <p className="text-[10px] text-gray-500 line-clamp-1">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activities */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Lịch sử tham gia</h2>
            <Link to="/my-events" className="text-sm font-medium text-blue-600 hover:underline">Xem tất cả</Link>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />)
            ) : registrations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">Bạn chưa tham gia sự kiện nào.</p>
              </div>
            ) : (
              registrations.map((reg) => (
                <Link 
                  key={reg.id} 
                  to={`/events/${reg.event_id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      reg.status === 'ATTENDED' ? 'bg-green-50 text-green-600' : 
                      reg.status === 'ABSENT' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {reg.status === 'ATTENDED' ? <CheckCircle2 className="h-5 w-5" /> : 
                       reg.status === 'ABSENT' ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{reg.event?.title}</h4>
                      <p className="text-xs text-gray-500">
                        {reg.status === 'ATTENDED' ? 'Đã tham gia' : 
                         reg.status === 'ABSENT' ? 'Vắng mặt' : 'Đã đăng ký'} • {reg.created_at ? format(new Date(reg.created_at), 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
