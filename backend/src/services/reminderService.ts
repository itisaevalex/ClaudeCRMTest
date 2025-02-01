import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

export async function checkAndSendReminders() {
  try {
    // Get all bookings that:
    // 1. Haven't had reminders sent
    // 2. Are happening in the next hour
    const bookings = await prisma.booking.findMany({
      where: {
        reminderSent: false,
        dateTime: {
          gt: new Date(),
          lt: new Date(Date.now() + 60 * 60 * 1000), // Next hour
        },
      },
      include: {
        customer: true,
      },
    });

    for (const booking of bookings) {
      // Load email template
      const templatePath = path.join(__dirname, '../../emailReminder.html');
      let emailHTML = fs.readFileSync(templatePath, 'utf-8');

      // Replace placeholders
      emailHTML = emailHTML
        .replace('{{customerName}}', booking.customer.name)
        .replace('{{area}}', booking.area.toString())
        .replace('{{price}}', booking.price.toString())
        .replace('{{address}}', booking.customer.address)
        .replace('{{dateTime}}', new Date(booking.dateTime).toLocaleString())
        .replace('{{supportPhone}}', process.env.SUPPORT_PHONE || '+1234567890');

      // Send email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: booking.customer.email,
        subject: 'Reminder: Your Cleaning Service is Coming Soon!',
        html: emailHTML,
      });

      // Mark reminder as sent
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSent: true },
      });

      console.log(`Reminder sent for booking ${booking.id}`);
    }
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
}