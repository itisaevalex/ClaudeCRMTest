import { PrismaClient } from '@prisma/client';

export class FinanceService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getOverview() {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [monthlyBookings, upcomingBookings, completedBookings, totalRevenue] = await Promise.all([
      this.prisma.booking.count({
        where: {
          dateTime: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      this.prisma.booking.count({
        where: {
          dateTime: {
            gt: currentDate
          }
        }
      }),
      this.prisma.booking.count({
        where: {
          dateTime: {
            lt: currentDate
          }
        }
      }),
      this.prisma.booking.aggregate({
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

    return {
      monthlyRevenue: totalRevenue._sum.price || 0,
      totalBookings: monthlyBookings,
      upcomingBookings,
      completedBookings
    };
  }

  async getTransactions() {
    return this.prisma.booking.findMany({
      take: 10,
      orderBy: {
        dateTime: 'desc'
      },
      include: {
        customer: true
      }
    });
  }

  async getRevenueGraph(timeFrame: string) {
    const endDate = new Date();
    let startDate = new Date();

    switch (timeFrame) {
      case 'week':
        startDate.setDate(startDate.getDate() - 84); // Last 12 weeks
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
      default:
        startDate.setMonth(startDate.getMonth() - 11); // Default to last 12 months
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        dateTime: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    return this.aggregateRevenueData(bookings, timeFrame);
  }

  async getRevenueData() {
    const bookings = await this.prisma.booking.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        dateTime: 'asc'
      }
    });

    return bookings.map(booking => ({
      month: new Date(booking.dateTime).toLocaleString('default', {
        year: 'numeric',
        month: 'short'
      }),
      amount: booking.price,
      cleaningType: booking.cleaningType,
      customerId: booking.customer.id.toString()
    }));
  }

  async getServiceMetrics() {
    const bookings = await this.prisma.booking.findMany({
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

    return Object.entries(metrics).map(([name, stats]) => ({
      name,
      revenue: stats.revenue,
      count: stats.count,
      averageValue: stats.revenue / stats.count
    }));
  }

  private aggregateRevenueData(bookings: any[], timeFrame: string) {
    switch (timeFrame) {
      case 'week':
        return this.aggregateByWeek(bookings);
      case 'month':
        return this.aggregateByMonth(bookings);
      case 'quarter':
        return this.aggregateByQuarter(bookings);
      case 'year':
        return this.aggregateByYear(bookings);
      default:
        return this.aggregateByMonth(bookings);
    }
  }

  private aggregateByWeek(bookings: any[]) {
    // Implementation of weekly aggregation
    // Similar to your frontend logic but with actual data
    return this.groupByTimeUnit(bookings, 'week');
  }

  private aggregateByMonth(bookings: any[]) {
    return this.groupByTimeUnit(bookings, 'month');
  }

  private aggregateByQuarter(bookings: any[]) {
    return this.groupByTimeUnit(bookings, 'quarter');
  }

  private aggregateByYear(bookings: any[]) {
    return this.groupByTimeUnit(bookings, 'year');
  }

  private groupByTimeUnit(bookings: any[], unit: string) {
    const groupedData = new Map();

    bookings.forEach(booking => {
      const date = new Date(booking.dateTime);
      let key;

      switch (unit) {
        case 'week':
          const weekNumber = Math.ceil((date.getDate() - 1 + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
          key = `Week ${weekNumber}`;
          break;
        case 'month':
          key = date.toLocaleString('default', { year: 'numeric', month: 'short' });
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `Q${quarter} ${date.getFullYear()}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
      }

      if (!groupedData.has(key)) {
        groupedData.set(key, { month: key, amount: 0 });
      }
      groupedData.get(key).amount += booking.price;
    });

    return Array.from(groupedData.values());
  }
}