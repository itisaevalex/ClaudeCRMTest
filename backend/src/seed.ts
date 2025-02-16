// seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  try {
    // Create a booking for existing customer with ID 3
    const booking = await prisma.booking.create({
      data: {
        area: 100,
        dateTime: new Date('2024-12-18T20:36:15.000Z'),
        price: 1500,
        cleaningType: 'Home',
        customerId: 3,
        reminderSent: false
      }
    });

    console.log('Created new booking:', booking);

  } catch (error) {
    console.error('Error creating booking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the seed function
seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });