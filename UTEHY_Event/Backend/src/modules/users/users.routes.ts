import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();

// ── Bản thân (tất cả đều cần đăng nhập) ──────────────────────
router.get('/me',                    authenticate, usersController.getMe);
router.patch('/me',                  authenticate, usersController.updateProfile);
router.post('/me/change-password',   authenticate, usersController.changePassword);
router.get('/me/training-points',    authenticate, usersController.getTrainingPoints);

// ── System Admin ──────────────────────────────────────────────
router.get('/',                      authenticate, authorize('SYSTEM_ADMIN'), usersController.getUsers);
router.patch('/:id/toggle-active',   authenticate, authorize('SYSTEM_ADMIN'), usersController.toggleUserActive);

// ── Xem profile người khác (đặt cuối để không conflict với /me)
router.get('/:id',                   authenticate, usersController.getUserProfile);

export default router;