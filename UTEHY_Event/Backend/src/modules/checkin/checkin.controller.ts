import { Request, Response, NextFunction } from 'express';
import { checkinService } from './checkin.service';
import { scanQrSchema, manualCheckinSchema } from './checkin.schema';
import { sendSuccess, sendError } from '../../shared/utils/response';
import { AuthRequest } from '../../middlewares/authenticate';

const getParam = (param: string | string[]): string =>
  Array.isArray(param) ? param[0] : param;

export const checkinController = {

  // POST /api/v1/checkin/scan
  async scanQr(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = scanQrSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }
      const result = await checkinService.scanQr(req.user!.id, parsed.data);
      return sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  },

  // POST /api/v1/checkin/manual
  async manualCheckin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = manualCheckinSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, parsed.error.issues[0].message, 400);
      }
      const result = await checkinService.manualCheckin(req.user!.id, parsed.data);
      return sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  },

  // POST /api/v1/checkin/events/:eventId/start
  async startCheckin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await checkinService.startCheckin(
        getParam(req.params.eventId),
        req.user!.id
      );
      return sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  },

  // POST /api/v1/checkin/events/:eventId/end
  async endCheckin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await checkinService.endCheckin(
        getParam(req.params.eventId),
        req.user!.id
      );
      return sendSuccess(res, result, result.message);
    } catch (err) { next(err); }
  },

  // GET /api/v1/checkin/events/:eventId/token
  async getCurrentToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await checkinService.getCurrentToken(
        getParam(req.params.eventId),
        req.user!.id
      );
      return sendSuccess(res, result, 'Lấy token thành công');
    } catch (err) { next(err); }
  },

  // GET /api/v1/checkin/events/:eventId/stream  (SSE)
  async streamQr(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await checkinService.streamQr(
        getParam(req.params.eventId),
        req.user!.id,
        res
      );
    } catch (err) { next(err); }
  },

  // GET /api/v1/checkin/events/:eventId/history
  async getCheckinHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await checkinService.getCheckinHistory(
        getParam(req.params.eventId),
        req.user!.id
      );
      return sendSuccess(res, result, 'Lấy lịch sử điểm danh thành công');
    } catch (err) { next(err); }
  },
};