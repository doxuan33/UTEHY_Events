import prisma from '../../config/database';
import { CreatePageInput, UpdatePageInput, AddMemberInput } from './pages.schema';

export const pagesService = {

  // ── TẠO TRANG CLB (SYSTEM_ADMIN) ─────────────────────────
  async createPage(input: CreatePageInput, adminUserId: string) {
    // Kiểm tra slug đã tồn tại chưa
    const existing = await prisma.page.findUnique({
      where: { slug: input.slug },
    });
    if (existing) {
      throw { statusCode: 409, message: 'Slug này đã được sử dụng, vui lòng chọn slug khác' };
    }

    const page = await prisma.$transaction(async (tx) => {
      // Tạo page
      const newPage = await tx.page.create({
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description,
          avatar_url: input.avatar_url,
          cover_url: input.cover_url,
          is_verified: true, // Tạo bởi System Admin → tự động verified
        },
      });

      // Thêm admin tạo page làm owner đầu tiên
      await tx.pageMember.create({
        data: {
          page_id: newPage.id,
          user_id: adminUserId,
          is_owner: true,
        },
      });

      return newPage;
    });

    return page;
  },

  // ── LẤY DANH SÁCH TẤT CẢ TRANG ──────────────────────────
  async getPages(search?: string) {
    return prisma.page.findMany({
      where: search
        ? { name: { contains: search } }
        : undefined,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            followers: true,
            events: true,
          },
        },
      },
    });
  },

  // ── LẤY CHI TIẾT 1 TRANG ─────────────────────────────────
  async getPageBySlug(slug: string, userId?: string) {
    const page = await prisma.page.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: {
                  select: { full_name: true, avatar_url: true, student_id: true },
                },
              },
            },
          },
        },
        _count: {
          select: { followers: true, events: true, posts: true },
        },
      },
    });

    if (!page) {
      throw { statusCode: 404, message: 'Không tìm thấy trang CLB' };
    }

    // Kiểm tra user hiện tại có đang follow không
    let isFollowing = false;
    if (userId) {
      const follow = await prisma.pageFollower.findUnique({
        where: { page_id_user_id: { page_id: page.id, user_id: userId } },
      });
      isFollowing = !!follow;
    }

    return { ...page, is_following: isFollowing };
  },

  // ── LẤY CHI TIẾT 1 TRANG THEO ID ─────────────────────────
  async getPageById(pageId: string) {
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        _count: { select: { followers: true, events: true } },
      },
    });

    if (!page) {
      throw { statusCode: 404, message: 'Không tìm thấy trang CLB' };
    }

    return page;
  },

  // ── CẬP NHẬT TRANG (PAGE_ADMIN) ──────────────────────────
  async updatePage(pageId: string, userId: string, input: UpdatePageInput) {
    // Kiểm tra user có phải thành viên của page không
    const member = await prisma.pageMember.findUnique({
      where: { page_id_user_id: { page_id: pageId, user_id: userId } },
    });
    if (!member) {
      throw { statusCode: 403, message: 'Bạn không có quyền chỉnh sửa trang này' };
    }

    // Nếu đổi slug thì kiểm tra trùng
    if (input.slug) {
      const existing = await prisma.page.findFirst({
        where: { slug: input.slug, NOT: { id: pageId } },
      });
      if (existing) {
        throw { statusCode: 409, message: 'Slug này đã được sử dụng' };
      }
    }

    return prisma.page.update({
      where: { id: pageId },
      data: input,
    });
  },

  // ── THEO DÕI TRANG (STUDENT) ──────────────────────────────
  async followPage(pageId: string, userId: string) {
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) {
      throw { statusCode: 404, message: 'Không tìm thấy trang CLB' };
    }

    // Kiểm tra đã follow chưa
    const existing = await prisma.pageFollower.findUnique({
      where: { page_id_user_id: { page_id: pageId, user_id: userId } },
    });
    if (existing) {
      throw { statusCode: 409, message: 'Bạn đã theo dõi trang này rồi' };
    }

    await prisma.pageFollower.create({
      data: { page_id: pageId, user_id: userId },
    });

    return { message: `Đã theo dõi ${page.name}` };
  },

  // ── HỦY THEO DÕI TRANG (STUDENT) ─────────────────────────
  async unfollowPage(pageId: string, userId: string) {
    const existing = await prisma.pageFollower.findUnique({
      where: { page_id_user_id: { page_id: pageId, user_id: userId } },
    });
    if (!existing) {
      throw { statusCode: 400, message: 'Bạn chưa theo dõi trang này' };
    }

    await prisma.pageFollower.delete({
      where: { page_id_user_id: { page_id: pageId, user_id: userId } },
    });

    return { message: 'Đã hủy theo dõi' };
  },

  // ── THÊM THÀNH VIÊN QUẢN LÝ PAGE (SYSTEM_ADMIN) ──────────
  async addMember(pageId: string, input: AddMemberInput) {
    const page = await prisma.page.findUnique({ where: { id: pageId } });
    if (!page) {
      throw { statusCode: 404, message: 'Không tìm thấy trang CLB' };
    }

    const user = await prisma.user.findUnique({ where: { id: input.user_id } });
    if (!user) {
      throw { statusCode: 404, message: 'Không tìm thấy người dùng' };
    }

    // Kiểm tra đã là thành viên chưa
    const existing = await prisma.pageMember.findUnique({
      where: { page_id_user_id: { page_id: pageId, user_id: input.user_id } },
    });
    if (existing) {
      throw { statusCode: 409, message: 'Người dùng này đã là thành viên của trang' };
    }

    // Cập nhật role user thành PAGE_ADMIN
    await prisma.user.update({
      where: { id: input.user_id },
      data: { role: 'PAGE_ADMIN' },
    });

    return prisma.pageMember.create({
      data: {
        page_id: pageId,
        user_id: input.user_id,
        is_owner: input.is_owner,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { full_name: true, student_id: true } },
          },
        },
      },
    });
  },

  // ── XÓA THÀNH VIÊN KHỎI PAGE (SYSTEM_ADMIN) ──────────────
  async removeMember(pageId: string, userId: string) {
    const member = await prisma.pageMember.findUnique({
      where: { page_id_user_id: { page_id: pageId, user_id: userId } },
    });
    if (!member) {
      throw { statusCode: 404, message: 'Người dùng này không phải thành viên của trang' };
    }
    if (member.is_owner) {
      throw { statusCode: 400, message: 'Không thể xóa chủ trang' };
    }

    // Kiểm tra user còn quản lý page nào khác không
    const otherPages = await prisma.pageMember.count({
      where: { user_id: userId, NOT: { page_id: pageId } },
    });

    // Nếu không còn quản lý page nào → hạ về STUDENT
    if (otherPages === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: 'STUDENT' },
      });
    }

    await prisma.pageMember.delete({
      where: { page_id_user_id: { page_id: pageId, user_id: userId } },
    });
  },

  // ── LẤY DANH SÁCH PAGE USER ĐANG THEO DÕI ────────────────
  async getFollowingPages(userId: string) {
    const follows = await prisma.pageFollower.findMany({
      where: { user_id: userId },
      include: {
        page: {
          include: {
            _count: { select: { followers: true, events: true } },
          },
        },
      },
      orderBy: { followed_at: 'desc' },
    });

    return follows.map((f) => f.page);
  },
};