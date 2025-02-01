import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { getWeekNumber } from '../utils/dateUtils';

const router = Router();
const prisma = new PrismaClient();

// Get financial overview
router.get('/overview', async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [monthlyBookings, upcomingBookings, completedBookings, monthlyRevenue] = await Promise.all([
      prisma.booking.count({
        where: {
          dateTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      prisma.booking.count({
        where: {
          dateTime: {
            gt: currentDate
          }
        }
      }),
      prisma.booking.count({
        where: {
          dateTime: {
            lt: currentDate
          }
        }
      }),
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
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await prisma.booking.findMany({
      take: 10,
      orderBy: {
        dateTime: 'desc'
      },
      include: {
        customer: true,
        serviceItems: true
      }
    });

    const formattedTransactions = transactions.map(booking => ({
      id: booking.id,
      customer: {
        name: booking.customer.name
      },
      dateTime: booking.dateTime.toISOString(),
      price: booking.price,
      cleaningType: booking.cleaningType,
      status: new Date(booking.dateTime) < new Date() ? 'completed' : 'pending'
    }));

    res.json(formattedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch transactions',
      details: (error as Error).message 
    });
  }
});

// Get revenue graph data with timeframe support
router.get('/revenue-graph', async (req, res) => {
  try {
    const { timeFrame = 'month' } = req.query;
    let startDate = new Date();
    const endDate = new Date();

    // Set date range based on timeFrame
    switch (timeFrame) {
      case 'week':
        startDate.setDate(startDate.getDate() - 12 * 7); // Last 12 weeks
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 11); // Last 12 months
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 11); // Last 4 quarters
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 4); // Last 5 years
        break;
    }

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
        price: true,
        cleaningType: true,
        customer: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    const groupedData = new Map();
    
    bookings.forEach(booking => {
      let key;
      const date = new Date(booking.dateTime);
      
      switch (timeFrame) {
        case 'week':
          key = `Week ${getWeekNumber(date)}`;
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `Q${quarter} ${date.getFullYear()}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
        default:
          key = date.toLocaleString('default', { 
            year: 'numeric',
            month: 'short'
          });
      }
      
      const existingData = groupedData.get(key) || {
        amount: 0,
        cleaningType: booking.cleaningType,
        customerId: booking.customer.id.toString()
      };
      
      existingData.amount += booking.price;
      groupedData.set(key, existingData);
    });

    const revenueData = Array.from(groupedData.entries()).map(([period, data]) => ({
      month: period,
      ...data
    }));

    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue graph data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch revenue graph data',
      details: (error as Error).message 
    });
  }
});

// Get service metrics
router.get('/service-metrics', async (req, res) => {
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

export default router;