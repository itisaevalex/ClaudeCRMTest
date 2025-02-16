import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { validateBookingRequest } from '../middleware/validation';
import { verifyToken } from '../middleware/authMiddleware'; // **Import verifyToken middleware**

const router = Router();
const bookingController = new BookingController();

// Create a new booking - **Apply verifyToken middleware here**
router.post('/create', verifyToken, validateBookingRequest, bookingController.createBooking);

// Get all bookings (You might protect these later as well, but for now, let's focus on create)
router.get('/', bookingController.getAllBookings);

// Get dashboard statistics (Likely needs protection later)
router.get('/dashboard-stats', bookingController.getDashboardStats);

// Get recent transactions (Likely needs protection later)
router.get('/recent-transactions', bookingController.getRecentTransactions);

export default router;