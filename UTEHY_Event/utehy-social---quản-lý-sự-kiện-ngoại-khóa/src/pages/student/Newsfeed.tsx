import { useEffect, useState, useCallback } from 'react';
import { postsApi } from '@/api/posts.api';
import { eventsApi } from '@/api/events.api';
import { Avatar } from '@/components/common/Avatar';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Loader2, Sparkles, Filter } from 'lucide-react';
import { PostCard } from '@/components/student/PostCard';
import { FeedEventCard } from '@/components/student/FeedEventCard';
import { SuggestedEvents } from '@/components/student/SuggestedEvents';
import { useAuthStore } from '@/store/auth.store';

export const Newsfeed = () => {
  const { user } = useAuthStore();
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [postCursor, setPostCursor] = useState<string | null>(null);
  const [eventPage, setEventPage] = useState(1);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'posts' | 'events'>('all');

  const fetchFeed = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) setIsFetchingMore(true);
      else {
        setIsLoading(true);
        setError(null);
      }

      // Fetch posts from followed pages
      const postsRes = await postsApi.getNewsfeed({ 
        cursor: isLoadMore ? postCursor || undefined : undefined, 
        limit: 10 
      });
      const postsData = postsRes.data.data;
      const newPosts = (postsData.data || []).map((p: any) => ({ ...p, feedType: 'post' }));

      // Fetch all approved events (even from non-followed pages)
      let newEvents: any[] = [];
      if (hasMoreEvents) {
        const eventsRes = await eventsApi.getAll({ 
          page: isLoadMore ? eventPage + 1 : 1, 
          limit: 10,
          status: 'APPROVED'
        });
        const eventsData = eventsRes.data.data;
        newEvents = (eventsData.data || []).map((e: any) => ({ ...e, feedType: 'event' }));
        
        if (newEvents.length < 10) setHasMoreEvents(false);
        if (isLoadMore) setEventPage(prev => prev + 1);
      }

      // Merge and sort by created_at
      const combined = [...newPosts, ...newEvents].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setFeedItems(prev => isLoadMore ? [...prev, ...combined] : combined);
      setPostCursor(postsData.next_cursor);
    } catch (err: any) {
      console.error('Failed to fetch feed', err);
      if (err.response?.status === 429) {
        setError('Hệ thống đang bận. Vui lòng thử lại sau ít phút.');
      } else {
        setError('Không thể tải bảng tin. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  }, [postCursor, eventPage, hasMoreEvents]);

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleLoadMore = () => {
    if ((postCursor || hasMoreEvents) && !isFetchingMore) {
      fetchFeed(true);
    }
  };

  const filteredItems = feedItems.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'posts') return item.feedType === 'post';
    if (activeFilter === 'events') return item.feedType === 'event';
    return true;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse h-64" />
          ))}
        </div>
        <div className="hidden lg:block space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm animate-pulse h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto pb-20 md:pb-0">
      {/* Main Feed */}
      <div className="lg:col-span-2 space-y-6">
        {/* Create Post Placeholder */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4">
          <Avatar src={user?.avatar_url} name={user?.full_name} size="md" />
          <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-500 text-left px-4 py-2.5 rounded-full transition-colors text-sm font-medium">
            Bạn đang nghĩ gì, {user?.full_name?.split(' ').pop()}?
          </button>
          <button className="p-2.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Feed Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeFilter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
          >
            Tất cả
          </button>
          <button 
            onClick={() => setActiveFilter('posts')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeFilter === 'posts' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
          >
            Bài viết
          </button>
          <button 
            onClick={() => setActiveFilter('events')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeFilter === 'events' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'}`}
          >
            Sự kiện mới
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={() => fetchFeed()}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Sparkles className="h-12 w-12 text-blue-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Bảng tin trống</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              Hãy theo dõi các Câu lạc bộ để cập nhật những tin tức và sự kiện mới nhất!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <div key={`${item.feedType}-${item.id}`}>
                  {item.feedType === 'post' ? (
                    <PostCard post={item} />
                  ) : (
                    <FeedEventCard event={item} />
                  )}
                </div>
              ))}
            </AnimatePresence>

            {/* Load More */}
            {(postCursor || hasMoreEvents) && (
              <div className="flex justify-center py-4">
                <button 
                  onClick={handleLoadMore}
                  disabled={isFetchingMore}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                >
                  {isFetchingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang tải...</span>
                    </>
                  ) : (
                    <span>Xem thêm bài viết</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar - User Activity & Suggested Events */}
      <div className="hidden lg:block space-y-6 sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide">
        {/* User Activity Stats */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
          <h3 className="font-bold text-lg mb-4">Hoạt động của bạn</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
              <div className="text-2xl font-black">{user?.training_points || 0}</div>
              <div className="text-[10px] uppercase font-bold opacity-80 tracking-wider">Điểm RL</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
              <div className="text-2xl font-black">12</div>
              <div className="text-[10px] uppercase font-bold opacity-80 tracking-wider">Sự kiện</div>
            </div>
          </div>
          <button className="w-full mt-4 py-2.5 bg-white text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors">
            Xem hồ sơ chi tiết
          </button>
        </div>

        <SuggestedEvents />
      </div>
    </div>
  );
};
