import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { eventsApi } from '@/api/events.api';
import { registrationsApi } from '@/api/registrations.api';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { motion } from 'motion/react';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Share2, Info, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventsApi.getById(id!);
        setEvent(res.data.data);
      } catch (err) {
        console.error('Failed to fetch event', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleRegister = async () => {
    if (isRegistering) return;
    
    // Check if event is full before registering
    if (!event.is_registered && event.current_slots >= event.max_slots) {
      alert('Rất tiếc, sự kiện này đã hết chỗ trống.');
      return;
    }

    setIsRegistering(true);
    try {
      if (event.is_registered) {
        const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện này không?');
        if (!confirmCancel) return;

        await registrationsApi.cancel(id!);
        alert('Đã hủy đăng ký tham gia sự kiện.');
      } else {
        await registrationsApi.register(id!);
        alert('Đăng ký tham gia thành công! Vui lòng kiểm tra lịch trình của bạn.');
      }
      // Refresh event data
      const res = await eventsApi.getById(id!);
      setEvent(res.data.data);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Thao tác thất bại.';
      if (message.toLowerCase().includes('overlap')) {
        alert('Lỗi: Bạn đã có một sự kiện khác diễn ra vào thời gian này. Vui lòng kiểm tra lại lịch trình.');
      } else {
        alert(message);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!event) return <div className="p-8 text-center">Không tìm thấy sự kiện.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-gray-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Quay lại
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="relative h-64 md:h-96">
          <img
            src={event.banner_url || `https://picsum.photos/seed/${event.id}/1200/800`}
            className="w-full h-full object-cover"
            alt={event.title}
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-6 left-6">
            <Badge variant="primary" className="bg-white/90 backdrop-blur-sm px-4 py-1.5 text-sm">
              {event.category?.name}
            </Badge>
          </div>
        </div>

        <div className="p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <Clock className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm font-medium">
                    {format(new Date(event.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                  </span>
                </div>
                <div className="flex items-center text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <MapPin className="h-4 w-4 mr-2 text-red-500" />
                  <span className="text-sm font-medium">{event.location}</span>
                </div>
                <div className="flex items-center text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <Users className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm font-medium">
                    {event._count?.registrations || 0}/{event.max_slots || '∞'} chỗ trống
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-blue-50 rounded-2xl border border-blue-100 min-w-[140px]">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Điểm rèn luyện</span>
              <span className="text-3xl font-black text-blue-700">+{event.training_points}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-600" />
                  Mô tả sự kiện
                </h2>
                <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed">
                  {event.description || 'Chưa có mô tả chi tiết cho sự kiện này.'}
                </div>
              </section>

              <section className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Đơn vị tổ chức</h3>
                <div className="flex items-center space-x-4">
                  <Avatar src={event.page?.logo_url} name={event.page?.name} size="lg" />
                  <div>
                    <h4 className="font-bold text-gray-900">{event.page?.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-1">{event.page?.description}</p>
                    <Button variant="ghost" size="sm" className="mt-2 -ml-2 text-blue-600">
                      Xem trang CLB
                    </Button>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="sticky top-24 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Đăng ký tham gia</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Trạng thái</span>
                    <Badge variant="success">Đang mở</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Hạn đăng ký</span>
                    <span className="font-medium">
                      {format(new Date(event.registration_deadline), 'dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                  
                  {event.is_registered && event.status === 'ONGOING' && (
                    <Link to="/scan-qr" className="block w-full">
                      <Button className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 mb-4">
                        <QrCode className="h-5 w-5 mr-2" />
                        Điểm danh ngay
                      </Button>
                    </Link>
                  )}

                  <Button 
                    className={`w-full py-6 text-lg rounded-xl shadow-lg ${event.is_registered ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 shadow-red-100' : 'shadow-blue-200'}`}
                    variant={event.is_registered ? 'outline' : 'primary'}
                    onClick={handleRegister}
                    isLoading={isRegistering}
                  >
                    {event.is_registered ? 'Hủy đăng ký' : 'Đăng ký ngay'}
                  </Button>
                  
                  <Button variant="outline" className="w-full rounded-xl">
                    <Share2 className="h-4 w-4 mr-2" />
                    Chia sẻ
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
