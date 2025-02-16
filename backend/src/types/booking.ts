// src/types/booking.ts
import type { calendar_v3 } from 'googleapis';

export interface Customer {
  id: number;
  user_id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  total_revenue: number;
  last_service: string | null;
  next_service: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Booking {
  id: number;
  user_id: string;
  area: number;
  date_time: string;
  price: number;
  cleaning_type: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reminder_sent: boolean;
  customer_id: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  service_items?: ServiceItem[];
}

export interface ServiceItem {
  id: number;
  user_id: string;
  name: string;
  description?: string;
  frequency?: string;
  booking_id: number;
  created_at: string;
}


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