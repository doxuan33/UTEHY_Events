import { Response, NextFunction } from 'express';
import { postsService } from './posts.service';
import {
  createPostSchema,
  updatePostSchema,
  createCommentSchema,
  getNewsfeedQuerySchema,
  getCommentsQuerySchema,
} from './posts.schema';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { AuthRequest } from '../../middlewares/authenticate';

const getParam = (param: string | string[]): string =>
  Array.isArray(param) ? param[0] : param;

export const postsController = {

  // GET /api/v1/posts/newsfeed
  async getNewsfeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = getNewsfeedQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }
      const result = await postsService.getNewsfeed(req.user!.id, parsed.data);
      return sendSuccess(res, result, 'Lấy bảng tin thành công');
    } catch (err) { next(err); }
  },

  // GET /api/v1/posts/:id
  async getPostById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await postsService.getPostById(
        getParam(req.params.id),
        req.user!.id
      );
      return sendSuccess(res, result, 'Lấy bài viết thành công');
    } catch (err) { next(err); }
  },

  // POST /api/v1/posts
  async createPost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createPostSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }
      const result = await postsService.createPost(req.user!.id, parsed.data);
      return sendSuccess(res, result, 'Đăng bài viết thành công', 201);
    } catch (err) { next(err); }
  },

  // PATCH /api/v1/posts/:id
  async updatePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = updatePostSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }
      const result = await postsService.updatePost(
        getParam(req.params.id),
        req.user!.id,
        parsed.data
      );
      return sendSuccess(res, result, 'Cập nhật bài viết thành công');
    } catch (err) { next(err); }
  },

  // DELETE /api/v1/posts/:id
  async deletePost(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await postsService.deletePost(
        getParam(req.params.id),
        req.user!.id,
        req.user!.role
      );
      return sendSuccess(res, null, 'Xóa bài viết thành công');
    } catch (err) { next(err); }
  },

  // POST /api/v1/posts/:id/like
  async toggleLike(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await postsService.toggleLike(
        getParam(req.params.id),
        req.user!.id
      );
      return sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  },

  // GET /api/v1/posts/:id/comments
  async getComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = getCommentsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }
      const result = await postsService.getComments(
        getParam(req.params.id),
        parsed.data
      );
      return sendSuccess(res, result, 'Lấy bình luận thành công');
    } catch (err) { next(err); }
  },

  // POST /api/v1/posts/:id/comments
  async createComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = createCommentSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }
      const result = await postsService.createComment(
        getParam(req.params.id),
        req.user!.id,
        parsed.data
      );
      return sendSuccess(res, result, 'Bình luận thành công', 201);
    } catch (err) { next(err); }
  },

  // DELETE /api/v1/posts/:postId/comments/:commentId
  async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await postsService.deleteComment(
        getParam(req.params.commentId),
        req.user!.id,
        req.user!.role
      );
      return sendSuccess(res, null, 'Xóa bình luận thành công');
    } catch (err) { next(err); }
  },
};