import { Response, NextFunction } from 'express';
import { pagesService } from './pages.service';
import { createPageSchema, updatePageSchema, addMemberSchema } from './pages.schema';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { AuthRequest } from '../../middlewares/authenticate';

const getParam = (param: string | string[]): string =>
  Array.isArray(param) ? param[0] : param;

export const pagesController = {

  // GET /api/v1/pages
  async getPages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const result = await pagesService.getPages(search);
      return sendSuccess(res, result, 'Lấy danh sách trang thành công');
    } catch (err) { next(err); }
  },

  // GET /api/v1/pages/following
  async getFollowingPages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await pagesService.getFollowingPages(req.user!.id);
      return sendSuccess(res, result, 'Lấy danh sách đang theo dõi thành công');
    } catch (err) { next(err); }
  },

  // GET /api/v1/pages/:slug
  async getPageBySlug(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await pagesService.getPageBySlug(
        getParam(req.params.slug),
        req.user?.id
      );
      return sendSuccess(res, result, 'Lấy thông tin trang thành công');
    } catch (err) { next(err); }
  },

  // POST /api/v1/pages
  async createPage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createPageSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }
      const result = await pagesService.createPage(parsed.data, req.user!.id);
      return sendSuccess(res, result, 'Tạo trang CLB thành công', 201);
    } catch (err) { next(err); }
  },

  // PATCH /api/v1/pages/:id
  async updatePage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = updatePageSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }
      const result = await pagesService.updatePage(
        getParam(req.params.id),
        req.user!.id,
        parsed.data
      );
      return sendSuccess(res, result, 'Cập nhật trang thành công');
    } catch (err) { next(err); }
  },

  // POST /api/v1/pages/:id/follow
  async followPage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await pagesService.followPage(
        getParam(req.params.id),
        req.user!.id
      );
      return sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  },

  // DELETE /api/v1/pages/:id/follow
  async unfollowPage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await pagesService.unfollowPage(
        getParam(req.params.id),
        req.user!.id
      );
      return sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  },

  // POST /api/v1/pages/:id/members
  async addMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = addMemberSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }
      const result = await pagesService.addMember(
        getParam(req.params.id),
        parsed.data
      );
      return sendSuccess(res, result, 'Thêm thành viên thành công', 201);
    } catch (err) { next(err); }
  },

  // DELETE /api/v1/pages/:id/members/:userId
  async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await pagesService.removeMember(
        getParam(req.params.id),
        getParam(req.params.userId)
      );
      return sendSuccess(res, null, 'Xóa thành viên thành công');
    } catch (err) { next(err); }
  },
};