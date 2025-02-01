import { PrismaClient, Customer, Booking } from '@prisma/client';

interface CustomerWithStats extends Customer {
  totalRevenue: number;
  lastService: Date | null;
  nextService: Date | null;
  totalBookings: number;
}

interface CustomerWithBookings extends Customer {
  bookings: Booking[];
}

export class CustomerService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getAllCustomers(): Promise<CustomerWithStats[]> {
    try {
      const customers = await this.prisma.customer.findMany({
        include: {
          bookings: {
            orderBy: {
              dateTime: 'desc'
            }
          }
        }
      });

      return this.addCustomerStats(customers);
    } catch (error) {
      console.error('Error in getAllCustomers:', error);
      throw error;
    }
  }

  async searchCustomers(query: string): Promise<CustomerWithStats[]> {
    try {
      const customers = await this.prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
            { address: { contains: query } }
          ]
        },
        include: {
          bookings: {
            orderBy: {
              dateTime: 'desc'
            }
          }
        }
      });

      return this.addCustomerStats(customers);
    } catch (error) {
      console.error('Error in searchCustomers:', error);
      throw error;
    }
  }

  private addCustomerStats(customers: CustomerWithBookings[]): CustomerWithStats[] {
    return customers.map(customer => {
      const totalRevenue = customer.bookings.reduce((sum, booking) => sum + booking.price, 0);
      const lastService = customer.bookings[0]?.dateTime || null;
      const nextService = customer.bookings.find(booking => new Date(booking.dateTime) > new Date())?.dateTime || null;
      const totalBookings = customer.bookings.length;

      return {
        ...customer,
        totalRevenue,
        lastService,
        nextService,
        totalBookings
      };
    });
  }

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.prisma.customer.create({
      data
    });
  }

  async updateCustomer(id: number, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>) {
    return this.prisma.customer.update({
      where: { id },
      data
    });
  }

  async deleteCustomer(id: number) {
    return this.prisma.customer.delete({
      where: { id }
    });
  }
}