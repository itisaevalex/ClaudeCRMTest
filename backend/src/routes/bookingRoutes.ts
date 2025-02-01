import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { validateBookingRequest } from '../middleware/validation';

const router = Router();
const bookingController = new BookingController();

// Create a new booking
router.post('/create', validateBookingRequest, bookingController.createBooking);

// Get all bookings
router.get('/', bookingController.getAllBookings);

// Get dashboard statistics
router.get('/dashboard-stats', bookingController.getDashboardStats);

// Get recent transactions
router.get('/recent-transactions', bookingController.getRecentTransactions);

export default router;