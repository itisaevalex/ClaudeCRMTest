import { Router } from 'express';
import { PrismaClient, Prisma, ServiceItem, Booking, Customer } from '@prisma/client';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Handlebars from 'handlebars';
import { CalendarService } from './services/calendarService';
import { generateInvoicePDF } from './services/generatePDF';

dotenv.config();

const router = Router();
const prisma = new PrismaClient();
const calendarService = new CalendarService();

// Update ServiceItem type to match Prisma schema
type ServiceItemCreateInput = {
  name: string;
  description?: string | null;
  frequency?: string | null;
};

interface CreateBookingRequest {
  area: number;
  dateTime: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  price: number;
  cleaningType: string;
  isBusinessCustomer: boolean;
  serviceItems: ServiceItemCreateInput[];
  duration: number;
}


// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});

// Health check endpoint
router.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Get all calendar events for a date range
router.get('/api/calendar-events', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const events = await calendarService.getEvents(
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      details: (error as Error).message 
    });
  }
});

// Get availability endpoint
router.get('/api/availability/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    console.log(`Fetching availability for date: ${date.toISOString()}`);
    const availableSlots = await calendarService.getAvailableSlots(date);
    
    res.json(availableSlots);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ 
      error: 'Failed to fetch availability',
      details: (error as Error).message 
    });
  }
});

// Create booking endpoint
router.post('/api/create-booking', async (req, res) => {
  try {
    const {
      area,
      dateTime,
      customerDetails,
      price,
      cleaningType,
      isBusinessCustomer = false,
      serviceItems = [],
      duration
    } = req.body as CreateBookingRequest;

    // Create/update customer
    const customer = await prisma.customer.upsert({
      where: { email: customerDetails.email },
      update: {
        name: customerDetails.name,
        phone: customerDetails.phone,
        address: customerDetails.address,
      },
      create: {
        email: customerDetails.email,
        name: customerDetails.name,
        phone: customerDetails.phone,
        address: customerDetails.address,
      },
    });

    // Create service items with proper typing
    const serviceItemsData: ServiceItemCreateInput[] = serviceItems.map(item => ({
      name: item.name,
      description: item.description ?? null,
      frequency: item.frequency ?? null,
    }));

    // Create booking with proper typing and include service items
    const booking = await prisma.booking.create({
      data: {
        area,
        dateTime: new Date(dateTime),
        price,
        cleaningType,
        duration,
        reminderSent: false,
        customer: {
          connect: { id: customer.id }
        },
        serviceItems: {
          create: serviceItemsData
        }
      },
      include: {
        customer: true,
        serviceItems: true,
      }
    });

    // Calculate start and end times for calendar
    const startTime = new Date(booking.dateTime);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + (booking.duration || 2));

    // Prepare service items for calendar event
    const formattedServiceItems = booking.serviceItems.map(item => ({
      name: item.name,
      description: item.description || '',
      frequency: item.frequency || ''
    }));

    // Create calendar event with service items
    const calendarEvent = await calendarService.createEvent(
      {
        startTime,
        endTime,
        area: booking.area,
        cleaningType: booking.cleaningType,
        price: booking.price,
        duration: booking.duration,
        serviceItems: formattedServiceItems, // Pass the formatted service items
        isBusinessCustomer,
      },
      booking.customer
    );

    console.log('Calendar event created:', calendarEvent.data.id);

    // Load and process email template
    const templatePath = path.join(process.cwd(), 'src', 'invoiceConfirmation.html');
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    // Format date time for email
    const formattedDateTime = new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    }).format(new Date(booking.dateTime));

    // Prepare email data
    const emailData = {
      customerName: customer.name,
      cleaningType: booking.cleaningType,
      area: booking.area.toString(),
      price: booking.price.toString(),
      address: customer.address,
      dateTime: formattedDateTime,
      duration: `${duration} hours`,
      invoiceDate: new Date().toLocaleDateString(),
      bankName: 'RECT Bank AB',
      bankIBAN: 'SE12 3456 7890 1234',
      companyName: 'RECT',
      calendarEventLink: calendarEvent.data.htmlLink,
      serviceItems: booking.serviceItems.map(item => ({
        name: item.name,
        description: item.description || '',
        frequency: item.frequency || ''
      }))
    };

    // Generate email HTML
    const emailHTML = template(emailData);

    // Generate PDF
    console.log('Generating invoice PDF...');
    const invoicePDF = await generateInvoicePDF({
      customerDetails: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      },
      cleaningType: booking.cleaningType,
      area: booking.area,
      price: booking.price,
      dateTime: booking.dateTime.toISOString(),
      duration,
      isBusinessCustomer,
      serviceItems: booking.serviceItems
    });

    // Send confirmation email
    console.log('Sending confirmation email...');
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customer.email,
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

    res.status(201).json({
      message: 'Booking created successfully!',
      booking,
      calendarEvent: {
        id: calendarEvent.data.id,
        htmlLink: calendarEvent.data.htmlLink
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      error: 'Failed to create booking.',
      details: (error as Error).message,
    });
  }
});

