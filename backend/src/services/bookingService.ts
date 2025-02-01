import { PrismaClient, Booking, Customer } from '@prisma/client';
import { CreateBookingRequest, ServiceItemCreateInput } from '../types';
import { CalendarService } from './calendarService';
import { calendar_v3 } from 'googleapis';

export class BookingService {
  private prisma: PrismaClient;
  private calendarService: CalendarService;

  constructor() {
    this.prisma = new PrismaClient();
    this.calendarService = new CalendarService();
  }

  async createBooking(bookingData: CreateBookingRequest) {
    const { customerDetails, serviceItems = [], ...bookingDetails } = bookingData;

    // Create/update customer
    const customer = await this.prisma.customer.upsert({
      where: { email: customerDetails.email },
      update: customerDetails,
      create: customerDetails,
    });

    // Create service items
    const serviceItemsData: ServiceItemCreateInput[] = serviceItems.map(item => ({
      name: item.name,
      description: item.description ?? null,
      frequency: item.frequency ?? null,
    }));

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        ...bookingDetails,
        dateTime: new Date(bookingDetails.dateTime),
        reminderSent: false,
        customer: {
          connect: { id: customer.id }
        },
        serviceItems: {
          create: serviceItemsData
        }
      },
      include: {
        customer: true,
        serviceItems: true,
      }
    });

    // Create calendar event
    const calendarEvent = await this.createCalendarEvent(booking, customer, bookingData);

    return { booking, calendarEvent };
  }

  private async createCalendarEvent(
    booking: Booking & { serviceItems: any[]; customer: Customer },
    customer: Customer,
    bookingData: CreateBookingRequest
  ) {
    const startTime = new Date(booking.dateTime);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + (booking.duration || 2));

    const formattedServiceItems = booking.serviceItems.map(item => ({
      name: item.name,
      description: item.description || '',
      frequency: item.frequency || ''
    }));

    return this.calendarService.createEvent(
      {
        startTime,
        endTime,
        area: booking.area,
        cleaningType: booking.cleaningType,
        price: booking.price,
        duration: booking.duration,
        serviceItems: formattedServiceItems,
        isBusinessCustomer: bookingData.isBusinessCustomer,
      },
      customer
    );
  }

  async getAllBookings() {
    return this.prisma.booking.findMany({
      include: {
        customer: true,
        serviceItems: true
      },
      orderBy: {
        dateTime: 'asc'
      }
    });
  }

  async getDashboardStats() {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [monthlyBookings, upcomingBookings, completedBookings, totalRevenue] = await Promise.all([
      this.prisma.booking.count({
        where: {
          dateTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      this.prisma.booking.count({
        where: {
          dateTime: {
            gt: currentDate
          }
        }
      }),
      this.prisma.booking.count({
        where: {
          dateTime: {
            lt: currentDate
          }
        }
      }),
      this.prisma.booking.aggregate({
        where: {
          dateTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          price: true
        }
      })
    ]);

    return {
      monthlyRevenue: totalRevenue._sum.price || 0,
      totalBookings: monthlyBookings,
      upcomingBookings,
      completedBookings
    };
  }

  async getRecentTransactions() {
    return this.prisma.booking.findMany({
      take: 10,
      orderBy: {
        dateTime: 'desc'
      },
      include: {
        customer: true
      }
    });
  }
}