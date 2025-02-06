// src/routes/communicationRoutes.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { CommunicationInput } from '../types/models';
import { EmailService } from '../services/emailService';

const router = Router();
const prisma = new PrismaClient();
const emailService = new EmailService();

// Get all communications
router.get('/', async (req, res) => {
  try {
    const communications = await prisma.communication.findMany({
      include: {
        customer: true,
        booking: true
      },
      orderBy: {
        sentAt: 'desc'
      }
    });
    
    res.json(communications);
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// Get communications by customer
router.get('/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const communications = await prisma.communication.findMany({
      where: {
        customerId: parseInt(customerId)
      },
      include: {
        booking: true
      },
      orderBy: {
        sentAt: 'desc'
      }
    });
    
    res.json(communications);
  } catch (error) {
    console.error('Error fetching customer communications:', error);
    res.status(500).json({ error: 'Failed to fetch customer communications' });
  }
});

// Create new communication
router.post('/', async (req, res) => {
  try {
    const communicationData: CommunicationInput = req.body;
    
    const communication = await prisma.communication.create({
      data: {
        type: communicationData.type,
        subject: communicationData.subject,
        content: communicationData.content,
        customer: {
          connect: { id: communicationData.customerId }
        },
        ...(communicationData.bookingId && {
          booking: {
            connect: { id: communicationData.bookingId }
          }
        })
      },
      include: {
        customer: true,
        booking: true
      }
    });

    // If it's an email, send it
    if (communication.type === 'email') {
      await emailService.sendEmail({
        to: communication.customer.email,
        subject: communication.subject,
        html: communication.content
      });

      // Update status to sent
      await prisma.communication.update({
        where: { id: communication.id },
        data: { status: 'sent' }
      });
    }

    res.status(201).json(communication);
  } catch (error) {
    console.error('Error creating communication:', error);
    res.status(500).json({ 
      error: 'Failed to create communication',
      details: (error as Error).message
    });
  }
});

// Get communication statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalEmails, totalSMS, recentCommunications] = await Promise.all([
      prisma.communication.count({
        where: { type: 'email' }
      }),
      prisma.communication.count({
        where: { type: 'sms' }
      }),
      prisma.communication.findMany({
        take: 10,
        orderBy: { sentAt: 'desc' },
        include: {
          customer: true,
          booking: true
        }
      })
    ]);

    const stats = {
      totalEmails,
      totalSMS,
      recentCommunications,
      deliveryRate: await calculateDeliveryRate()
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching communication stats:', error);
    res.status(500).json({ error: 'Failed to fetch communication statistics' });
  }
});

// Helper function to calculate delivery rate
async function calculateDeliveryRate() {
  const [total, sent] = await Promise.all([
    prisma.communication.count(),
    prisma.communication.count({
      where: { status: 'sent' }
    })
  ]);
  
  return total > 0 ? (sent / total) * 100 : 0;
}

// Get failed communications
router.get('/failed', async (req, res) => {
  try {
    const failedCommunications = await prisma.communication.findMany({
      where: { status: 'failed' },
      include: {
        customer: true,
        booking: true
      },
      orderBy: { sentAt: 'desc' }
    });
    
    res.json(failedCommunications);
  } catch (error) {
    console.error('Error fetching failed communications:', error);
    res.status(500).json({ error: 'Failed to fetch failed communications' });
  }
});

// Retry failed communication
router.post('/retry/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const communication = await prisma.communication.findUnique({
      where: { id: parseInt(id) },
      include: { customer: true }
    });

    if (!communication) {
      return res.status(404).json({ error: 'Communication not found' });
    }

    if (communication.type === 'email') {
      await emailService.sendEmail({
        to: communication.customer.email,
        subject: communication.subject,
        html: communication.content
      });

      const updatedCommunication = await prisma.communication.update({
        where: { id: parseInt(id) },
        data: { status: 'sent' },
        include: {
          customer: true,
          booking: true
        }
      });

      res.json(updatedCommunication);
    } else {
      res.status(400).json({ error: 'Retry only supported for email communications' });
    }
  } catch (error) {
    console.error('Error retrying communication:', error);
    res.status(500).json({ 
      error: 'Failed to retry communication',
      details: (error as Error).message
    });
  }
});

export default router;