// Get calendar public URL
router.get('/api/calendar-url', (req, res) => {
  try {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      throw new Error('Calendar ID not configured');
    }
    
    const publicUrl = `https://calendar.google.com/calendar/embed?src=${encodeURIComponent(calendarId)}`;
    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Error getting calendar URL:', error);
    res.status(500).json({ 
      error: 'Failed to get calendar URL',
      details: (error as Error).message 
    });
  }
});

// Get all bookings
router.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: true,
        serviceItems: true
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/api/dashboard-stats', async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [monthlyBookings, upcomingBookings, completedBookings, totalRevenue] = await Promise.all([
      // Get total bookings this month
      prisma.booking.count({
        where: {
          dateTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      // Get upcoming bookings
      prisma.booking.count({
        where: {
          dateTime: {
            gt: currentDate
          }
        }
      }),
      // Get completed bookings
      prisma.booking.count({
        where: {
          dateTime: {
            lt: currentDate
          }
        }
      }),
      // Calculate monthly revenue
      prisma.booking.aggregate({
        where: {
          dateTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          price: true
        }
      })
    ]);

    res.json({
      monthlyRevenue: totalRevenue._sum.price || 0,
      totalBookings: monthlyBookings,
      upcomingBookings,
      completedBookings
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent transactions
router.get('/api/recent-transactions', async (req, res) => {
  try {
    const transactions = await prisma.booking.findMany({
      take: 10,
      orderBy: {
        dateTime: 'desc'
      },
      include: {
        customer: true
      }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    res.status(500).json({ error: 'Failed to fetch recent transactions' });
  }
});

// Get customer list with their total revenue
router.get('/api/customers', async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        bookings: {
          orderBy: {
            dateTime: 'desc'
          }
        }
      }
    });

    const customersWithStats = customers.map(customer => {
      const totalRevenue = customer.bookings.reduce((sum, booking) => sum + booking.price, 0);
      const lastService = customer.bookings[0]?.dateTime || null;
      const nextService = customer.bookings.find(booking => booking.dateTime > new Date())?.dateTime || null;

      return {
        ...customer,
        totalRevenue,
        lastService,
        nextService
      };
    });

    res.json(customersWithStats);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get financial overview
router.get('/api/finances/overview', async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [monthlyBookings, upcomingBookings, completedBookings, monthlyRevenue] = await Promise.all([
      // Get monthly bookings
      prisma.booking.count({
        where: {
          dateTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      // Get upcoming bookings
      prisma.booking.count({
        where: {
          dateTime: {
            gt: currentDate
          }
        }
      }),
      // Get completed bookings
      prisma.booking.count({
        where: {
          dateTime: {
            lt: currentDate
          }
        }
      }),
      // Calculate monthly revenue
      prisma.booking.aggregate({
        where: {
          dateTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          price: true
        }
      })
    ]);

    res.json({
      monthlyRevenue: monthlyRevenue._sum.price || 0,
      totalBookings: monthlyBookings,
      upcomingBookings,
      completedBookings
    });
  } catch (error) {
    console.error('Error fetching financial overview:', error);
    res.status(500).json({ 
      error: 'Failed to fetch financial overview',
      details: (error as Error).message 
    });
  }
});

// Get transactions
router.get('/api/finances/transactions', async (req, res) => {
  try {
    const transactions = await prisma.booking.findMany({
      take: 10, // Limit to 10 most recent transactions
      orderBy: {
        dateTime: 'desc'
      },
      include: {
        customer: true,
        serviceItems: true
      }
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: (error as Error).message 
    });
  }
});

// Get revenue graph data
router.get('/api/finances/revenue-graph', async (req, res) => {
  try {
    // Get last 6 months of data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5); // Get 6 months of data

    const bookings = await prisma.booking.findMany({
      where: {
        dateTime: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        dateTime: true,
        price: true
      }
    });

    // Process data for the graph
    const monthlyData = new Map();
    
    bookings.forEach(booking => {
      const monthKey = new Date(booking.dateTime).toLocaleString('default', { 
        year: 'numeric',
        month: 'short'
      });
      
      const currentAmount = monthlyData.get(monthKey) || 0;
      monthlyData.set(monthKey, currentAmount + booking.price);
    });

    // Convert to array format expected by the frontend
    const revenueData = Array.from(monthlyData.entries()).map(([month, amount]) => ({
      month,
      amount
    }));

    // Sort by date
    revenueData.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue graph data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch revenue graph data',
      details: (error as Error).message 
    });
  }
});


router.get('/api/finances/revenue-graph', async (req, res) => {
  try {
    const { timeFrame = 'month' } = req.query;
    let startDate = new Date();
    const endDate = new Date();

    // Set the date range based on the timeFrame
    switch (timeFrame) {
      case 'week':
        startDate.setDate(startDate.getDate() - 12 * 7); // Last 12 weeks
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 11); // Last 12 months
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 11); // Last 4 quarters (12 months)
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 4); // Last 5 years
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 11); // Default to last 12 months
    }

    // Reset the start date to the beginning of its period
    startDate.setHours(0, 0, 0, 0);
    
    const bookings = await prisma.booking.findMany({
      where: {
        dateTime: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        dateTime: true,
        price: true
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    let revenueData: { month: string; amount: number; }[] = [];

    // Process the data based on timeFrame
    if (timeFrame === 'week') {
      // Group by week
      const weeklyData = new Map();
      
      bookings.forEach(booking => {
        const date = new Date(booking.dateTime);
        const weekNumber = getWeekNumber(date);
        const weekKey = `Week ${weekNumber}`;
        
        weeklyData.set(weekKey, (weeklyData.get(weekKey) || 0) + booking.price);
      });

      revenueData = Array.from(weeklyData.entries()).map(([week, amount]) => ({
        month: week, // Using 'month' key for consistency with frontend
        amount: amount as number
      }));

    } else if (timeFrame === 'quarter') {
      // Group by quarter
      const quarterlyData = new Map();
      
      bookings.forEach(booking => {
        const date = new Date(booking.dateTime);
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        const quarterKey = `Q${quarter} ${date.getFullYear()}`;
        
        quarterlyData.set(quarterKey, (quarterlyData.get(quarterKey) || 0) + booking.price);
      });

      revenueData = Array.from(quarterlyData.entries()).map(([quarter, amount]) => ({
        month: quarter,
        amount: amount as number
      }));

    } else if (timeFrame === 'year') {
      // Group by year
      const yearlyData = new Map();
      
      bookings.forEach(booking => {
        const year = new Date(booking.dateTime).getFullYear().toString();
        yearlyData.set(year, (yearlyData.get(year) || 0) + booking.price);
      });

      revenueData = Array.from(yearlyData.entries()).map(([year, amount]) => ({
        month: year,
        amount: amount as number
      }));

    } else {
      // Monthly grouping (default)
      const monthlyData = new Map();
      
      bookings.forEach(booking => {
        const date = new Date(booking.dateTime);
        const monthKey = date.toLocaleString('default', { 
          year: 'numeric',
          month: 'short'
        });
        
        monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + booking.price);
      });

      revenueData = Array.from(monthlyData.entries()).map(([month, amount]) => ({
        month,
        amount: amount as number
      }));
    }

    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue graph data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch revenue graph data',
      details: (error as Error).message 
    });
  }
});

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

