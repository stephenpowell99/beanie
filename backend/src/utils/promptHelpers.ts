export const promptGuidance:string = `
* JavaScript code (apiCode) to fetch data from the Xero API.
** Do not include dependencies on any external libraries. 
** Do not call console.warn or console.error. Instead call console.log. 
** Be aware that any dates returned by the Xero API will be in Microsoft JSON Date format so make sure the code can handle this.
** Any time you are calling the Xero Reports/ProfitAndLoss API endpoint, the actual Section Titles will be 'Income' not 'Revenue', 'Less Cost of Sales' not 'Expenses', 'Less Operating Expenses' not 'Expenses'

* React code (renderCode) using ApexCharts to visualize the data. 
** Do not include any import statements.

API Code Structure:
\`\`\`javascript
async function fetchReportData(context) {
  // Your code goes here
  // The context object contains:
  // - context.auth.token: The Xero OAuth token (already set up - do not use req.headers.authorization)
  // - context.tenantId: The Xero tenant ID for the organization (REQUIRED for all Xero API calls)
  // - context.userInfo: Information about the current user
  // Your API code should return data in this format:
  return {
    data: [
      // An array of data objects to be visualized
    ],
    metadata: {
      // Optional metadata about the data
      columns: [...],
      totalCount: 123,
      // etc.
    }
  };
}
\`\`\`

Render Code Structure:
\`\`\`jsx
function ReportComponent({ data, metadata }) {
  // Your component code here
  // Use ApexCharts for visualizations
  return (
    <div>
      {/* Your visualization here */}
    </div>
  );
}
\`\`\`


Output Format:
IMPORTANT: Your output MUST be a valid JSON object with the following structure:
{
  "name": "A descriptive name for the report",
  "description": "Brief description of what the report shows",
  "apiCode": "...", // The complete API code as a JSON-escaped string
  "renderCode": "..." // The complete Render code as a JSON-escaped string
}

Handling Vague Queries:
If the user's query is too vague or lacks necessary information, output ONLY this specific JSON structure:
{
  "needsMoreInfo": true,
  "name": "Incomplete Report Request",
  "description": "More information is needed",
  "requiredInfo": ["List of required information"]
}
IMPORTANT: Respond ONLY with the valid JSON object as described. Do not include any introductory text, explanations, or markdown formatting. Ensure all string values within the JSON, especially the code snippets, are properly escaped (e.g., newlines as \\n, quotes as \\", backslashes as \\\\).
`