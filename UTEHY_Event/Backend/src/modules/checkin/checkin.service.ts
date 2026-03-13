import prisma from '../../config/database';
import { qrService } from './qr.service';
import { haversineDistance } from '../../shared/utils/geoHelper';
import { usersService } from '../users/users.service';
import { ScanQrInput, ManualCheckinInput } from './checkin.schema';
import { notificationsService } from '../notifications/notifications.service';

export const checkinService = {

  // ── QUÉT MÃ QR (STUDENT) ─────────────────────────────────
  async scanQr(userId: string, input: ScanQrInput) {
    // 1. Xác thực token
    const qrToken = await qrService.verifyToken(input.token);
    const event = qrToken.event;

    // 2. Kiểm tra sự kiện đang ở trạng thái ONGOING
    if (event.status !== 'ONGOING') {
      throw { statusCode: 400, message: 'Sự kiện chưa bắt đầu hoặc đã kết thúc điểm danh' };
    }

    // 3. Xác thực GPS (nếu sự kiện có tọa độ và sinh viên gửi lên)
    if (
      event.latitude !== null &&
      event.longitude !== null &&
      input.latitude !== undefined &&
      input.longitude !== undefined
    ) {
      const distance = haversineDistance(
        input.latitude,
        input.longitude,
        Number(event.latitude),
        Number(event.longitude)
      );

      if (distance > event.checkin_radius_m) {
        throw {
          statusCode: 400,
          message: `Bạn đang ở cách sự kiện ${Math.round(distance)}m. Vui lòng đến gần hơn (trong vòng ${event.checkin_radius_m}m)`,
        };
      }
    }

    // 4. Kiểm tra sinh viên có đăng ký không
    const registration = await prisma.registration.findUnique({
      where: { user_id_event_id: { user_id: userId, event_id: event.id } },
    });

    if (!registration) {
      throw { statusCode: 403, message: 'Bạn chưa đăng ký tham gia sự kiện này' };
    }

    if (registration.status === 'ATTENDED') {
      throw { statusCode: 409, message: 'Bạn đã điểm danh sự kiện này rồi' };
    }

    if (registration.status === 'CANCELLED') {
      throw { statusCode: 403, message: 'Đăng ký của bạn đã bị hủy' };
    }

    // 5. Ghi nhận điểm danh + cộng điểm rèn luyện (transaction)
    const result = await prisma.$transaction(async (tx) => {
      // Tạo checkin
      const checkin = await tx.checkin.create({
        data: {
          registration_id: registration.id,
          user_id: userId,
          qr_token_id: qrToken.id,
          method: 'QR_SCAN',
          checkin_lat: input.latitude,
          checkin_lng: input.longitude,
          points_awarded: event.training_points,
        },
      });

      // Cập nhật trạng thái đăng ký → ATTENDED
      await tx.registration.update({
        where: { id: registration.id },
        data: { status: 'ATTENDED' },
      });

      // Cộng điểm rèn luyện vào profile
      await tx.profile.update({
        where: { user_id: userId },
        data: { training_points: { increment: event.training_points } },
      });
      return checkin;
    });

    // 6. Kiểm tra và trao huy hiệu (chạy ngoài transaction)
    await usersService.checkAndAwardBadges(userId);

    // 7. Gửi thông báo (ngoài transaction)
    await notificationsService.notifyCheckinSuccess(
        userId,
        event.title,
        event.training_points
    );

    // 8. Lấy tổng điểm mới nhất
    const profile = await prisma.profile.findUnique({
        where: { user_id: userId },
        select: { training_points: true, full_name: true },
        });

        return {
        success: true,
        message: `Điểm danh thành công! +${event.training_points} điểm rèn luyện`,
        points_earned: event.training_points,
        total_points: profile?.training_points ?? 0,
        student_name: profile?.full_name,
        event_title: event.title,
        checked_in_at: result.checked_in_at,
    };
  },

  // ── ĐIỂM DANH THỦ CÔNG BẰNG MSSV (PAGE_ADMIN) ───────────
  async manualCheckin(adminUserId: string, input: ManualCheckinInput) {
    // Kiểm tra quyền: admin phải thuộc page tổ chức sự kiện này
    const event = await prisma.event.findUnique({
      where: { id: input.event_id },
    });

    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện' };
    }

    if (event.status !== 'ONGOING') {
      throw { statusCode: 400, message: 'Sự kiện chưa bắt đầu hoặc đã kết thúc điểm danh' };
    }

    const isMember = await prisma.pageMember.findUnique({
      where: {
        page_id_user_id: { page_id: event.page_id, user_id: adminUserId },
      },
    });
    if (!isMember) {
      throw { statusCode: 403, message: 'Bạn không có quyền điểm danh cho sự kiện này' };
    }

    // Tìm sinh viên qua MSSV
    const profile = await prisma.profile.findUnique({
      where: { student_id: input.student_id },
      include: { user: true },
    });

    if (!profile) {
      throw { statusCode: 404, message: `Không tìm thấy sinh viên có MSSV ${input.student_id}` };
    }

    // Kiểm tra đăng ký
    const registration = await prisma.registration.findUnique({
      where: {
        user_id_event_id: {
          user_id: profile.user.id,
          event_id: input.event_id,
        },
      },
    });

    if (!registration) {
      throw { statusCode: 403, message: 'Sinh viên này chưa đăng ký tham gia sự kiện' };
    }
    if (registration.status === 'ATTENDED') {
      throw { statusCode: 409, message: 'Sinh viên này đã được điểm danh rồi' };
    }

    // Ghi nhận điểm danh + cộng điểm
    await prisma.$transaction(async (tx) => {
      await tx.checkin.create({
        data: {
          registration_id: registration.id,
          user_id: profile.user.id,
          method: 'MANUAL',
          points_awarded: event.training_points,
        },
      });

      await tx.registration.update({
        where: { id: registration.id },
        data: { status: 'ATTENDED' },
      });

      await tx.profile.update({
        where: { user_id: profile.user.id },
        data: { training_points: { increment: event.training_points } },
      });
    });

    await usersService.checkAndAwardBadges(profile.user.id);

    return {
      success: true,
      message: `Điểm danh thủ công thành công cho ${profile.full_name}`,
      student_name: profile.full_name,
      student_id: profile.student_id,
      points_earned: event.training_points,
    };
  },

  // ── BẬT CHẾ ĐỘ ĐIỂM DANH (PAGE_ADMIN) ───────────────────
  async startCheckin(eventId: string, adminUserId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện' };
    }
    if (event.status !== 'APPROVED') {
      throw { statusCode: 400, message: 'Chỉ có thể bắt đầu điểm danh cho sự kiện đã được duyệt' };
    }

    const isMember = await prisma.pageMember.findUnique({
      where: { page_id_user_id: { page_id: event.page_id, user_id: adminUserId } },
    });
    if (!isMember) {
      throw { statusCode: 403, message: 'Bạn không có quyền thao tác sự kiện này' };
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'ONGOING' },
    });

    // Tạo QR token đầu tiên
    const qrToken = await qrService.generateToken(eventId);

    return {
      message: 'Đã bắt đầu điểm danh',
      event_id: eventId,
      first_token: qrToken,
    };
  },

  // ── KẾT THÚC ĐIỂM DANH (PAGE_ADMIN) ─────────────────────
  async endCheckin(eventId: string, adminUserId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện' };
    }
    if (event.status !== 'ONGOING') {
      throw { statusCode: 400, message: 'Sự kiện không đang trong trạng thái điểm danh' };
    }

    const isMember = await prisma.pageMember.findUnique({
      where: { page_id_user_id: { page_id: event.page_id, user_id: adminUserId } },
    });
    if (!isMember) {
      throw { statusCode: 403, message: 'Bạn không có quyền thao tác sự kiện này' };
    }

    // Xóa toàn bộ QR token còn lại
    await prisma.qrToken.deleteMany({ where: { event_id: eventId } });

    // Cập nhật những người đã đăng ký nhưng không đến → ABSENT
    await prisma.registration.updateMany({
      where: {
        event_id: eventId,
        status: { in: ['REGISTERED', 'APPROVED'] },
      },
      data: { status: 'ABSENT' },
    });

    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'CLOSED' },
    });

    // Thống kê nhanh
    const stats = await prisma.registration.groupBy({
      by: ['status'],
      where: { event_id: eventId },
      _count: true,
    });

    return {
      message: 'Đã kết thúc điểm danh',
      stats: stats.map(s => ({ status: s.status, count: s._count })),
    };
  },

  // ── LẤY QR TOKEN MỚI NHẤT (PAGE_ADMIN) ──────────────────
  async getCurrentToken(eventId: string, adminUserId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event || event.status !== 'ONGOING') {
      throw { statusCode: 400, message: 'Sự kiện không đang trong trạng thái điểm danh' };
    }

    const isMember = await prisma.pageMember.findUnique({
      where: { page_id_user_id: { page_id: event.page_id, user_id: adminUserId } },
    });
    if (!isMember) {
      throw { statusCode: 403, message: 'Bạn không có quyền truy cập' };
    }

    // Luôn tạo token mới
    const qrToken = await qrService.generateToken(eventId);
    return qrToken;
  },

  // ── SSE STREAM QR (PAGE_ADMIN trình chiếu màn hình lớn) ──
  async streamQr(eventId: string, adminUserId: string, res: any) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện' };
    }

    const isMember = await prisma.pageMember.findUnique({
      where: { page_id_user_id: { page_id: event.page_id, user_id: adminUserId } },
    });
    if (!isMember) {
      throw { statusCode: 403, message: 'Bạn không có quyền truy cập' };
    }

    // Thiết lập SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Gửi token đầu tiên ngay lập tức
    const sendToken = async () => {
      try {
        const token = await qrService.generateToken(eventId);
        res.write(`data: ${JSON.stringify(token)}\n\n`);
      } catch {
        res.write(`data: ${JSON.stringify({ error: 'Sự kiện đã kết thúc' })}\n\n`);
        clearInterval(interval);
        res.end();
      }
    };

    await sendToken();

    // Cứ mỗi 15 giây gửi token mới
    const interval = setInterval(sendToken, 15000);

    // Khi client đóng kết nối
    res.on('close', () => {
      clearInterval(interval);
    });
  },

  // ── XEM LỊCH SỬ ĐIỂM DANH CỦA SỰ KIỆN (PAGE_ADMIN) ─────
  async getCheckinHistory(eventId: string, adminUserId: string) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw { statusCode: 404, message: 'Không tìm thấy sự kiện' };
    }

    const isMember = await prisma.pageMember.findUnique({
      where: { page_id_user_id: { page_id: event.page_id, user_id: adminUserId } },
    });
    if (!isMember) {
      throw { statusCode: 403, message: 'Bạn không có quyền xem' };
    }

    const checkins = await prisma.checkin.findMany({
      where: { registration: { event_id: eventId } },
      orderBy: { checked_in_at: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            profile: {
              select: {
                full_name: true,
                student_id: true,
                class_name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    return {
      event_title: event.title,
      total_checkins: checkins.length,
      checkins: checkins.map(c => ({
        id: c.id,
        method: c.method,
        checked_in_at: c.checked_in_at,
        points_awarded: c.points_awarded,
        student: c.user.profile,
      })),
    };
  },
};