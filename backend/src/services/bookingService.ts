// src/services/bookingService.ts
import { PrismaClient } from '@prisma/client';
import type { CreateBookingDTO, BookingWithRelations } from '../types';

export class BookingService {
  constructor(private prisma: PrismaClient) {}

  async createBooking(bookingData: CreateBookingDTO): Promise<BookingWithRelations> {
    // Create or update customer
    const customer = await this.prisma.customer.upsert({
      where: { email: bookingData.customerDetails.email },
      update: {
        name: bookingData.customerDetails.name,
        phone: bookingData.customerDetails.phone,
        address: bookingData.customerDetails.address,
      },
      create: {
        email: bookingData.customerDetails.email,
        name: bookingData.customerDetails.name,
        phone: bookingData.customerDetails.phone,
        address: bookingData.customerDetails.address,
      },
    });

    // Create booking with proper typing and include service items
    return this.prisma.booking.create({
      data: {
        area: bookingData.area,
        dateTime: new Date(bookingData.dateTime),
        price: bookingData.price,
        cleaningType: bookingData.cleaningType,
        duration: bookingData.duration,
        reminderSent: false,
        customer: { connect: { id: customer.id } },
        serviceItems: {
          create: bookingData.serviceItems
        }
      },
      include: {
        customer: true,
        serviceItems: true,
      }
    });
  }

  async getBookingsByDateRange(startDate: Date, endDate: Date) {
    return this.prisma.booking.findMany({
      where: {
        dateTime: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        customer: true,
        serviceItems: true,
      }
    });
  }
}