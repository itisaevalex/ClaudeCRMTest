import { Request, Response, NextFunction } from 'express';
import { CreateBookingRequest } from '../types';

export const validateBookingRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const booking = req.body as CreateBookingRequest;

  // Basic required field validation
  const requiredFields = {
    area: 'Area',
    dateTime: 'Date and time',
    price: 'Price',
    cleaningType: 'Cleaning type',
    duration: 'Duration',
  };

  for (const [field, label] of Object.entries(requiredFields)) {
    if (!booking[field as keyof CreateBookingRequest]) {
      return res.status(400).json({
        error: `${label} is required`,
      });
    }
  }

  // Validate customer details
  const requiredCustomerFields = {
    name: 'Customer name',
    email: 'Email',
    phone: 'Phone number',
    address: 'Address',
  };

  if (!booking.customerDetails) {
    return res.status(400).json({
      error: 'Customer details are required',
    });
  }

  for (const [field, label] of Object.entries(requiredCustomerFields)) {
    if (!booking.customerDetails[field as keyof typeof booking.customerDetails]) {
      return res.status(400).json({
        error: `${label} is required`,
      });
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(booking.customerDetails.email)) {
    return res.status(400).json({
      error: 'Invalid email format',
    });
  }

  // Validate date and time
  const bookingDate = new Date(booking.dateTime);
  if (isNaN(bookingDate.getTime())) {
    return res.status(400).json({
      error: 'Invalid date and time format',
    });
  }

  // Validate numeric values
  if (booking.area <= 0) {
    return res.status(400).json({
      error: 'Area must be greater than 0',
    });
  }

  if (booking.price <= 0) {
    return res.status(400).json({
      error: 'Price must be greater than 0',
    });
  }

  if (booking.duration <= 0) {
    return res.status(400).json({
      error: 'Duration must be greater than 0',
    });
  }

  // Validate cleaning type
  const validCleaningTypes = ['Home', 'Office', 'Move-out'];
  if (!validCleaningTypes.includes(booking.cleaningType)) {
    return res.status(400).json({
      error: 'Invalid cleaning type',
    });
  }

  // Validate service items if present
  if (booking.serviceItems && booking.serviceItems.length > 0) {
    for (const item of booking.serviceItems) {
      if (!item.name) {
        return res.status(400).json({
          error: 'Service item name is required',
        });
      }
    }
  }

  // Validate phone number format (basic example - adjust regex as needed)
  const phoneRegex = /^\+?[\d\s-]{8,}$/;
  if (!phoneRegex.test(booking.customerDetails.phone)) {
    return res.status(400).json({
      error: 'Invalid phone number format',
    });
  }

  // Validate future date
  const now = new Date();
  if (bookingDate <= now) {
    return res.status(400).json({
      error: 'Booking date must be in the future',
    });
  }

  // Validate business days/hours (example: Monday-Friday, 9 AM - 5 PM)
  const businessHours = {
    start: 9, // 9 AM
    end: 17,  // 5 PM
  };

  if (
    bookingDate.getDay() === 0 || // Sunday
    bookingDate.getDay() === 6 || // Saturday
    bookingDate.getHours() < businessHours.start ||
    bookingDate.getHours() >= businessHours.end
  ) {
    return res.status(400).json({
      error: 'Booking must be during business hours (Monday-Friday, 9 AM - 5 PM)',
    });
  }

  // If all validations pass, continue to the next middleware/controller
  next();
};

// Optional: Add more specific validation middleware for other routes
export const validateBookingUpdateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Similar validation logic for booking updates
  // Might have different requirements than creating a new booking
  next();
};

export const validateDateRangeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      error: 'Start date and end date are required',
    });
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      error: 'Invalid date format',
    });
  }

  if (start > end) {
    return res.status(400).json({
      error: 'Start date must be before end date',
    });
  }

  next();
};

// Helper function to validate business hours
export const isWithinBusinessHours = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();

  // Check if it's a weekday (Monday-Friday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }

  // Check if it's between 9 AM and 5 PM
  if (hour < 9 || hour >= 17) {
    return false;
  }

  return true;
};