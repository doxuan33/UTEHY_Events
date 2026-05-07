import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi } from '@/api/events.api';
import { registrationsApi } from '@/api/registrations.api';
import { checkinApi } from '@/api/checkin.api';
import { Button } from '@/components/common/Button';
import { 
  Users, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Filter,
  UserCheck,
  UserX,
  X,
  Edit2,
  Trash2,
  Clock,
  Map as MapIcon,
  FileText,
  Send,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const EventRegistrations = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ATTENDED' | 'ABSENT'>('ALL');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;
  
  // Manual Check-in Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualStudentId, setManualStudentId] = useState('');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  // Edit Event states
  const [categories, setCategories] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
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
    const timer = setTimeout(() => {
      if (eventId) {
        fetchData();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [eventId, currentPage, statusFilter, searchQuery]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [eventRes, catRes] = await Promise.all([
        eventsApi.getById(eventId!),
        eventsApi.getCategories()
      ]);
      
      const eventData = eventRes.data.data;
      setEvent(eventData);
      setCategories(catRes.data.data);
      
      const regRes = await registrationsApi.getEventRegistrations(eventId!, eventData.page_id, {
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter === 'ALL' ? undefined : statusFilter as any,
        search: searchQuery || undefined
      });
      
      const result = regRes.data.data;
      setRegistrations(result?.data || []);
      setTotalPages(result?.meta?.total_pages || 1);
      setTotalItems(result?.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch registration data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (regId: string, status: 'APPROVED' | 'REJECTED' | 'ABSENT') => {
    try {
      setIsActionLoading(regId);
      await registrationsApi.updateStatus(regId, event.page_id, status);
      setRegistrations(prev => prev.map(reg => 
        reg.id === regId ? { ...reg, status } : reg
      ));
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Cập nhật trạng thái thất bại.');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId.trim()) return;

    try {
      setIsManualSubmitting(true);
      const res = await checkinApi.manualCheckin({
        event_id: eventId!,
        student_id: manualStudentId.trim()
      });
      
      alert(res.data.message || 'Điểm danh thành công!');
      setIsManualModalOpen(false);
      setManualStudentId('');
      fetchData(); // Refresh list
    } catch (err: any) {
      console.error('Manual checkin failed', err);
      alert(err.response?.data?.message || 'Điểm danh thất bại. Vui lòng kiểm tra lại MSSV hoặc trạng thái đăng ký.');
    } finally {
      setIsManualSubmitting(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!event) return;
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
    setIsEditModalOpen(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    try {
      setIsSavingEvent(true);
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
        page_id: event.page_id,
      };

      const res = await eventsApi.update(event.id, payload);
      setEvent(res.data.data);
      setIsEditModalOpen(false);
      alert('Cập nhật sự kiện thành công!');
    } catch (err: any) {
      console.error('Failed to update event', err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Cập nhật sự kiện thất bại.';
      alert(errorMsg);
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event || !confirm('Bạn có chắc chắn muốn xóa sự kiện này? Thao tác này không thể hoàn tác.')) return;

    try {
      setIsActionLoading('deleting-event');
      await eventsApi.delete(event.id, event.page_id);
      alert('Đã xóa sự kiện thành công.');
      navigate('/page-admin/events');
    } catch (err: any) {
      console.error('Failed to delete event', err);
      alert(err.response?.data?.message || 'Xóa sự kiện thất bại.');
    } finally {
      setIsActionLoading(null);
    }
  };

  const exportToExcel = () => {
    if (!Array.isArray(registrations) || registrations.length === 0) {
      alert('Không có dữ liệu để xuất file.');
      return;
    }

    const data = registrations.map((reg, index) => ({
      'STT': index + 1,
      'Họ và tên': reg.user?.full_name,
      'Mã sinh viên': reg.user?.student_id || 'N/A',
      'Email': reg.user?.email,
      'Số điện thoại': reg.user?.phone || 'N/A',
      'Lớp': reg.user?.class_name || 'N/A',
      'Khoa': reg.user?.department || 'N/A',
      'Ngày đăng ký': format(new Date(reg.created_at), 'dd/MM/yyyy HH:mm'),
      'Trạng thái': getStatusText(reg.status),
      'Thời gian điểm danh': reg.attended_at ? format(new Date(reg.attended_at), 'dd/MM/yyyy HH:mm') : 'Chưa điểm danh'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    const wscols = [
      { wch: 5 },  // STT
      { wch: 25 }, // Họ và tên
      { wch: 15 }, // MSSV
      { wch: 30 }, // Email
      { wch: 15 }, // SĐT
      { wch: 15 }, // Lớp
      { wch: 25 }, // Khoa
      { wch: 20 }, // Ngày đăng ký
      { wch: 15 }, // Trạng thái
      { wch: 20 }, // Thời gian điểm danh
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách đăng ký');
    
    const fileName = `Danh_sach_dang_ky_${event?.title.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMyy')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      case 'ATTENDED': return 'Đã điểm danh';
      case 'ABSENT': return 'Vắng mặt';
      default: return status;
    }
  };

  const filteredRegistrations = Array.isArray(registrations) ? registrations.filter(reg => {
    const matchesSearch = reg.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reg.user?.student_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Không tìm thấy sự kiện</h2>
        <Button onClick={() => navigate('/page-admin/events')} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/page-admin/events')}
            className="p-2 hover:bg-white rounded-xl transition-colors text-gray-500"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900">Danh sách Đăng ký</h1>
              {event.requires_approval && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-100">
                  Có chọn lọc
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm truncate max-w-md">Sự kiện: {event.title}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleOpenEditModal}
            variant="outline"
            className="flex items-center space-x-2 rounded-2xl px-4 border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <Edit2 className="h-4 w-4" />
            <span className="hidden sm:inline">Sửa</span>
          </Button>
          <Button 
            onClick={handleDeleteEvent}
            variant="outline"
            className="flex items-center space-x-2 rounded-2xl px-4 border-red-100 text-red-600 hover:bg-red-50"
            disabled={isActionLoading === 'deleting-event'}
          >
            {isActionLoading === 'deleting-event' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span className="hidden sm:inline">Xóa</span>
          </Button>
          <div className="w-px h-8 bg-gray-100 mx-1" />
          <Button 
            onClick={() => setIsManualModalOpen(true)}
            variant="outline"
            className="flex items-center space-x-2 rounded-2xl px-6 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <UserCheck className="h-5 w-5" />
            <span>Điểm danh bù</span>
          </Button>
          <Button 
            onClick={exportToExcel}
            variant="outline"
            className="flex items-center space-x-2 rounded-2xl px-6 border-green-200 text-green-700 hover:bg-green-50"
            disabled={registrations.length === 0}
          >
            <Download className="h-5 w-5" />
            <span>Xuất Excel</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tổng đăng ký</p>
          <p className="text-2xl font-black text-gray-900">{Array.isArray(registrations) ? registrations.length : 0}</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-1">Chờ duyệt</p>
          <p className="text-2xl font-black text-yellow-600">
            {Array.isArray(registrations) ? registrations.filter(r => r.status === 'PENDING').length : 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Đã duyệt</p>
          <p className="text-2xl font-black text-green-600">
            {Array.isArray(registrations) ? registrations.filter(r => r.status === 'APPROVED').length : 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Điểm danh</p>
          <p className="text-2xl font-black text-blue-600">
            {Array.isArray(registrations) ? registrations.filter(r => r.status === 'ATTENDED').length : 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Từ chối</p>
          <p className="text-2xl font-black text-red-600">
            {Array.isArray(registrations) ? registrations.filter(r => r.status === 'REJECTED').length : 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm tên sinh viên, mã sinh viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400 ml-2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-gray-50 border border-transparent rounded-2xl px-4 py-3 text-sm font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="ATTENDED">Đã điểm danh</option>
            <option value="ABSENT">Vắng mặt</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Sinh viên</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Thông tin liên hệ</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Thời gian đăng ký</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {reg.user?.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{reg.user?.full_name}</p>
                        <p className="text-xs text-gray-400">{reg.user?.student_id || 'Chưa cập nhật MSSV'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <Mail className="h-3 w-3 mr-1.5 text-gray-400" />
                        {reg.user?.email}
                      </div>
                      {reg.user?.phone && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Phone className="h-3 w-3 mr-1.5 text-gray-400" />
                          {reg.user?.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                      {format(new Date(reg.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {reg.status === 'PENDING' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-50 text-yellow-600 border border-yellow-100">
                        Chờ duyệt
                      </span>
                    )}
                    {reg.status === 'APPROVED' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-100">
                        Đã duyệt
                      </span>
                    )}
                    {reg.status === 'ATTENDED' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                        Đã điểm danh
                      </span>
                    )}
                    {reg.status === 'REJECTED' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
                        Từ chối
                      </span>
                    )}
                    {reg.status === 'ABSENT' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-100">
                        Vắng mặt
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {reg.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(reg.id, 'APPROVED')}
                            disabled={!!isActionLoading}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"
                            title="Duyệt"
                          >
                            {isActionLoading === reg.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(reg.id, 'REJECTED')}
                            disabled={!!isActionLoading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Từ chối"
                          >
                            {isActionLoading === reg.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <XCircle className="h-5 w-5" />}
                          </button>
                        </>
                      )}
                      {reg.status === 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateStatus(reg.id, 'ABSENT')}
                          disabled={!!isActionLoading}
                          className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all"
                          title="Đánh dấu vắng mặt"
                        >
                          {isActionLoading === reg.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserX className="h-5 w-5" />}
                        </button>
                      )}
                      {(reg.status === 'ATTENDED' || reg.status === 'REJECTED' || reg.status === 'ABSENT') && (
                        <span className="text-xs text-gray-400 italic">Đã xử lý</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRegistrations.length === 0 && (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">Không có sinh viên nào trong danh sách này.</p>
          </div>
        )}
        
        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Hiển thị <span className="font-bold text-gray-900">{filteredRegistrations.length}</span> trên <span className="font-bold text-gray-900">{totalItems}</span> đăng ký
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="rounded-xl px-3"
              >
                Trước
              </Button>
              <div className="flex items-center space-x-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                        : 'text-gray-500 hover:bg-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="rounded-xl px-3"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Check-in Modal */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsManualModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <UserCheck className="h-5 w-5 mr-2 text-blue-600" />
                  Điểm danh thủ công
                </h2>
                <button onClick={() => setIsManualModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleManualCheckin} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Mã sinh viên (MSSV)</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={manualStudentId}
                    onChange={(e) => setManualStudentId(e.target.value)}
                    placeholder="Ví dụ: 10121001"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-center"
                  />
                  <p className="text-xs text-gray-400 text-center italic">
                    Nhập chính xác 8 chữ số MSSV của sinh viên để điểm danh bù.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsManualModalOpen(false)} 
                    className="flex-1 rounded-2xl py-4"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isManualSubmitting || !manualStudentId} 
                    className="flex-1 rounded-2xl py-4 shadow-lg shadow-blue-100"
                  >
                    {isManualSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Xác nhận'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
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
                  Chỉnh sửa sự kiện
                </h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleUpdateEvent} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
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
                      <label className="text-xs font-bold text-gray-700 ml-1">Số lượng tối đa</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={formData.max_participants}
                        onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Điểm rèn luyện</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.training_points}
                        onChange={(e) => setFormData({ ...formData, training_points: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 ml-1">Ảnh bìa (URL hoặc Tải lên)</label>
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

                <div className="pt-6 border-t border-gray-100 flex items-center justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="px-6 rounded-2xl">
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSavingEvent} className="px-8 rounded-2xl shadow-lg shadow-blue-100 flex items-center space-x-2">
                    {isSavingEvent ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    <span>Cập nhật sự kiện</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventRegistrations;
