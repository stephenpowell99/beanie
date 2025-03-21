import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

// Define user type for type assertions
interface User {
  id: number;
  email: string;
  name?: string;
}

const prisma = new PrismaClient();

// Xero OAuth configuration
const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID;
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;
const XERO_REDIRECT_URI = process.env.XERO_CALLBACK_URL || `${process.env.FRONTEND_URL}/dashboard/xero/callback`;
const XERO_SCOPES = 'accounting.transactions.read accounting.reports.read accounting.reports.tenninetynine.read accounting.journals.read accounting.settings.read accounting.contacts.read accounting.attachments.read accounting.budgets.read';

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

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (xeroAccount.expires_at && xeroAccount.expires_at < now) {
      // Token is expired, need to refresh
      try {
        // Refresh token
        const tokenResponse = await axios.post('https://identity.xero.com/connect/token', 
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: xeroAccount.refresh_token as string,
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
          expires_in
        } = tokenResponse.data;
        
        // Calculate new expiration
        const expiresAt = Math.floor(Date.now() / 1000) + expires_in;
        
        // Update tokens in database
        await prisma.account.update({
          where: {
            id: xeroAccount.id,
          },
          data: {
            access_token,
            refresh_token,
            expires_at: expiresAt,
          },
        });
        
        // Use new access token
        xeroAccount.access_token = access_token;
      } catch (error) {
        console.error('Error refreshing token:', error);
        return res.status(401).json({ message: 'Xero authentication expired' });
      }
    }

    // Get list of tenants (organizations)
    const tenantsResponse = await axios.get('https://api.xero.com/connections', {
      headers: {
        'Authorization': `Bearer ${xeroAccount.access_token}`,
        'Accept': 'application/json',
      },
    });

    if (!tenantsResponse.data || tenantsResponse.data.length === 0) {
      return res.status(404).json({ message: 'No Xero organizations found' });
    }

    // Use first tenant ID (most applications just use the first organization)
    const tenantId = tenantsResponse.data[0].tenantId;

    // Get customers from Xero API
    const customersResponse = await axios.get('https://api.xero.com/api.xro/2.0/Contacts', {
      headers: {
        'Authorization': `Bearer ${xeroAccount.access_token}`,
        'Accept': 'application/json',
        'Xero-Tenant-Id': tenantId,
      },
    });
    
    // Return customer data
    return res.status(200).json(customersResponse.data);
  } catch (error) {
    console.error('Error getting Xero customers:', error);
    return res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};