// src/controllers/customerController.ts
import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  getAllCustomers = async (_req: Request, res: Response) => {
    try {
      const customers = await this.customerService.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  };

  searchCustomers = async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      if (typeof query !== 'string') {
        return res.status(400).json({ error: 'Invalid search query' });
      }
      const customers = await this.customerService.searchCustomers(query);
      res.json(customers);
    } catch (error) {
      console.error('Error searching customers:', error);
      res.status(500).json({ error: 'Failed to search customers' });
    }
  };

  createCustomer = async (req: Request, res: Response) => {
    try {
      const customer = await this.customerService.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Failed to create customer' });
    }
  };

  updateCustomer = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const customer = await this.customerService.updateCustomer(Number(id), req.body);
      res.json(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ error: 'Failed to update customer' });
    }
  };

  deleteCustomer = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.customerService.deleteCustomer(Number(id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ error: 'Failed to delete customer' });
    }
  };
}