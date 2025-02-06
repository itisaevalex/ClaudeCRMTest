import { Router } from 'express';
import { FinanceController } from '../controllers/financeController';

const router = Router();
const financeController = new FinanceController();

router.get('/overview', financeController.getOverview);
router.get('/transactions', financeController.getTransactions);
router.get('/revenue-graph', financeController.getRevenueGraph);
router.get('/revenue-data', financeController.getRevenueData);
router.get('/service-metrics', financeController.getServiceMetrics);

export default router;