import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { XeroClient } from 'xero-node';

// Define user type for type assertions
interface User {
  id: number;
  email: string;
  name?: string;
}

// Define interface for Xero report rows
interface XeroReportRow {
  RowType?: string;
  Title?: string;
  Cells?: Array<{
    Value?: string | number;
    Attributes?: Record<string, string>;
  }>;
  Rows?: XeroReportRow[];
}

const prisma = new PrismaClient();

// Xero OAuth configuration
const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID;
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;
const XERO_REDIRECT_URI = process.env.XERO_CALLBACK_URL || `${process.env.FRONTEND_URL}/dashboard/xero/callback`;
const XERO_SCOPES = 'accounting.transactions.read accounting.reports.read accounting.reports.tenninetynine.read accounting.journals.read accounting.settings.read accounting.contacts.read accounting.attachments.read accounting.budgets.read';

// Initialize Xero client
const xero = new XeroClient({
  clientId: XERO_CLIENT_ID || '',
  clientSecret: XERO_CLIENT_SECRET || '',
  redirectUris: [XERO_REDIRECT_URI],
  scopes: XERO_SCOPES.split(' '),
});

// Check if user has connected to Xero
export const checkXeroConnection = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const userId = user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user has a Xero account
    const xeroAccount = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: 'xero',
      },
    });

    return res.status(200).json({ 
      connected: !!xeroAccount,
      // Include additional connection details if needed
      connectionDetails: xeroAccount ? {
        connectedAt: xeroAccount.expires_at ? new Date(xeroAccount.expires_at * 1000) : null,
      } : null
    });
  } catch (error) {
    console.error('Error checking Xero connection:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Initiate Xero OAuth flow
export const initiateXeroAuth = async (req: Request, res: Response) => {
  try {
    if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
      return res.status(500).json({ message: 'Xero API credentials not configured' });
    }

    const user = req.user as User | undefined;
    const userId = user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Generate a random state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state in session or database for verification later
    // This is a simplified example - in production, you'd want to store this securely
    (req.session as any).xeroState = state;
    (req.session as any).xeroUserId = userId;
    
    // Construct the authorization URL
    const authUrl = new URL('https://login.xero.com/identity/connect/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', XERO_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', XERO_REDIRECT_URI);
    authUrl.searchParams.append('scope', XERO_SCOPES);
    authUrl.searchParams.append('state', state);
    
    return res.status(200).json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error('Error initiating Xero auth:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Handle Xero OAuth callback
export const handleXeroCallback = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    
    // Verify state to prevent CSRF attacks
    if (!state || state !== (req.session as any).xeroState) {
      return res.status(400).json({ message: 'Invalid state parameter' });
    }
    
    const userIdFromSession = (req.session as any).xeroUserId;
    
    if (!userIdFromSession) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Convert userId to number to match Prisma schema
    const userId = Number(userIdFromSession);
    
    if (isNaN(userId)) {
      console.error('Invalid userId:', userIdFromSession);
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://identity.xero.com/connect/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: XERO_REDIRECT_URI,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString('base64')}`,
        },
      }
    );
    
    const { 
      access_token, 
      refresh_token, 
      expires_in, 
      id_token, 
      scope 
    } = tokenResponse.data;
    
    // Get Xero user info to get the providerAccountId
    console.log('Getting Xero user info...');
    let xeroUserId;
    try {
      const userInfoResponse = await axios.get('https://api.xero.com/api.xro/2.0/Users', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
        },
      });
      
      console.log('Xero user info response:', JSON.stringify(userInfoResponse.data, null, 2));
      
      if (userInfoResponse.data && userInfoResponse.data.Users && userInfoResponse.data.Users.length > 0) {
        xeroUserId = userInfoResponse.data.Users[0]?.UserID;
        console.log('Xero user ID:', xeroUserId);
      } else {
        console.log('No users found in Xero response, using token as ID');
        // If we can't get the user ID from the API, use a hash of the access token as the ID
        xeroUserId = Buffer.from(access_token).toString('base64').substring(0, 20);
      }
    } catch (error) {
      console.error('Error getting Xero user info:', error);
      // If we can't get the user ID from the API, use a hash of the access token as the ID
      xeroUserId = Buffer.from(access_token).toString('base64').substring(0, 20);
    }
    
    // Calculate token expiration
    const expiresAt = Math.floor(Date.now() / 1000) + expires_in;
    
    // Store tokens in database
    console.log('Storing Xero tokens in database...');
    console.log('User ID:', userId);
    console.log('Xero User ID:', xeroUserId);
    
    try {
      const result = await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: 'xero',
            providerAccountId: xeroUserId,
          },
        },
        update: {
          access_token,
          refresh_token,
          expires_at: expiresAt,
          token_type: 'Bearer',
          scope,
          id_token,
        },
        create: {
          userId: userId,
          type: 'oauth',
          provider: 'xero',
          providerAccountId: xeroUserId,
          access_token,
          refresh_token,
          expires_at: expiresAt,
          token_type: 'Bearer',
          scope,
          id_token,
        },
      });
      
      console.log('Xero account stored successfully:', result);
    } catch (error) {
      console.error('Error storing Xero account:', error);
      throw error;
    }
    
    // Clear session data
    delete (req.session as any).xeroState;
    delete (req.session as any).xeroUserId;
    
    // Redirect back to dashboard
    return res.redirect(`${process.env.FRONTEND_URL}/dashboard?xero=connected`);
  } catch (error) {
    console.error('Error handling Xero callback:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Disconnect Xero
export const disconnectXero = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const userId = user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Delete Xero account connection
    await prisma.account.deleteMany({
      where: {
        userId: userId,
        provider: 'xero',
      },
    });
    
    return res.status(200).json({ message: 'Xero disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Xero:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get Xero Customers
export const getXeroCustomers = async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const userId = user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get Xero account for this user
    const xeroAccount = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: 'xero',
      },
    });

    if (!xeroAccount) {
      return res.status(404).json({ message: 'No Xero connection found' });
    }

    // Using setTokenSet method - we only need to pass the required properties
    await xero.setTokenSet({
      access_token: xeroAccount.access_token || '',
      refresh_token: xeroAccount.refresh_token || '',
      id_token: xeroAccount.id_token || '',
      token_type: 'Bearer',
      scope: xeroAccount.scope || '',
      expires_at: xeroAccount.expires_at ? Number(xeroAccount.expires_at) : 0,
    });
    
    // Get tenants (organizations)
    const tenants = await xero.updateTenants();
    
    if (!tenants || tenants.length === 0) {
      return res.status(404).json({ message: 'No Xero organizations found' });
    }
    
    const activeTenant = tenants[0]; // Use the first tenant

    // Use the Xero SDK to get contacts (customers)
    const response = await xero.accountingApi.getContacts(
      activeTenant.tenantId
    );
    
    // After using the SDK, check if we need to update the tokens in our database
    const currentTokenSet = await xero.readTokenSet();
    if (currentTokenSet && currentTokenSet.access_token !== xeroAccount.access_token) {
      // Token has been refreshed by the SDK, update in our database
      await prisma.account.update({
        where: {
          id: xeroAccount.id,
        },
        data: {
          access_token: currentTokenSet.access_token,
          refresh_token: currentTokenSet.refresh_token,
          expires_at: currentTokenSet.expires_at,
        },
      });
    }
    
    // Return contacts in the expected format
    console.log('Xero contacts response:', JSON.stringify(response.body, null, 2));
    
    // Ensure we have the contacts in the expected format for the frontend
    // The frontend expects a property called "Contacts" with specific property capitalization
    const contacts = response.body.contacts || [];
    
    // Cast to any type for flexibility in response
    const normalizedContacts: any[] = contacts.map((contact: any) => {
      // Ensure consistent property capitalization
      return {
        ContactID: contact.contactID || contact.ContactID || '',
        Name: contact.name || contact.Name || '',
        EmailAddress: contact.emailAddress || contact.EmailAddress || '',
        Phones: Array.isArray(contact.phones || contact.Phones) 
          ? (contact.phones || contact.Phones).map((phone: any) => ({
              PhoneType: phone.phoneType || phone.PhoneType || '',
              PhoneNumber: phone.phoneNumber || phone.PhoneNumber || '',
              PhoneAreaCode: phone.phoneAreaCode || phone.PhoneAreaCode || '',
              PhoneCountryCode: phone.phoneCountryCode || phone.PhoneCountryCode || ''
            }))
          : [],
        Addresses: Array.isArray(contact.addresses || contact.Addresses)
          ? (contact.addresses || contact.Addresses).map((address: any) => ({
              AddressType: address.addressType || address.AddressType || '',
              AddressLine1: address.addressLine1 || address.AddressLine1 || '',
              City: address.city || address.City || '',
              Region: address.region || address.Region || '',
              PostalCode: address.postalCode || address.PostalCode || '',
              Country: address.country || address.Country || ''
            }))
          : []
      };
    });
    
    return res.status(200).json({
      Contacts: normalizedContacts
    });
  } catch (error) {
    console.error('Error getting Xero customers:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // If it's an API error from Xero, log additional details
      if ('response' in error && error.response) {
        console.error('Xero API response status:', (error.response as any).status);
        console.error('Xero API response data:', (error.response as any).data);
      }
    }
    
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Get Xero Monthly Financial Data
export const getXeroMonthlyFinancials = async (req: Request, res: Response) => {
  try {
    console.log('Starting getXeroMonthlyFinancials request');
    const user = req.user as User | undefined;
    const userId = user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get Xero account for this user
    const xeroAccount = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: 'xero',
      },
    });

    if (!xeroAccount) {
      return res.status(404).json({ message: 'No Xero connection found' });
    }

    // Using setTokenSet method - we only need to pass the required properties
    await xero.setTokenSet({
      access_token: xeroAccount.access_token || '',
      refresh_token: xeroAccount.refresh_token || '',
      id_token: xeroAccount.id_token || '',
      token_type: 'Bearer',
      scope: xeroAccount.scope || '',
      expires_at: xeroAccount.expires_at ? Number(xeroAccount.expires_at) : 0,
    });
    
    // Get tenants (organizations)
    const tenants = await xero.updateTenants();
    console.log('Retrieved tenants:', tenants ? tenants.length : 0);
    
    if (!tenants || tenants.length === 0) {
      return res.status(404).json({ message: 'No Xero organizations found' });
    }
    
    const activeTenant = tenants[0]; // Use the first tenant
    console.log('Using tenant:', activeTenant.tenantId);
    
    // First, check if the organization has any transactions at all
    try {
      console.log('Checking if organization has any transactions...');
      const orgInfo = await xero.accountingApi.getOrganisations(activeTenant.tenantId);
      console.log('Organization info:', JSON.stringify(orgInfo.body, null, 2));
      
      // Get some recent bank transactions to see if there's any financial data
      const bankTransactions = await xero.accountingApi.getBankTransactions(
        activeTenant.tenantId,
        undefined, // If-Modified-Since header
        undefined, // Where clause
        undefined, // Order parameter
        5 // Page size
      );
      
      console.log(`Found ${bankTransactions.body.bankTransactions?.length || 0} recent bank transactions`);
      
      if (!bankTransactions.body.bankTransactions || bankTransactions.body.bankTransactions.length === 0) {
        console.log('No bank transactions found, organization may not have financial data yet');
        // Return empty data rather than trying to fetch a P&L report
        return res.status(200).json({
          months: [],
          revenue: [],
          expenses: [],
          grossProfit: []
        });
      }
    } catch (error) {
      console.log('Error checking transactions, continuing anyway:', error instanceof Error ? error.message : error);
      // Continue even if this check fails
    }
    
    // Get the start date (12 months ago from today)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    
    // Format dates as required by Xero API (YYYY-MM-DD)
    const formattedStartDate = startDate.toISOString().split('T')[0];
    const formattedEndDate = endDate.toISOString().split('T')[0];
    console.log(`Date range: ${formattedStartDate} to ${formattedEndDate}`);

    // Use the Xero SDK to get profit and loss report
    console.log('Calling Xero API for P&L report...');
    
    // First try getting a trial balance which is usually simpler and more available
    try {
      console.log('Getting trial balance report first...');
      const trialBalanceResponse = await xero.accountingApi.getReportTrialBalance(
        activeTenant.tenantId,
        formattedEndDate, // Date
        undefined // Payments only
      );
      
      console.log('Got trial balance:', JSON.stringify(trialBalanceResponse.body, null, 2));
      
      // Check if there's any data in the trial balance
      if (!trialBalanceResponse.body.reports || 
          !trialBalanceResponse.body.reports[0] ||
          !trialBalanceResponse.body.reports[0].rows ||
          trialBalanceResponse.body.reports[0].rows.length <= 1) {
        console.log('Trial balance has no data, returning empty arrays');
        return res.status(200).json({
          months: [],
          revenue: [],
          expenses: [],
          grossProfit: []
        });
      }
    } catch (error) {
      console.error('Error getting trial balance:', error instanceof Error ? error.message : error);
      // Continue even if this fails
    }
    
    // Try with quarters instead of months
    console.log('Trying with 3 quarters...');
    let response;
    
    // Try several approaches to get the P&L report
    try {
      // Approach 1: Simpler approach with fewer parameters
      response = await xero.accountingApi.getReportProfitAndLoss(
        activeTenant.tenantId,
        undefined, // no from date
        undefined, // no to date
        undefined, // no periods
        undefined, // no timeframe
        undefined, // trackingCategoryID
        undefined, // trackingCategoryID2
        undefined, // trackingOptionID
        undefined, // trackingOptionID2
        undefined  // standardLayout
      );
      console.log('Got P&L response using approach 1');
    } catch (error) {
      console.error('Approach 1 failed:', error instanceof Error ? error.message : error);
      
      try {
        // Approach 2: Try with just the date range
        response = await xero.accountingApi.getReportProfitAndLoss(
          activeTenant.tenantId,
          formattedStartDate,
          formattedEndDate
        );
        console.log('Got P&L response using approach 2');
      } catch (error) {
        console.error('Approach 2 failed:', error instanceof Error ? error.message : error);
        
        try {
          // Approach 3: Try with standard layout true
          response = await xero.accountingApi.getReportProfitAndLoss(
            activeTenant.tenantId,
            formattedStartDate,
            formattedEndDate,
            undefined, // no periods
            undefined, // no timeframe
            undefined, // trackingCategoryID
            undefined, // trackingCategoryID2
            undefined, // trackingOptionID
            undefined, // trackingOptionID2
            true  // standardLayout
          );
          console.log('Got P&L response using approach 3');
        } catch (error) {
          console.error('Approach 3 failed:', error instanceof Error ? error.message : error);
          
          // If all approaches fail, we can't get P&L data
          console.error('All P&L report attempts failed, returning empty arrays');
          return res.status(200).json({
            months: [],
            revenue: [],
            expenses: [],
            grossProfit: []
          });
        }
      }
    }
    
    console.log('Got P&L report response');
    
    // After using the SDK, check if we need to update the tokens in our database
    const currentTokenSet = await xero.readTokenSet();
    if (currentTokenSet && currentTokenSet.access_token !== xeroAccount.access_token) {
      // Token has been refreshed by the SDK, update in our database
      console.log('Updating refreshed tokens in database');
      await prisma.account.update({
        where: {
          id: xeroAccount.id,
        },
        data: {
          access_token: currentTokenSet.access_token,
          refresh_token: currentTokenSet.refresh_token,
          expires_at: currentTokenSet.expires_at,
        },
      });
    }
    
    // Extract report data
    const report = response.body.reports?.[0];
    console.log('Parsing P&L report data');
    
    // Log the entire report for debugging
    console.log('Full report data:', JSON.stringify(response.body, null, 2));
    
    if (!report || !report.rows) {
      console.log('No report rows found in response');
      return res.status(200).json({
        months: [],
        revenue: [],
        expenses: [],
        grossProfit: []
      });
    }
    
    console.log('Number of rows in report:', report.rows.length);
    
    // Log all row titles to help with debugging
    console.log('All row titles:', report.rows.map((row: any) => row.title || 'undefined').join(', '));
    
    // Extract revenue, expenses, and gross profit by month
    const months: string[] = [];
    const revenue: number[] = [];
    const expenses: number[] = [];
    const grossProfit: number[] = [];
    
    // Find the rows containing the data we need - search with more variants
    let revenueRow = report.rows.find((row: any) => 
      row.title === 'Revenue' || row.title === 'Income' || row.title === 'Total Income' || 
      row.title === 'Operating Income' || row.title === 'Total Operating Income');
    
    let expensesRow = report.rows.find((row: any) => 
      row.title === 'Expenses' || row.title === 'Total Expenses' || row.title === 'Less Total Expenses' || 
      row.title === 'Operating Expenses' || row.title === 'Total Operating Expenses' || row.title === 'Less Operating Expenses');
    
    let grossProfitRow = report.rows.find((row: any) => 
      row.title === 'Gross Profit' || row.title === 'Net Income' || 
      row.title === 'Net Profit' || row.title === 'Operating Profit');
    
    console.log('Found rows:', {
      revenueRow: revenueRow?.title || 'Not found',
      expensesRow: expensesRow?.title || 'Not found',
      grossProfitRow: grossProfitRow?.title || 'Not found'
    });
    
    // Fallback: if we can't find the specific rows, try to use the summary sections
    // or look for rows containing the words "revenue", "expense", and "profit"
    if (!revenueRow) {
      console.log('Trying fallback for revenue row...');
      revenueRow = report.rows.find((row: any) => 
        row.title && (
          row.title.toLowerCase().includes('revenue') || 
          row.title.toLowerCase().includes('income') || 
          row.title.toLowerCase().includes('sales')
        )
      );
    }
    
    if (!expensesRow) {
      console.log('Trying fallback for expenses row...');
      expensesRow = report.rows.find((row: any) => 
        row.title && (
          row.title.toLowerCase().includes('expense') || 
          row.title.toLowerCase().includes('less')
        )
      );
    }
    
    if (!grossProfitRow) {
      console.log('Trying fallback for gross profit row...');
      grossProfitRow = report.rows.find((row: any) => 
        row.title && (
          row.title.toLowerCase().includes('profit') || 
          row.title.toLowerCase().includes('net')
        )
      );
    }
    
    console.log('After fallback, found rows:', {
      revenueRow: revenueRow?.title || 'Not found',
      expensesRow: expensesRow?.title || 'Not found',
      grossProfitRow: grossProfitRow?.title || 'Not found'
    });
    
    // Get the month names from the column headers
    const headerRow = report.rows[0];
    if (headerRow && headerRow.cells) {
      for (let i = 1; i < headerRow.cells.length - 1; i++) { // Skip first (title) and last (total) columns
        if (headerRow.cells[i].value) {
          months.push(String(headerRow.cells[i].value));
        }
      }
    }
    
    console.log('Extracted months:', months);
    
    // Extract data for revenue
    if (revenueRow && revenueRow.cells) {
      for (let i = 1; i < revenueRow.cells.length - 1; i++) { // Skip first (title) and last (total) columns
        const value = parseFloat(String(revenueRow.cells[i].value).replace(/[^0-9.-]+/g, '') || '0');
        revenue.push(value);
      }
    }
    
    // Extract data for expenses (as positive values for graphing)
    if (expensesRow && expensesRow.cells) {
      for (let i = 1; i < expensesRow.cells.length - 1; i++) { // Skip first (title) and last (total) columns
        // Convert expenses to positive values for visualization
        const value = parseFloat(String(expensesRow.cells[i].value).replace(/[^0-9.-]+/g, '') || '0');
        expenses.push(Math.abs(value));
      }
    }
    
    // Extract data for gross profit
    if (grossProfitRow && grossProfitRow.cells) {
      for (let i = 1; i < grossProfitRow.cells.length - 1; i++) { // Skip first (title) and last (total) columns
        const value = parseFloat(String(grossProfitRow.cells[i].value).replace(/[^0-9.-]+/g, '') || '0');
        grossProfit.push(value);
      }
    }
    
    console.log('Extracted data:', {
      monthsCount: months.length,
      revenueCount: revenue.length,
      expensesCount: expenses.length,
      grossProfitCount: grossProfit.length
    });
    
    // Return formatted financial data
    return res.status(200).json({
      months,
      revenue,
      expenses,
      grossProfit
    });
  } catch (error) {
    console.error('Error getting Xero monthly financials:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // If it's an API error from Xero, log additional details
      if ('response' in error && error.response) {
        console.error('Xero API response status:', (error.response as any).status);
        console.error('Xero API response data:', (error.response as any).data);
      }
    }
    
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Get top 5 customers by invoice amount
export const getTopInvoicedCustomers = async (req: Request, res: Response) => {
  try {
    console.log('Starting getTopInvoicedCustomers request');
    const user = req.user as User | undefined;
    const userId = user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get Xero account for this user
    const xeroAccount = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: 'xero',
      },
    });

    if (!xeroAccount) {
      return res.status(404).json({ message: 'No Xero connection found' });
    }

    // Using setTokenSet method - we only need to pass the required properties
    await xero.setTokenSet({
      access_token: xeroAccount.access_token || '',
      refresh_token: xeroAccount.refresh_token || '',
      id_token: xeroAccount.id_token || '',
      token_type: 'Bearer',
      scope: xeroAccount.scope || '',
      expires_at: xeroAccount.expires_at ? Number(xeroAccount.expires_at) : 0,
    });
    
    // Get tenants (organizations)
    const tenants = await xero.updateTenants();
    
    if (!tenants || tenants.length === 0) {
      return res.status(404).json({ message: 'No Xero organizations found' });
    }
    
    const activeTenant = tenants[0]; // Use the first tenant

    // Use the Xero SDK to get invoices
    const invoices = await xero.accountingApi.getInvoices(activeTenant.tenantId);

    // Update tokens if refreshed
    const currentTokenSet = await xero.readTokenSet();
    if (currentTokenSet && currentTokenSet.access_token !== xeroAccount.access_token) {
      await prisma.account.update({
        where: { id: xeroAccount.id },
        data: {
          access_token: currentTokenSet.access_token,
          refresh_token: currentTokenSet.refresh_token,
          expires_at: currentTokenSet.expires_at,
        },
      });
    }
    
    // Get contacts (customers)
    const contacts = await xero.accountingApi.getContacts(activeTenant.tenantId);
    
    // Create a map of contacts by ID for easier lookup
    const contactsMap = new Map();
    contacts.body.contacts?.forEach(contact => {
      contactsMap.set(contact.contactID, contact);
    });
    
    // Calculate total invoiced amount per customer
    const customerTotals = new Map<string, { 
      contactID: string,
      name: string,
      email: string | undefined,
      phone: string | undefined,
      totalAmount: number,
      invoiceCount: number
    }>();
    
    if (invoices.body.invoices) {
      invoices.body.invoices.forEach(invoice => {
        // Check valid status and contact exists
        if (invoice.contact && invoice.contact.contactID) {
          const contactID = invoice.contact.contactID;
          const contact = contactsMap.get(contactID);
          
          if (contact) {
            const totalAmount = parseFloat(invoice.total?.toString() || '0');
            const customerData = customerTotals.get(contactID) || {
              contactID,
              name: contact.name || 'Unknown',
              email: contact.emailAddress,
              phone: contact.phones?.[0]?.phoneNumber,
              totalAmount: 0,
              invoiceCount: 0
            };
            
            customerData.totalAmount += totalAmount;
            customerData.invoiceCount += 1;
            customerTotals.set(contactID, customerData);
          }
        }
      });
    }
    
    // Convert to array and sort by total amount
    const topCustomers = Array.from(customerTotals.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
    
    console.log(`Found ${topCustomers.length} top customers`);
    
    return res.status(200).json({
      customers: topCustomers
    });
  } catch (error) {
    console.error('Error getting top invoiced customers:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      if ('response' in error && error.response) {
        console.error('Xero API response status:', (error.response as any).status);
        console.error('Xero API response data:', (error.response as any).data);
      }
    }
    
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};