import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { Booking, Customer, ServiceItem } from '@prisma/client';
import { generateInvoicePDF } from './generatePDF';
import { calendar_v3 } from 'googleapis';

interface BookingWithRelations extends Booking {
  customer: Customer;
  serviceItems: ServiceItem[];
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  async sendBookingConfirmation(
    booking: BookingWithRelations, 
    calendarEvent: calendar_v3.Schema$Event
  ): Promise<void> {
    try {
      const templatePath = path.join(process.cwd(), 'src', 'invoiceConfirmation.html');
      const templateSource = fs.readFileSync(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);

      const formattedDateTime = new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      }).format(booking.dateTime);

      const emailData = {
        customerName: booking.customer.name,
        cleaningType: booking.cleaningType,
        area: booking.area.toString(),
        price: booking.price.toString(),
        address: booking.customer.address,
        dateTime: formattedDateTime,
        duration: `${booking.duration} hours`,
        invoiceDate: new Date().toLocaleDateString(),
        bankName: 'RECT Bank AB',
        bankIBAN: 'SE12 3456 7890 1234',
        companyName: 'RECT',
        calendarEventLink: calendarEvent.htmlLink,
        serviceItems: booking.serviceItems.map(item => ({
          name: item.name,
          description: item.description || '',
          frequency: item.frequency || ''
        }))
      };

      const emailHTML = template(emailData);

      const invoicePDF = await generateInvoicePDF({
        customerDetails: {
          name: booking.customer.name,
          email: booking.customer.email,
          phone: booking.customer.phone,
          address: booking.customer.address
        },
        cleaningType: booking.cleaningType,
        area: booking.area,
        price: booking.price,
        dateTime: booking.dateTime.toISOString(),
        duration: booking.duration,
        isBusinessCustomer: false,
        serviceItems: booking.serviceItems
      });

      await this.transporter.sendMail({
        from: process.env.EMAIL_USER || 'default@example.com',
        to: booking.customer.email,
        subject: 'Booking Confirmation',
        html: emailHTML,
        attachments: [
          {
            filename: 'invoice.pdf',
            content: invoicePDF,
            contentType: 'application/pdf',
          },
        ],
      });
    } catch (error) {
      console.error('Error sending booking confirmation email:', error);
      throw new Error(`Failed to send booking confirmation email: ${error}`);
    }
  }
}