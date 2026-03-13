import { Router } from 'express';
import { checkinController } from './checkin.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();

// ── Sinh viên quét QR ─────────────────────────────────────────
router.post('/scan', authenticate, checkinController.scanQr);

// ── Page Admin quản lý điểm danh ─────────────────────────────
router.post(
  '/events/:eventId/start',
  authenticate,
  authorize('PAGE_ADMIN', 'SYSTEM_ADMIN'),
  checkinController.startCheckin
);

router.post(
  '/events/:eventId/end',
  authenticate,
  authorize('PAGE_ADMIN', 'SYSTEM_ADMIN'),
  checkinController.endCheckin
);

router.post(
  '/manual',
  authenticate,
  authorize('PAGE_ADMIN', 'SYSTEM_ADMIN'),
  checkinController.manualCheckin
);

router.get(
  '/events/:eventId/token',
  authenticate,
  authorize('PAGE_ADMIN', 'SYSTEM_ADMIN'),
  checkinController.getCurrentToken
);

// SSE stream - không dùng sendSuccess vì trả về stream
router.get(
  '/events/:eventId/stream',
  authenticate,
  authorize('PAGE_ADMIN', 'SYSTEM_ADMIN'),
  checkinController.streamQr
);

router.get(
  '/events/:eventId/history',
  authenticate,
  authorize('PAGE_ADMIN', 'SYSTEM_ADMIN'),
  checkinController.getCheckinHistory
);

export default router;