router.get('/api/finances/revenue-data', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    // Transform the data to include all required fields
    const transformedData = bookings.map(booking => ({
      month: new Date(booking.dateTime).toLocaleString('default', { 
        year: 'numeric',
        month: 'short'
      }),
      amount: booking.price,
      cleaningType: booking.cleaningType,
      customerId: booking.customer.id.toString()
    }));

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({
      error: 'Failed to fetch revenue data',
      details: (error as Error).message
    });
  }
});

// Get service metrics
router.get('/api/finances/service-metrics', async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      select: {
        cleaningType: true,
        price: true,
      }
    });

    const metrics = bookings.reduce((acc: Record<string, { revenue: number; count: number }>, booking) => {
      if (!acc[booking.cleaningType]) {
        acc[booking.cleaningType] = { revenue: 0, count: 0 };
      }
      acc[booking.cleaningType].revenue += booking.price;
      acc[booking.cleaningType].count += 1;
      return acc;
    }, {});

    const result = Object.entries(metrics).map(([name, stats]) => ({
      name,
      revenue: stats.revenue,
      count: stats.count,
      averageValue: stats.revenue / stats.count
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching service metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch service metrics',
      details: (error as Error).message
    });
  }
});


// Test credentials endpoint
router.get('/api/test-credentials', (req, res) => {
  const credentials = {
    clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 15) + '...',
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    hasRefreshToken: !!process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
    refreshTokenLength: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN?.length,
    calendarId: process.env.GOOGLE_CALENDAR_ID
  };
  res.json(credentials);
});


export default router;