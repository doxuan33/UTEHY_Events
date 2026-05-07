import { useEffect, useState } from 'react';
import { registrationsApi } from '@/api/registrations.api';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, XCircle, Clock, ArrowLeft, Search, Filter, Award } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const MyEvents = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const res = await registrationsApi.getMyRegistrations({ 
          status: filter as any,
          limit: 50 
        });
        const data = res.data.data;
        setRegistrations(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error('Failed to fetch my events', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyEvents();
  }, [filter]);

  const statusFilters = [
    { label: 'Tất cả', value: '' },
    { label: 'Đã đăng ký', value: 'REGISTERED' },
    { label: 'Đã tham gia', value: 'ATTENDED' },
    { label: 'Vắng mặt', value: 'ABSENT' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Lịch sử tham gia</h1>
            <p className="text-sm text-gray-500 font-medium">Theo dõi các sự kiện bạn đã đăng ký và tham gia</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex items-center bg-gray-100 p-1 rounded-2xl">
          {statusFilters.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                filter === s.value 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-10 w-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Chưa có dữ liệu</h3>
          <p className="text-gray-500 mb-6">Bạn chưa có hoạt động nào trong danh mục này.</p>
          <Link to="/events">
            <Button className="rounded-xl px-8">Khám phá sự kiện ngay</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <motion.div
              key={reg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-2xl overflow-hidden flex-shrink-0">
                  <img 
                    src={reg.event?.banner_url || `https://picsum.photos/seed/${reg.event_id}/200/200`} 
                    alt={reg.event?.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{reg.event?.title}</h3>
                  <div className="flex flex-wrap gap-y-1 gap-x-3 text-xs text-gray-500 font-medium">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1 text-blue-500" />
                      {reg.event?.start_time || reg.created_at ? format(new Date(reg.event?.start_time || reg.created_at), 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
                    </span>
                    <span className="flex items-center">
                      <Award className="h-3 w-3 mr-1 text-green-500" />
                      +{reg.event?.training_points || 0} điểm
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4">
                <Badge 
                  variant={
                    reg.status === 'ATTENDED' ? 'success' : 
                    reg.status === 'ABSENT' ? 'danger' : 
                    reg.status === 'CANCELLED' ? 'secondary' : 'primary'
                  }
                  className="px-4 py-1.5 font-bold"
                >
                  {reg.status === 'ATTENDED' ? 'Đã tham gia' : 
                   reg.status === 'ABSENT' ? 'Vắng mặt' : 
                   reg.status === 'CANCELLED' ? 'Đã hủy' : 'Đã đăng ký'}
                </Badge>
                <Link to={`/events/${reg.event_id}`}>
                  <Button variant="ghost" size="sm" className="rounded-xl text-blue-600 font-bold">
                    Chi tiết
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
