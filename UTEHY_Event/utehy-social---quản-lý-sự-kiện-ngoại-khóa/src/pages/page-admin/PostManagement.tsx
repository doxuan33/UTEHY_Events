import { useState, useEffect } from 'react';
import { postsApi } from '@/api/posts.api';
import { pagesApi } from '@/api/pages.api';
import { Button } from '@/components/common/Button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Image as ImageIcon, 
  MessageSquare, 
  Heart,
  Loader2,
  AlertCircle,
  X,
  Send,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const PostManagement = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [formData, setFormData] = useState({
    content: '',
    image_urls: [] as string[],
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
        // 2. Get posts for this page
        const postsRes = await postsApi.getNewsfeed({ page_id: managedPage.id, limit: 50 });
        setPosts(postsRes.data.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPost(null);
    setFormData({ content: '', image_urls: [] });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (post: any) => {
    setEditingPost(post);
    setFormData({
      content: post.content,
      image_urls: post.image_urls || [],
    });
    setIsModalOpen(true);
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    
    try {
      setIsActionLoading(true);
      await postsApi.delete(id);
      setPosts(posts.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete post', err);
      alert('Xóa bài viết thất bại.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!page) return;

    try {
      setIsActionLoading(true);
      if (editingPost) {
        const res = await postsApi.update(editingPost.id, formData);
        setPosts(posts.map(p => p.id === editingPost.id ? { ...p, ...res.data.data } : p));
      } else {
        const res = await postsApi.create({
          page_id: page.id,
          content: formData.content,
          image_urls: formData.image_urls,
        });
        setPosts([res.data.data, ...posts]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save post', err);
      alert('Lưu bài viết thất bại.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Không tìm thấy Fanpage</h3>
        <p className="text-gray-500">Bạn chưa quản lý Fanpage nào để quản lý bài viết.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Bài viết</h1>
          <p className="text-gray-500 text-sm">Tạo và quản lý các bài đăng trên bảng tin của {page.name}.</p>
        </div>
        <Button onClick={handleOpenCreateModal} className="flex items-center space-x-2 rounded-2xl px-6">
          <Plus className="h-5 w-5" />
          <span>Tạo bài viết mới</span>
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Posts List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <motion.div
              layout
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-blue-100 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(post.created_at), 'HH:mm, dd MMMM yyyy', { locale: vi })}</span>
                  </div>
                  <p className="text-gray-800 text-sm line-clamp-3 mb-4 whitespace-pre-wrap">{post.content}</p>
                  
                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      {post.image_urls.map((url: string, idx: number) => (
                        <img 
                          key={idx} 
                          src={url} 
                          alt="Post" 
                          className="h-20 w-20 object-cover rounded-xl border border-gray-100"
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-6 text-xs font-bold">
                    <div className="flex items-center text-red-500 bg-red-50 px-3 py-1.5 rounded-full">
                      <Heart className="h-4 w-4 mr-1.5 fill-current" />
                      <span>{post._count?.likes || 0}</span>
                    </div>
                    <div className="flex items-center text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full">
                      <MessageSquare className="h-4 w-4 mr-1.5" />
                      <span>{post._count?.comments || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button 
                    onClick={() => handleOpenEditModal(post)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
            <p className="text-gray-400">Không tìm thấy bài viết nào.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPost ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Nội dung bài viết</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                    placeholder="Bạn đang nghĩ gì? Chia sẻ thông tin mới nhất đến sinh viên..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Hình ảnh (URLs)</label>
                  <div className="space-y-3">
                    {formData.image_urls.map((url, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...formData.image_urls];
                              newUrls[idx] = e.target.value;
                              setFormData({ ...formData, image_urls: newUrls });
                            }}
                            className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/image.jpg"
                          />
                          {url && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg overflow-hidden border border-gray-200">
                              <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const newUrls = formData.image_urls.filter((_, i) => i !== idx);
                            setFormData({ ...formData, image_urls: newUrls });
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_urls: [...formData.image_urls, ''] })}
                      className="text-sm text-blue-600 font-bold flex items-center space-x-1 hover:underline"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Thêm hình ảnh</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl border-gray-200"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isActionLoading}
                    className="flex-2 py-4 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center space-x-2"
                  >
                    {isActionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    <span>{editingPost ? 'Cập nhật bài viết' : 'Đăng bài viết'}</span>
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
