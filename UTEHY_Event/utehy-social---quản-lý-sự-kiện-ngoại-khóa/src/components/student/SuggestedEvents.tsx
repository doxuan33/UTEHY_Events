import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '@/api/events.api';
import { Badge } from '@/components/common/Badge';
import { Calendar, ChevronRight, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const SuggestedEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        // Fetch top 3 upcoming events
        const res = await eventsApi.getAll({ limit: 3, status: 'APPROVED' });
        const data = res.data.data;
        setEvents(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        console.error('Failed to fetch suggested events', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuggested();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        {[1, 2].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Sự kiện gợi ý</h2>
        <Link to="/events" className="text-sm font-medium text-blue-600 hover:underline">Xem tất cả</Link>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <Link 
            key={event.id} 
            to={`/events/${event.id}`}
            className="block group p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
          >
            <div className="flex items-start space-x-3">
              <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0">
                <img 
                  src={event.banner_url || `https://picsum.photos/seed/${event.id}/200/200`} 
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                  alt={event.title}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {event.title}
                </h3>
                <div className="flex items-center text-[11px] text-gray-500 mt-1">
                  <Calendar className="h-3 w-3 mr-1 text-blue-500" />
                  {format(new Date(event.start_time), 'dd/MM/yyyy', { locale: vi })}
                </div>
                <div className="flex items-center text-[11px] text-gray-500 mt-0.5">
                  <MapPin className="h-3 w-3 mr-1 text-red-500" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link 
        to="/events" 
        className="mt-6 flex items-center justify-center w-full py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors group"
      >
        Khám phá thêm
        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
};
