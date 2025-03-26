// This is a sample report to demonstrate the correct way to access Xero APIs
async function fetchReportData(context) {
    try {
        // Get date range for last 12 months
        const today = new Date();
        const endDate = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month
        const startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 11); // 12 months ago from end date

        // Format dates for Xero API
        const formatDate = (date) => {
            return date.toISOString().split('T')[0];
        };

        console.log(`Using tenant ID: ${context.tenantId}`);
        console.log(`Using token: ${context.auth.token.substring(0, 10)}...`);

        // Fetch invoices from Xero API for the last 12 months
        const response = await fetch(
            `https://api.xero.com/api.xro/2.0/Invoices?where=Type==""ACCREC"" AND Status==""AUTHORISED"" OR Status==""PAID"" AND Date>=DateTime(${formatDate(startDate)})&order=Date`,
            {
                headers: {
                    'Authorization': `Bearer ${context.auth.token}`,
                    'Accept': 'application/json',
                    'Xero-Tenant-Id': context.tenantId // Make sure to include this header with the tenant ID
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }

        const invoicesData = await response.json();

        // Process the invoices to get monthly totals
        const monthlySales = {};
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Initialize all months with zero
        for (let i = 0; i < 12; i++) {
            const monthDate = new Date(startDate);
            monthDate.setMonth(startDate.getMonth() + i);
            const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth() + 1}`;
            const monthLabel = `${monthNames[monthDate.getMonth()]} ${monthDate.getFullYear()}`;

            monthlySales[monthKey] = {
                month: monthLabel,
                total: 0
            };
        }

        // Aggregate invoice amounts by month
        if (invoicesData.Invoices) {
            invoicesData.Invoices.forEach(invoice => {
                const invoiceDate = new Date(invoice.Date);
                const monthKey = `${invoiceDate.getFullYear()}-${invoiceDate.getMonth() + 1}`;

                if (monthlySales[monthKey]) {
                    monthlySales[monthKey].total += Number(invoice.Total);
                }
            });
        }

        // Convert to array for chart data
        const salesData = Object.values(monthlySales);

        return {
            data: salesData,
            metadata: {
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
                currencySymbol: invoicesData.Invoices && invoicesData.Invoices.length > 0 ?
                    invoicesData.Invoices[0].CurrencySymbol || '$' : '$'
            }
        };
    } catch (error) {
        console.error('Error fetching sales data:', error);
        return {
            data: [],
            metadata: {
                error: error.message || 'Unknown error'
            }
        };
    }
} 