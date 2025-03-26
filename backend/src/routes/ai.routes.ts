import express from 'express';
import { generateReport, getUserReports, getReportById, deleteReport, runReport, modifyReport, answerReportQuestion } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Test endpoint - no authentication required
router.get('/test', (req, res) => {
  console.log('AI routes test endpoint hit');
  res.status(200).json({ message: 'AI routes are working' });
});

// Generate a report from a chat query
router.post('/reports', authenticate as unknown as express.RequestHandler, generateReport as unknown as express.RequestHandler);

// Get all reports for a user
router.get('/reports/user/:userId', authenticate as unknown as express.RequestHandler, getUserReports as unknown as express.RequestHandler);

// Get a specific report
router.get('/reports/:id', authenticate as unknown as express.RequestHandler, getReportById as unknown as express.RequestHandler);

// Run a report (execute its API code)
router.get('/reports/:id/run', authenticate as unknown as express.RequestHandler, runReport as unknown as express.RequestHandler);

// Delete a report
router.delete('/reports/:id', authenticate as unknown as express.RequestHandler, deleteReport as unknown as express.RequestHandler);

// Modify a report
router.put('/reports/:id/modify', authenticate as unknown as express.RequestHandler, modifyReport as unknown as express.RequestHandler);

// Ask a question about a report
router.post('/reports/:id/ask', authenticate as unknown as express.RequestHandler, answerReportQuestion as unknown as express.RequestHandler);

export default router; 