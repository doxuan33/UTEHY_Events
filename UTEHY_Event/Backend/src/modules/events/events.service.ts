import prisma from '../../config/database';
import { CreateEventInput, UpdateEventInput, GetEventsQuery } from './events.schema';
import { notificationsService } from '../notifications/notifications.service';

export const eventsService = {

  // ── TẠO SỰ KIỆN (PAGE_ADMIN) ─────────────────────────────
  async createEvent(pageId: string, input: CreateEventInput) {
    // Kiểm tra page có tồn tại không
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) {
      throw { statusCode: 404, message: 'Không tìm thấy trang CLB' };
    }

    const event = await prisma.event.create({
      data: {
        page_id: pageId,
        category_id: input.category_id,
        title: input.title,
        description: input.description,
        banner_url: input.banner_url,
        location: input.location,
        latitude: input.latitude,
        longitude: input.longitude,
        checkin_radius_m: input.checkin_radius_m,
        start_time: new Date(input.start_time),
        end_time: new Date(input.end_time),
        registration_deadline: new Date(input.registration_deadline),
        max_slots: input.max_slots,
        training_points: input.training_points,
        requires_approval: input.requires_approval,
        status: 'PENDING',
      },
      include: {
        page: { select: { id: true, name: true, avatar_url: true } },
        category: true,
      },
    });

    return event;
  },

  // ── LẤY DANH SÁCH SỰ KIỆN ────────────────────────────────
  async getEvents(query: GetEventsQuery, role?: string) {
    const { page, limit, status, category_id, search, page_id } = query;
    const skip = (page - 1) * limit;

    // Sinh viên chỉ thấy sự kiện APPROVED
    // Admin thấy tất cả, Page Admin thấy của page mình
    const statusFilter = role === 'SYSTEM_ADMIN'
      ? status
      : role === 'PAGE_ADMIN'
        ? status
        : 'APPROVED';

    const where: any = {
      ...(statusFilter && { status: statusFilter }),
      ...(category_id && { category_id }),
      ...(page_id && { page_id }),
      ...(search && {
        title: { contains: search },
      }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { start_time: 'asc' },
        include: {
          page: { select: { id: true, name: true, avatar_url: true } },
          category: true,
          _count: { select: { registrations: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      data: events,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  },

  // ── LẤY CHI TIẾT 1 SỰ KIỆN ───────────────────────────────
  async getEventById(eventId: string, userId?: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        page: { select: { id: true, name: true, avatar_url: true, slug: true } },
        category: true,
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện' };
    }

    // Kiểm tra user hiện tại đã đăng ký chưa
    let isRegistered = false;
    if (userId) {
      const registration = await prisma.registration.findUnique({
        where: { user_id_event_id: { user_id: userId, event_id: eventId } },
      });
      isRegistered = !!registration;
    }

    return { ...event, is_registered: isRegistered };
  },

  // ── CẬP NHẬT SỰ KIỆN (PAGE_ADMIN) ────────────────────────
  async updateEvent(eventId: string, pageId: string, input: UpdateEventInput) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện' };
    }
    if (event.page_id !== pageId) {
      throw { statusCode: 403, message: 'Bạn không có quyền chỉnh sửa sự kiện này' };
    }
    if (event.status === 'APPROVED') {
      throw { statusCode: 400, message: 'Không thể chỉnh sửa sự kiện đã được duyệt' };
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...input,
        ...(input.start_time && { start_time: new Date(input.start_time) }),
        ...(input.end_time && { end_time: new Date(input.end_time) }),
        ...(input.registration_deadline && {
          registration_deadline: new Date(input.registration_deadline),
        }),
        status: 'PENDING', // Reset về pending để admin duyệt lại
      },
      include: {
        page: { select: { id: true, name: true } },
        category: true,
      },
    });

    return updated;
  },

  // ── DUYỆT SỰ KIỆN (SYSTEM_ADMIN) ─────────────────────────
  async approveEvent(eventId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện' };
    }
    if (event.status !== 'PENDING') {
      throw { statusCode: 400, message: 'Chỉ có thể duyệt sự kiện đang ở trạng thái chờ duyệt' };
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { status: 'APPROVED' },
    });
    await notificationsService.notifyEventApproved(eventId);
    await notificationsService.notifyNewEvent(eventId);
    return updated;
  },

  // ── TỪ CHỐI SỰ KIỆN (SYSTEM_ADMIN) ──────────────────────
  async rejectEvent(eventId: string, reason: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện' };
    }
    if (event.status !== 'PENDING') {
      throw { statusCode: 400, message: 'Chỉ có thể từ chối sự kiện đang ở trạng thái chờ duyệt' };
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { status: 'REJECTED', rejection_reason: reason },
    });

    return updated;
  },

  // ── XÓA SỰ KIỆN (PAGE_ADMIN) ─────────────────────────────
  async deleteEvent(eventId: string, pageId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện' };
    }
    if (event.page_id !== pageId) {
      throw { statusCode: 403, message: 'Bạn không có quyền xóa sự kiện này' };
    }
    if (event.status === 'APPROVED' || event.status === 'ONGOING') {
      throw { statusCode: 400, message: 'Không thể xóa sự kiện đã duyệt hoặc đang diễn ra' };
    }

    await prisma.event.delete({ where: { id: eventId } });
  },

  // ── LẤY DANH SÁCH DANH MỤC ───────────────────────────────
  async getCategories() {
    return prisma.eventCategory.findMany({ orderBy: { id: 'asc' } });
  },

  // ── LẤY DANH SÁCH SỰ KIỆN CHỜ DUYỆT (SYSTEM_ADMIN) ─────
  async getPendingEvents() {
    return prisma.event.findMany({
      where: { status: 'PENDING' },
      orderBy: { created_at: 'asc' },
      include: {
        page: { select: { id: true, name: true, avatar_url: true } },
        category: true,
        _count: { select: { registrations: true } },
      },
    });
  },
};