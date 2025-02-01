export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ServiceItemInput {
  name: string;
  description?: string | null;
  frequency?: string | null;
}

export interface BookingStatus {
  type: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface CreateBookingRequest {
  area: number;
  dateTime: string;
  customerDetails: CustomerDetails;
  price: number;
  cleaningType: string;
  isBusinessCustomer: boolean;
  serviceItems: ServiceItemInput[];
  duration: number;
}

export interface CommunicationInput {
  type: 'email' | 'sms';
  subject: string;
  content: string;
  customerId: number;
  bookingId?: number;
}

export interface SettingsUpdateInput {
  companyName?: string;
  phoneNumber?: string;
  address?: string;
  emailSettings?: Record<string, any>;
  baseRate?: number;
  workingHours?: Record<string, any>;
}