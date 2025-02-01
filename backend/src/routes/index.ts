import { Router } from 'express';
import bookingRoutes from './bookingRoutes';
import financeRoutes from './financeRoutes';
import calendarRoutes from './calendarRoutes';
import customerRoutes from './customerRoutes';

const router = Router();

// Health check endpoint
router.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Mount feature-specific routes
router.use('/api', bookingRoutes);
router.use('/api/finances', financeRoutes);
router.use('/api/calendar', calendarRoutes);
router.use('/api/customers', customerRoutes);

export default router;