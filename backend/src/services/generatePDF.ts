import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import { ServiceItem } from '@prisma/client';

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface BookingDetails {
  customerDetails: CustomerDetails;
  cleaningType: string;
  area: number;
  price: number;
  dateTime: string;
  duration: number;  // Now matches the Prisma schema
  isBusinessCustomer: boolean;
  serviceItems?: ServiceItem[];  // Using Prisma's ServiceItem type
}

// Register Handlebars helpers
Handlebars.registerHelper('if_eq', function(this: any, a: any, b: any, opts: Handlebars.HelperOptions) {
  return a === b ? opts.fn(this) : opts.inverse(this);
});

export const generateInvoicePDF = async (bookingDetails: BookingDetails): Promise<Buffer> => {
  try {
    // Read the HTML template
    const templatePath = path.join(__dirname, '..', 'offerTemplate.html');
    const templateContent = await fs.promises.readFile(templatePath, 'utf-8');

    // Compile template
    const template = Handlebars.compile(templateContent);

    // Prepare data for template
    const templateData = {
      date: new Date(bookingDetails.dateTime).toLocaleString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      customerName: bookingDetails.customerDetails.name,
      email: bookingDetails.customerDetails.email,
      phone: bookingDetails.customerDetails.phone,
      address: bookingDetails.customerDetails.address,
      customerType: bookingDetails.isBusinessCustomer ? 'Business' : 'Private',
      cleaningType: bookingDetails.cleaningType,
      area: bookingDetails.area,
      price: bookingDetails.price.toFixed(2),
      duration: `${bookingDetails.duration} hours`, // Format duration for display
      serviceItems: bookingDetails.serviceItems || []
    };

    // Generate HTML
    const html = template(templateData);

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true
    });
    const page = await browser.newPage();

    // Set content and wait for fonts to load
    await page.setContent(html, {
      waitUntil: 'networkidle0'
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      preferCSSPageSize: true,
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      }
    });

    await browser.close();
    return Buffer.from(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const savePDFToFile = async (buffer: Buffer, filename: string): Promise<void> => {
  try {
    await fs.promises.writeFile(filename, buffer);
  } catch (error) {
    throw new Error(`Error saving PDF: ${error}`);
  }
};