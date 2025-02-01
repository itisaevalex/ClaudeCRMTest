import { Request, Response } from 'express';
import { BookingService } from '../services/bookingService';
import { EmailService } from '../services/emailService';
import { CalendarService } from '../services/calendarService';
import { CreateBookingRequest } from '../types';
import { calendar_v3 } from 'googleapis';

export class BookingController {
  private bookingService: BookingService;
  private emailService: EmailService;

  constructor() {
    this.bookingService = new BookingService();
    this.emailService = new EmailService();
  }

  createBooking = async (req: Request, res: Response) => {
    try {
      const bookingData = req.body as CreateBookingRequest;
      
      // Create booking with all related data
      const result = await this.bookingService.createBooking(bookingData);
      
      if (!result.booking || !result.calendarEvent) {
        throw new Error('Failed to create booking or calendar event');
      }
  
      // Send confirmation email with calendar event
      await this.emailService.sendBookingConfirmation(
        result.booking,
        result.calendarEvent.data  // Access the data property from calendar event
      );
    
      res.status(201).json({
        message: 'Booking created successfully!',
        booking: result.booking,
        calendarEvent: {
          id: result.calendarEvent.data?.id || null,
          htmlLink: result.calendarEvent.data?.htmlLink || null
        }
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({
        error: 'Failed to create booking.',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  getAllBookings = async (req: Request, res: Response) => {
    try {
      const bookings = await this.bookingService.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  };

  getDashboardStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.bookingService.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  };

  getRecentTransactions = async (req: Request, res: Response) => {
    try {
      const transactions = await this.bookingService.getRecentTransactions();
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      res.status(500).json({ error: 'Failed to fetch recent transactions' });
    }
  };
}