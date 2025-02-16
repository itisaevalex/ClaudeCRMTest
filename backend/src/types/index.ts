export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ServiceItemCreateInput {
  name: string;
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
  serviceItems: ServiceItemCreateInput[];
  duration: number;
}

export interface BookingEmailData {
  customerName: string;
  cleaningType: string;
  area: string;
  price: string;
  address: string;
  dateTime: string;
  duration: string;
  invoiceDate: string;
  bankName: string;
  bankIBAN: string;
  companyName: string;
  calendarEventLink: string;
  serviceItems: {
    name: string;
    description: string;
    frequency: string;
  }[];
}

export interface CalendarEventResponse {
  status: number;
  statusText: string;
  headers: object;
}

export interface BookingCreateResult {
  booking: any; // Replace 'any' with your Booking type
  calendarEvent: CalendarEventResponse;
}