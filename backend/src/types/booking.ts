// src/types/booking.ts
import type { Booking, Customer, ServiceItem } from '@prisma/client';
import type { calendar_v3 } from 'googleapis';

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ServiceItemCreateInput {
  name?: string | null;
  description?: string | null;
  frequency?: string | null;
}

export interface CreateBookingRequest {
  area: number;
  dateTime: string;
  customerDetails: CustomerDetails;
  price: number;
  cleaningType: string;
  isBusinessCustomer: boolean;
  serviceItems?: ServiceItemCreateInput[];
  duration: number;
}

export interface BookingWithRelations extends Booking {
  customer: Customer;
  serviceItems: ServiceItem[];
}

export interface CalendarEventData {
  startTime: Date;
  endTime: Date;
  area: number;
  cleaningType: string;
  price: number;
  duration: number;
  serviceItems: {
    name: string;
    description: string;
    frequency: string;
  }[];
  isBusinessCustomer: boolean;
}

export interface BookingServiceResult {
  booking: BookingWithRelations;
  calendarEvent: calendar_v3.Schema$Event;
}
export interface BookingResponse {
  message: string;
  booking: BookingWithRelations;
  calendarEvent: {
    id: string | null;
    htmlLink: string | null;
  };
}