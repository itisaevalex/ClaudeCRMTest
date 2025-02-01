import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';

const router = Router();
const customerController = new CustomerController();

router.get('/', customerController.getAllCustomers);
router.get('/search', customerController.searchCustomers);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

export default router;