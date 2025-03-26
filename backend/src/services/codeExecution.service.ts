import { VM } from 'vm2';
import { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { XeroClient } from 'xero-node';

const prisma = new PrismaClient();

// Xero OAuth configuration
const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID;
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET;
const XERO_SCOPES = 'accounting.transactions.read accounting.reports.read accounting.reports.tenninetynine.read accounting.journals.read accounting.settings.read accounting.contacts.read accounting.attachments.read accounting.budgets.read';

// Initialize Xero client
const xero = new XeroClient({
  clientId: XERO_CLIENT_ID || '',
  clientSecret: XERO_CLIENT_SECRET || '',
  redirectUris: [process.env.XERO_CALLBACK_URL || ''],
  scopes: XERO_SCOPES.split(' '),
});

/**
 * Executes API code in a sandboxed environment
 * The code must define a function named 'fetchReportData' that takes a context object
 * and returns data and metadata
 */
export const executeApiCode = async (apiCode: string, req: Request) => {
  try {
    // Get the user ID from the request
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return { error: 'User not authenticated' };
    }
    
    // Get the user's Xero account
    const xeroAccount = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'xero',
      },
    });
    
    if (!xeroAccount) {
      return { error: 'No Xero connection found. Please connect your Xero account first.' };
    }
    
    // Set up Xero tokens
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
      return { error: 'No Xero organizations found' };
    }
    
    const activeTenant = tenants[0]; // Use the first tenant
    
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

    // Create a sandboxed environment with limited capabilities
    const vm = new VM({
      timeout: 5000, // 5 second timeout
      sandbox: {
        // Provide limited access to necessary modules/functions
        fetch: async (url: string, options: any) => {
          console.log(`[Sandbox] Fetch request to: ${url}`);
          console.log(`[Sandbox] Fetch headers:`, JSON.stringify(options?.headers || {}));
          
          try {
            const response = await global.fetch(url, options);
            console.log(`[Sandbox] Fetch response status: ${response.status}`);
            
            // Clone the response to read it twice (once for logging, once for returning)
            const clonedResponse = response.clone();
            
            // Try to log response body if it's JSON
            try {
              const responseText = await clonedResponse.text();
              console.log(`[Sandbox] Response body: ${responseText.substring(0, 500)}...`);
              
              // Create a new response with the original status and headers, but new body
              return new Response(responseText, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
              });
            } catch (parseError) {
              console.error(`[Sandbox] Error parsing response: ${parseError}`);
              return response;
            }
          } catch (error) {
            console.error(`[Sandbox] Fetch error: ${error}`);
            throw error;
          }
        },
        console: {
          log: (...args: any[]) => console.log('[Sandbox]', ...args),
          error: (...args: any[]) => console.error('[Sandbox]', ...args),
        },
        // Pass context with auth info and user data
        context: {
          auth: {
            token: currentTokenSet.access_token || xeroAccount.access_token || ''
          },
          tenantId: activeTenant.tenantId,
          userInfo: {
            id: userId,
            email: (req as any).user?.email
          }
        }
      }
    });
    
    console.log(`Executing code with token: ${(currentTokenSet.access_token || xeroAccount.access_token || '').substring(0, 10)}...`);
    console.log(`Using tenant ID: ${activeTenant.tenantId}`);
    console.log(`Token expires at: ${new Date(Number(currentTokenSet.expires_at || xeroAccount.expires_at || 0) * 1000).toISOString()}`);

    // Wrap code in module pattern to ensure it defines fetchReportData
    const wrappedCode = `
      ${apiCode}
      
      // Call the function and return the result
      (async function() {
        try {
          if (typeof fetchReportData !== 'function') {
            return { 
              error: 'Invalid report code: fetchReportData function not found' 
            };
          }
          
          const result = await fetchReportData(context);
          
          // Validate the result structure
          if (!result || typeof result !== 'object') {
            return { error: 'Invalid report result: must return an object' };
          }
          
          if (!Array.isArray(result.data)) {
            return { error: 'Invalid report result: data must be an array' };
          }
          
          return result;
        } catch (error) {
          return { 
            error: error.message || 'Unknown error during execution',
            stack: error.stack
          };
        }
      })()
    `;

    // Execute the code
    const result = await vm.run(wrappedCode);
    
    // Handle error case
    if (result.error) {
      console.error('Report execution error:', result.error);
      return { error: result.error, stack: result.stack };
    }
    
    return result;
  } catch (error: any) {
    console.error('Code execution service error:', error);
    return { error: error.message || 'Failed to execute report code' };
  }
}; 