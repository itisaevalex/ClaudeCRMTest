import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Booking, Customer } from '@prisma/client';

interface CalendarEventData {
  startTime: Date;
  endTime: Date;
  area: number;
  cleaningType: string;
  price: number;
  duration: number;
  serviceItems?: Array<{
    name: string;
    description: string;
    frequency: string;
  }>;
  isBusinessCustomer: boolean;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export class CalendarService {
  private calendar: calendar_v3.Calendar;
  private auth: OAuth2Client;
  private calendarId: string;
  private readonly TIME_ZONE = 'Europe/London';

  constructor() {
    if (!process.env.GOOGLE_CLIENT_ID) throw new Error('Missing GOOGLE_CLIENT_ID');
    if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error('Missing GOOGLE_CLIENT_SECRET');
    if (!process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) throw new Error('Missing GOOGLE_CALENDAR_REFRESH_TOKEN');
    if (!process.env.GOOGLE_REDIRECT_URI) throw new Error('Missing GOOGLE_REDIRECT_URI');
  
    console.log('Initializing Calendar Service with:', {
      clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 15) + '...',
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      refreshTokenLength: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN?.length,
      calendarId: process.env.GOOGLE_CALENDAR_ID
    });
  
    this.auth = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID.trim(),
      process.env.GOOGLE_CLIENT_SECRET.trim(),
      process.env.GOOGLE_REDIRECT_URI.trim()
    );
  
    this.auth.setCredentials({
      refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN.trim()
    });
  
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    this.calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      console.log('Refreshing access token...');
      const { credentials } = await this.auth.refreshAccessToken();
      console.log('Access token refreshed successfully');
      this.auth.setCredentials(credentials);
    } catch (error: any) {
      console.error('Error refreshing token:', {
        error: error.message,
        details: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
  }

  private getColorIdForCleaningType(cleaningType: string): string {
    // Google Calendar color IDs (1-11)
    // Reference: https://developers.google.com/calendar/api/v3/reference/colors/get
    const colorMap: { [key: string]: string } = {
      'Home': '9',      // Purple
      'Office': '5',    // Yellow
      'Move-out': '11', // Red
      'Default': '1'    // Blue
    };

    return colorMap[cleaningType] || colorMap['Default'];
  }

  async getAvailableSlots(date: Date): Promise<TimeSlot[]> {
    try {
      await this.refreshAccessToken();

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items as calendar_v3.Schema$Event[];
      return this.calculateAvailableSlots(date, events || []);
    } catch (error: any) {
      throw new Error(`Failed to fetch calendar availability: ${error.message}`);
    }
  }

  private calculateAvailableSlots(date: Date, events: calendar_v3.Schema$Event[]): TimeSlot[] {
    const busySlots = events.map(event => ({
      start: new Date(event.start?.dateTime || event.start?.date || ''),
      end: new Date(event.end?.dateTime || event.end?.date || '')
    }));

    const availableSlots: TimeSlot[] = [];
    const workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      const isAvailable = !busySlots.some(busy => 
        (slotStart >= busy.start && slotStart < busy.end) ||
        (slotEnd > busy.start && slotEnd <= busy.end) ||
        (slotStart <= busy.start && slotEnd >= busy.end)
      );

      availableSlots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        available: isAvailable
      });
    }

    return availableSlots;
  }

  async getEvents(startDate: Date, endDate: Date): Promise<calendar_v3.Schema$Event[]> {
    try {
      await this.refreshAccessToken();

      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      throw new Error(`Failed to fetch calendar events: ${error.message}`);
    }
  }

  async createEvent(eventData: CalendarEventData, customer: Customer) {
    try {
      await this.refreshAccessToken();
  
      // Format additional services if they exist
      const additionalServices = eventData.serviceItems?.length
        ? '\n\nADDITIONAL SERVICES\n' + 
          '-----------------\n' +
          eventData.serviceItems
            .map((service, index) => {
              let serviceText = `${index + 1}. ${service.name}`;
              if (service.frequency) {
                serviceText += ` (${service.frequency})`;
              }
              if (service.description) {
                serviceText += `\n   Description: ${service.description}`;
              }
              return serviceText;
            })
            .join('\n\n')
        : '';
  
      // Format price
      const formattedPrice = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'EUR'
      }).format(eventData.price);
  
      const description = `
  SERVICE DETAILS
  --------------
  Type: ${eventData.cleaningType}
  Area: ${eventData.area} sq meters
  Duration: ${eventData.duration} hours
  Price: ${formattedPrice}
  Customer Type: ${eventData.isBusinessCustomer ? 'Business' : 'Private'}
  
  CUSTOMER INFO
  ------------
  Name: ${customer.name}
  Phone: ${customer.phone}
  Email: ${customer.email}
  Address: ${customer.address}${additionalServices}`;
  
      const event: calendar_v3.Schema$Event = {
        summary: `${customer.name} - ${eventData.cleaningType} (${formattedPrice})`,
        description: description.trim(),
        start: {
          dateTime: eventData.startTime.toISOString(),
          timeZone: this.TIME_ZONE,
        },
        end: {
          dateTime: eventData.endTime.toISOString(),
          timeZone: this.TIME_ZONE,
        },
        location: customer.address,
        colorId: this.getColorIdForCleaningType(eventData.cleaningType),
      };
  
      return await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: event,
        sendUpdates: 'none',
      });
    } catch (error: any) {
      throw new Error(`Failed to create calendar event: ${error.message}`);
    }
  }
}