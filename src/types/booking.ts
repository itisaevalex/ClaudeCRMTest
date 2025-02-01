export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ServiceItem {
  name: string;
  description: string;
  frequency: string;
}

export interface BookingDetails {
  area: number;
  dateTime: string;
  customerDetails: CustomerDetails;
  price: number;
  cleaningType: string;
  isBusinessCustomer: boolean;
  serviceItems: ServiceItem[]; 
  duration: number;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}