import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsApi } from '@/api/events.api';
import { pagesApi } from '@/api/pages.api';
import { checkinApi } from '@/api/checkin.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Award, 
  Loader2, 
  AlertCircle, 
  X, 
  Send, 
  Clock,
  Map as MapIcon,
  CheckCircle2,
  Timer,
  FileText,
  ChevronRight,
  Download,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const EventManagement = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [page, setPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    location: '',
    latitude: '',
    longitude: '',
    start_time: '',
    end_time: '',
    registration_deadline: '',
    max_participants: '',
    training_points: '',
    image_url: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      // 1. Get managed page
      const pagesRes = await pagesApi.getAll();
      const managedPage = pagesRes.data.data?.[0];
      
      if (managedPage) {
        setPage(managedPage);
        // 2. Get events for this page
        const eventsRes = await eventsApi.getAll({ page_id: managedPage.id, limit: 50 });
        setEvents(eventsRes.data.data.data || []);
      }

      // 3. Get categories
      const catRes = await eventsApi.getCategories();
      setCategories(catRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCheckin = async (eventId: string) => {
    try {
      setIsActionLoading(eventId);
      await checkinApi.startCheckin(eventId);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'ONGOING' } : e));
      navigate(`/page-admin/events/${eventId}/qr-display`);
    } catch (err: any) {
      console.error('Failed to start checkin', err);
      alert(err.response?.data?.message || 'Không thể bắt đầu điểm danh.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEndCheckin = async (eventId: string) => {
    if (!confirm('Bạn có chắc chắn muốn kết thúc điểm danh? Thao tác này sẽ đóng đăng ký và cập nhật vắng mặt cho những người chưa điểm danh.')) return;
    
    try {
      setIsActionLoading(eventId);
      await checkinApi.endCheckin(eventId);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'CLOSED' } : e));
      alert('Đã kết thúc điểm danh và đóng sự kiện.');
    } catch (err: any) {
      console.error('Failed to end checkin', err);
      alert(err.response?.data?.message || 'Không thể kết thúc điểm danh.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setFormData({
      title: '',
      description: '',
      category_id: categories[0]?.id || '',
      location: '',
      latitude: '',
      longitude: '',
      start_time: '',
      end_time: '',
      registration_deadline: '',
      max_participants: '',
      training_points: '',
      image_url: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: any) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      category_id: event.category_id?.toString() || '',
      location: event.location || '',
      latitude: event.latitude?.toString() || '',
      longitude: event.longitude?.toString() || '',
      start_time: event.start_time ? format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm") : '',
      end_time: event.end_time ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : '',
      registration_deadline: event.registration_deadline ? format(new Date(event.registration_deadline), "yyyy-MM-dd'T'HH:mm") : '',
      max_participants: (event.max_slots || event.max_participants || '').toString(),
      training_points: (event.training_points || 0).toString(),
      image_url: event.banner_url || event.image_url || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sự kiện này? Thao tác này không thể hoàn tác.')) return;

    try {
      setIsActionLoading(eventId);
      await eventsApi.delete(eventId, page.id);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      alert('Đã xóa sự kiện thành công.');
    } catch (err: any) {
      console.error('Failed to delete event', err);
      alert(err.response?.data?.message || 'Xóa sự kiện thất bại.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page) return;

    try {
      setIsActionLoading(true);
      
      // Validate category
      if (!formData.category_id) {
        alert('Vui lòng chọn danh mục sự kiện');
        setIsActionLoading(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        category_id: Number(formData.category_id),
        location: formData.location,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        registration_deadline: formData.registration_deadline 
          ? new Date(formData.registration_deadline).toISOString() 
          : new Date(formData.start_time).toISOString(),
        max_slots: Number(formData.max_participants),
        training_points: Number(formData.training_points),
        banner_url: formData.image_url,
        page_id: page.id,
      };

      if (editingEventId) {
        const res = await eventsApi.update(editingEventId, payload);
        setEvents(prev => prev.map(e => e.id === editingEventId ? res.data.data : e));
        alert('Cập nhật sự kiện thành công!');
      } else {
        const res = await eventsApi.create(payload);
        setEvents([res.data.data, ...events]);
        alert('Gửi yêu cầu phê duyệt sự kiện thành công!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save event', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Lưu sự kiện thất bại.';
      alert(errorMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: any = {
      PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-100',
      APPROVED: 'bg-green-50 text-green-700 border-green-100',
      REJECTED: 'bg-red-50 text-red-700 border-red-100',
      ONGOING: 'bg-blue-50 text-blue-700 border-blue-100',
      CLOSED: 'bg-gray-50 text-gray-700 border-gray-100',
    };
    const labels: any = {
      PENDING: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      ONGOING: 'Đang diễn ra',
      CLOSED: 'Đã kết thúc',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${styles[status] || styles.PENDING}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Sự kiện</h1>
          <p className="text-gray-500 text-sm">Tổ chức và theo dõi các hoạt động ngoại khóa của {page?.name}.</p>
        </div>
        <Button onClick={handleOpenCreateModal} className="flex items-center space-x-2 rounded-2xl px-6">
          <Plus className="h-5 w-5" />
          <span>Tạo sự kiện mới</span>
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sự kiện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <motion.div
              layout
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:border-blue-100 transition-all group"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-48 h-32 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Calendar className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    {getStatusBadge(event.status)}
                    <div className="flex items-center text-blue-600 font-bold text-xs bg-blue-50 px-2 py-1 rounded-lg">
                      <Award className="h-3 w-3 mr-1" />
                      +{event.training_points} điểm
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 truncate">{event.title}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3.5 w-3.5 mr-2 text-gray-400" />
                      <span>{format(new Date(event.start_time), 'HH:mm, dd/MM/yyyy', { locale: vi })}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <MapPin className="h-3.5 w-3.5 mr-2 text-gray-400" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Users className="h-3.5 w-3.5 mr-2 text-gray-400" />
                      <span>{event._count?.registrations || 0} / {event.max_participants} chỗ</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Timer className="h-3.5 w-3.5 mr-2 text-gray-400" />
                      <span>{event.category?.name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col justify-end gap-2">
                  {event.status === 'APPROVED' && (
                    <Button 
                      onClick={() => handleStartCheckin(event.id)}
                      disabled={isActionLoading === event.id}
                      className="rounded-xl p-2 h-10 w-10 bg-blue-600 hover:bg-blue-700"
                      title="Bắt đầu điểm danh"
                    >
                      {isActionLoading === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Timer className="h-4 w-4" />}
                    </Button>
                  )}

                  {event.status === 'ONGOING' && (
                    <>
                      <Link 
                        to={`/page-admin/events/${event.id}/qr-display`}
                        className="flex items-center justify-center rounded-xl p-2 h-10 w-10 bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-sm"
                        title="Trình chiếu QR"
                      >
                        <Maximize className="h-4 w-4" />
                      </Link>
                      <Button 
                        onClick={() => handleEndCheckin(event.id)}
                        disabled={isActionLoading === event.id}
                        className="rounded-xl p-2 h-10 w-10 bg-red-600 hover:bg-red-700"
                        title="Kết thúc điểm danh"
                      >
                        {isActionLoading === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      </Button>
                    </>
                  )}

                  <Link 
                    to={`/page-admin/events/${event.id}/registrations`}
                    className="flex items-center justify-center rounded-xl p-2 h-10 w-10 border border-gray-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all"
                    title="Danh sách đăng ký"
                  >
                    <Users className="h-4 w-4" />
                  </Link>
                  <Button 
                    variant="outline" 
                    className="rounded-xl p-2 h-10 w-10"
                    onClick={() => handleOpenEditModal(event)}
                    disabled={isActionLoading === event.id}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="rounded-xl p-2 h-10 w-10 text-red-500 hover:bg-red-50 hover:border-red-200"
                    onClick={() => handleDeleteEvent(event.id)}
                    disabled={isActionLoading === event.id}
                  >
                    {isActionLoading === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <p className="text-gray-400">Không tìm thấy sự kiện nào.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-2xl overflow-hidden my-8"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  {editingEventId ? 'Chỉnh sửa sự kiện' : 'Tạo yêu cầu sự kiện mới'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Thông tin cơ bản
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Tên sự kiện</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        placeholder="Ví dụ: Giải bóng đá sinh viên UTEHY 2024"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Mô tả chi tiết</label>
                      <textarea
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                        placeholder="Mô tả mục đích, nội dung và quyền lợi tham gia..."
                      />
                    </div>
                  </div>
                </div>

                {/* Time & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Thời gian & Phân loại
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">Danh mục</label>
                        <select
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 ml-1">Bắt đầu</label>
                          <input
                            type="datetime-local"
                            required
                            value={formData.start_time}
                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                            className="w-full px-3 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 ml-1">Kết thúc</label>
                          <input
                            type="datetime-local"
                            required
                            value={formData.end_time}
                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                            className="w-full px-3 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">Hạn đăng ký</label>
                        <input
                          type="datetime-local"
                          required
                          value={formData.registration_deadline}
                          onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[10px] text-gray-400 ml-1 italic">* Thường trước khi sự kiện bắt đầu</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center">
                      <MapIcon className="h-4 w-4 mr-2" />
                      Địa điểm & GPS
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700 ml-1">Địa điểm tổ chức</label>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition((pos) => {
                                setFormData({
                                  ...formData,
                                  latitude: pos.coords.latitude.toString(),
                                  longitude: pos.coords.longitude.toString()
                                });
                              });
                            }
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          <MapIcon className="h-3 w-3 mr-1" />
                          Lấy vị trí hiện tại
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ví dụ: Hội trường A1, Cơ sở Khoái Châu"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 ml-1">Vĩ độ (Lat)</label>
                          <input
                            type="number"
                            step="any"
                            value={formData.latitude}
                            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="20.1234"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 ml-1">Kinh độ (Lng)</label>
                          <input
                            type="number"
                            step="any"
                            value={formData.longitude}
                            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="105.5678"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Slots & Points */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Số lượng & Quyền lợi
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Số lượng tham gia tối đa</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.max_participants}
                        onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Điểm rèn luyện tích lũy</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.training_points}
                        onChange={(e) => setFormData({ ...formData, training_points: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Ảnh bìa sự kiện (URL hoặc Tải lên)</label>
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://..."
                        />
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-2xl transition-colors flex items-center justify-center">
                          <Upload className="h-5 w-5 text-gray-600" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFormData({ ...formData, image_url: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                                alert('Đã chọn ảnh. Lưu ý: Trong bản demo này, ảnh được lưu dưới dạng Base64.');
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs text-gray-400 italic flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Sự kiện sẽ được gửi đến Admin hệ thống để phê duyệt trước khi hiển thị.
                  </div>
                  <div className="flex space-x-3">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="px-6 rounded-2xl border-gray-200">
                      Hủy
                    </Button>
                    <Button type="submit" disabled={!!isActionLoading} className="px-8 rounded-2xl shadow-lg shadow-blue-100 flex items-center space-x-2">
                      {isActionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      <span>{editingEventId ? 'Cập nhật sự kiện' : 'Gửi yêu cầu phê duyệt'}</span>
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Missing icons for the list buttons
const Edit2 = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const Trash2 = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const Maximize = ({ className }: { className?: string }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>;
