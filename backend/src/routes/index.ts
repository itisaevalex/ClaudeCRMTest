import { Router } from 'express';
import bookingRoutes from './bookingRoutes';
import customerRoutes from './customerRoutes';
import financeRoutes from './financeRoutes';
import { Customer } from '../types/booking';

const router = Router();

router.use('/api/bookings', bookingRoutes);
router.use('/api/customers', customerRoutes);
router.use('/api/finances', financeRoutes);

// Health check route
router.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Calendar URL route
router.get('/api/calendar-url', (req, res) => {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    return res.status(500).json({ error: 'Calendar ID not configured' });
  }
  const publicUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`;
  res.json({ url: publicUrl });
});

// Update calendar URL route to use Supabase Customer type
router.get('/api/calendar-url', (req, res) => {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) {
    return res.status(500).json({ error: 'Calendar ID not configured' });
  }
  const publicUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`;
  res.json({ url: publicUrl });
});

export default router;