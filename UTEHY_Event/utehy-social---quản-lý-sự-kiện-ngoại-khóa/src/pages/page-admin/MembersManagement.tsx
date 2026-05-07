import { useState, useEffect } from 'react';
import { pagesApi } from '@/api/pages.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Shield, 
  Trash2, 
  Loader2,
  AlertCircle,
  X,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export const MembersManagement = () => {
  const [page, setPage] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const pagesRes = await pagesApi.getAll();
      const managedPage = pagesRes.data.data?.[0];
      if (managedPage) {
        setPage(managedPage);
        // Assuming the page object includes members or there's an endpoint
        // For demo, we'll use the members from the page object if available
        setMembers(managedPage.members || [
          { id: '1', user: { full_name: 'Nguyễn Văn A', email: 'vana@student.utehy.edu.vn', student_id: '10121001' }, is_owner: true },
          { id: '2', user: { full_name: 'Trần Thị B', email: 'thib@student.utehy.edu.vn', student_id: '10121002' }, is_owner: false },
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch members', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim() || !page) return;

    try {
      setIsSubmitting(true);
      // In a real app, we'd find the user by email first or the API handles it
      await pagesApi.addMember(page.id, { user_id: 'new-user-id', is_owner: false });
      alert('Đã thêm thành viên ban quản trị mới!');
      setIsAddModalOpen(false);
      setNewMemberEmail('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể thêm thành viên.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!page || !confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi Ban quản trị?')) return;

    try {
      await pagesApi.removeMember(page.id, userId);
      setMembers(prev => prev.filter(m => m.user.id !== userId));
      alert('Đã xóa thành viên.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xóa thất bại.');
    }
  };

  const filteredMembers = members.filter(m => 
    m.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user.email.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Ban quản trị</h1>
          <p className="text-gray-500">Quản lý các thành viên có quyền đăng bài và quản lý sự kiện cho {page?.name}.</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-2xl px-6 flex items-center space-x-2 shadow-lg shadow-blue-100"
        >
          <UserPlus className="h-5 w-5" />
          <span>Thêm thành viên</span>
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Thành viên</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Liên hệ</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {member.user.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{member.user.full_name}</p>
                        <p className="text-xs text-gray-400">MSSV: {member.user.student_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {member.is_owner ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                        <Shield className="h-3 w-3 mr-1" />
                        Trưởng nhóm
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-100">
                        Quản trị viên
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                      {member.user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!member.is_owner && (
                      <button
                        onClick={() => handleRemoveMember(member.user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Xóa quyền quản trị"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredMembers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy thành viên nào.</p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
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
                  <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
                  Thêm quản trị viên
                </h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Email sinh viên</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="example@student.utehy.edu.vn"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-400 ml-1 italic">
                    Sinh viên phải có tài khoản trên hệ thống để được cấp quyền.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddModalOpen(false)} 
                    className="flex-1 rounded-2xl py-4"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !newMemberEmail} 
                    className="flex-1 rounded-2xl py-4 shadow-lg shadow-blue-100"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Thêm ngay'}
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
