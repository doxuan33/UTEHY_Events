import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

// SSE stream - đặt trước các route có params
router.get('/stream',      authenticate, notificationsController.stream);
router.get('/unread-count',authenticate, notificationsController.getUnreadCount);
router.get('/',            authenticate, notificationsController.getMyNotifications);

// Đánh dấu đã đọc
router.patch('/read-all',  authenticate, notificationsController.markAllAsRead);
router.patch('/:id/read',  authenticate, notificationsController.markAsRead);

// Xóa
router.delete('/read',     authenticate, notificationsController.deleteAllRead);
router.delete('/:id',      authenticate, notificationsController.deleteNotification);

export default router;