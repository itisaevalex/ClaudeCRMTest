import { Request, Response } from 'express';
import { FinanceService } from '../services/financeService';

export class FinanceController {
  private financeService: FinanceService;

  constructor() {
    this.financeService = new FinanceService();
  }

  getOverview = async (_req: Request, res: Response) => {
    try {
      const overview = await this.financeService.getOverview();
      res.json(overview);
    } catch (error) {
      console.error('Error fetching financial overview:', error);
      res.status(500).json({ error: 'Failed to fetch financial overview' });
    }
  };

  getTransactions = async (_req: Request, res: Response) => {
    try {
      const transactions = await this.financeService.getTransactions();
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  };

  getRevenueGraph = async (req: Request, res: Response) => {
    try {
      const { timeFrame = 'month' } = req.query;
      const revenueData = await this.financeService.getRevenueGraph(timeFrame as string);
      res.json(revenueData);
    } catch (error) {
      console.error('Error fetching revenue graph data:', error);
      res.status(500).json({ error: 'Failed to fetch revenue graph data' });
    }
  };

  getRevenueData = async (_req: Request, res: Response) => {
    try {
      const revenueData = await this.financeService.getRevenueData();
      res.json(revenueData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      res.status(500).json({ error: 'Failed to fetch revenue data' });
    }
  };

  getServiceMetrics = async (_req: Request, res: Response) => {
    try {
      const metrics = await this.financeService.getServiceMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching service metrics:', error);
      res.status(500).json({ error: 'Failed to fetch service metrics' });
    }
  };
}