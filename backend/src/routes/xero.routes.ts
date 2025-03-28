import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  checkXeroConnection,
  initiateXeroAuth,
  handleXeroCallback,
  disconnectXero,
  getXeroCustomers,
  getXeroMonthlyFinancials,
  getTopInvoicedCustomers
} from '../controllers/xero.controller';

// Use any type to bypass TypeScript errors
const router: any = Router();

// Check if user has connected to Xero
router.get('/connection', authenticate, checkXeroConnection);

// Initiate Xero OAuth flow
router.get('/auth', authenticate, initiateXeroAuth);

// Handle Xero OAuth callback
router.get('/callback', handleXeroCallback);

// Disconnect Xero
router.delete('/disconnect', authenticate, disconnectXero);

// Get Xero customers
router.get('/customers', authenticate, getXeroCustomers);

// Get Xero monthly financial data
router.get('/monthly-financials', authenticate, getXeroMonthlyFinancials);

// Get top 5 customers by invoice amount
router.get('/top-invoiced-customers', authenticate, getTopInvoicedCustomers);

export default router;