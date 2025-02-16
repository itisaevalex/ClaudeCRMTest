import { supabase } from '../utils/supabase';
import { CreateBookingRequest } from '../types';
import { CalendarService } from './calendarService';
import { Request } from 'express'; // importing custom request file containing the req.user extension

export class BookingService {
 private calendarService: CalendarService;

 constructor() {
   this.calendarService = new CalendarService();
 }

 async createBooking(bookingData: CreateBookingRequest, req: Request) {
  const user = req.user; // Get user from request object

  if (!user) { // User should always be present if middleware passed, but good to check
    throw new Error('Not authenticated'); // Still throw error if user is unexpectedly missing
  }
  
  // More detailed debug logging
  console.log('Attempting booking creation with:', {
    userId: user.id,
    userIdType: typeof user.id,
    userEmail: user.email,
    rawUser: JSON.stringify(user)
  });

  const { customerDetails, serviceItems = [], ...bookingDetails } = bookingData;
 
  try {
    // First try to get existing customer by email
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', customerDetails.email)
      .single();

    // Create or update customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert({
        ...(existingCustomer?.id ? { id: existingCustomer.id } : {}),
        ...customerDetails,
        user_id: user.id,
      }, {
        onConflict: 'email'  // Remove 'returning' option as it's not supported
      })
      .select()
      .single();

    if (customerError) {
      console.error('Customer error details:', customerError);
      throw customerError;
    }


  // Create booking with snake_case column names
  const { data: booking, error: bookingError } = await supabase
  .from('bookings')
  .insert({
    area: bookingDetails.area,
    date_time: new Date(bookingDetails.dateTime),
    price: bookingDetails.price,
    cleaning_type: bookingDetails.cleaningType, // Changed from cleaningType to cleaning_type
    duration: bookingDetails.duration,
    customer_id: customer.id,
    user_id: user.id,
    reminder_sent: false,
    status: 'pending'
  })
  .select()
  .single();

  if (bookingError) {
    console.error('Booking error:', bookingError);
    throw bookingError;
  }
 
  const startTime = new Date(booking.date_time);
  const endTime = new Date(startTime);
  endTime.setHours(startTime.getHours() + booking.duration);
 
  const calendarEvent = await this.calendarService.createEvent({
    startTime,
    endTime,
    area: booking.area,
    cleaningType: booking.cleaning_type,
    price: booking.price,
    duration: booking.duration,
    serviceItems: serviceItems.map(item => ({
      name: item.name || '',
      description: item.description || '',
      frequency: item.frequency || ''
    })),
    isBusinessCustomer: bookingData.isBusinessCustomer
  }, customer);
 
  return { booking, calendarEvent };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

async getAllBookings() {
 const { data, error } = await supabase
   .from('bookings')
   .select(`
     *,
     customer:customers(*),
     service_items:service_items(*)
   `)
   .order('date_time', { ascending: false });

 if (error) throw error;
 return data;
}

async getDashboardStats() {
 const currentDate = new Date();
 const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
 const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

 const { data, error } = await supabase
   .from('bookings')
   .select('date_time, price');

 if (error) throw error;

 return {
   monthlyRevenue: data.reduce((sum, b) => sum + b.price, 0),
   totalBookings: data.length,
   upcomingBookings: data.filter(b => new Date(b.date_time) > currentDate).length,
   completedBookings: data.filter(b => new Date(b.date_time) <= currentDate).length
 };
}

async getRecentTransactions() {
 const { data, error } = await supabase
   .from('bookings')
   .select(`
     *,
     customer:customers(*)
   `)
   .order('date_time', { ascending: false })
   .limit(10);

 if (error) throw error;
 return data;
}
}