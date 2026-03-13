import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import { env } from './config/env';
import eventsRoutes from './modules/events/events.routes';
import pagesRoutes from './modules/pages/pages.routes';
import registrationsRoutes from './modules/registrations/registrations.routes';
import postsRoutes from './modules/posts/posts.routes';
import usersRoutes from './modules/users/users.routes';
import checkinRoutes from './modules/checkin/checkin.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// ── Middlewares bảo mật ──────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter toàn cục
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Quá nhiều request' }));

// ── Routes ───────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'OK', time: new Date() }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/pages', pagesRoutes);
app.use('/api/v1/registrations', registrationsRoutes);
app.use('/api/v1/posts', postsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/checkin', checkinRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/admin', adminRoutes);


// ── Global Error Handler (phải đặt CUỐI CÙNG) ───────
app.use(errorHandler);

app.listen(Number(env.PORT), () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${env.PORT}`);
});

export default app;