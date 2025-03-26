import { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import prisma from '../prisma';
import { asyncHandler, throwApiError } from '../middleware/errorHandler.middleware';
import { executeApiCode } from '../services/codeExecution.service';
import * as babel from '@babel/core';
import { Report } from '@prisma/client'; // Import Report type if not already done
import { promptGuidance } from '../utils/promptHelpers';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Specify the model requested by the user
// Note: Ensure this exact model name is available and supported.
// If issues arise, consider alternatives like 'gemini-1.5-pro-latest'.
const modelName = "gemini-2.5-pro-exp-03-25";
const generationConfig = {
  // Ensure JSON output
  responseMimeType: "application/json",
  // Adjust temperature for creativity vs. consistency if needed (0.0-1.0)
  // temperature: 0.7,
};
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Get the model instance
const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig,
  safetySettings
});

// Function to transform JSX to React.createElement calls
const transformJSX = (code: string): string => {
  try {
    const result = babel.transformSync(code, {
      presets: ['@babel/preset-react'],
      plugins: ['@babel/plugin-transform-react-jsx'],
    });
    return result?.code || code;
  } catch (error) {
    console.error('Error transforming JSX:', error);
    return code;
  }
};

// Helper function to extract code from markdown blocks if necessary
const extractCode = (text: string, lang: 'javascript' | 'jsx'): string | null => {
  const regex = new RegExp("```" + lang + "\\n?([\\s\\S]*?)\\n?```");
  const match = text.match(regex);
  return match ? match[1].trim() : null;
};

export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  console.log('generateReport endpoint hit');
  const { query, userId } = req.body;
  console.log('Request body:', { query, userId });

  if (!query) {
    throwApiError('Query is required', 400);
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throwApiError('User not found', 404);
  }

  // Prepare the prompt for Gemini
  // Combine system instructions and user query into a single prompt structure
  const systemInstructions = `You are a helpful assistant that generates JavaScript code to create dashboard reports based on user queries about Xero API data.
Your task is to generate two code snippets:

${promptGuidance} 

`;

  const combinedPrompt = `${systemInstructions}\n\nUser Query: ${query}`;

  try {
    console.log(`Sending request to Gemini model: ${modelName}`);
    // Use generateContent with the combined prompt and JSON output config
    const result = await model.generateContent(combinedPrompt);
    const response = result.response;

    // Since we requested JSON output, parse the text directly
    const responseText = response.text();
    console.log("Raw Gemini Response Text:", responseText); // Log raw response for debugging

    let reportData;
    try {
      reportData = JSON.parse(responseText);
    } catch (parseError) {
        console.error("Failed to parse Gemini JSON response:", responseText, parseError);
        throwApiError('Failed to parse AI response', 500);
    }


    if (reportData.needsMoreInfo) {
      return res.status(400).json(reportData);
    }

    // Validate the structure of the successful response
    if (!reportData.name || !reportData.description || !reportData.apiCode || !reportData.renderCode) {
        console.error("Gemini response missing required fields:", reportData);
        throwApiError('AI response was incomplete or malformed', 500);
    }

    // Transform the JSX in renderCode
    reportData.renderCode = transformJSX(reportData.renderCode);

    // Create the report in the database
    const report = await prisma.report.create({
      data: {
        name: reportData.name,
        description: reportData.description,
        query: query,
        apiCode: reportData.apiCode,
        renderCode: reportData.renderCode,
        userId: userId,
        data: JSON.stringify({}), // Store empty object as string
      },
    });

    res.json(report);
  } catch (error) {
    console.error('Error generating report with Gemini:', error);
     // Check if it's an API error we already threw
    if (error instanceof Error && (error as any).statusCode) {
        throw error; // Re-throw known API errors
    }
    // Check for potential safety blocks from Gemini
    if (error instanceof Error && error.message.includes('SAFETY')) {
       throwApiError('AI request blocked due to safety settings.', 400);
    }
    throwApiError('Failed to generate report using AI', 500);
  }
});

export const getUserReports = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);

  if (isNaN(userId)) {
    throwApiError('Invalid user ID', 400);
  }

  // @ts-ignore: Prisma types may not be fully updated
  const reports = await prisma.report.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  }).catch(error => {
    throwApiError('Failed to fetch reports', 500, error);
  });

  return res.status(200).json(reports);
});

export const getReportById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    throwApiError('Invalid report ID', 400);
  }

  // @ts-ignore: Prisma types may not be fully updated
  const report = await prisma.report.findUnique({
    where: { id },
  }).catch(error => {
    throwApiError('Failed to fetch report', 500, error);
  });

  if (!report) {
    throwApiError('Report not found', 404);
  }

  return res.status(200).json(report);
});

export const deleteReport = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const userId = parseInt(req.body.userId);

  if (isNaN(id)) {
    throwApiError('Invalid report ID', 400);
  }

  if (isNaN(userId)) {
    throwApiError('Invalid user ID', 400);
  }

  // Check if report exists and belongs to the user
  // @ts-ignore: Prisma types may not be fully updated
  const report = await prisma.report.findFirst({
    where: { 
      id,
      userId
    },
  }).catch(error => {
    throwApiError('Failed to check report ownership', 500, error);
  });

  if (!report) {
    throwApiError('Report not found or unauthorized', 404);
  }

  // @ts-ignore: Prisma types may not be fully updated
  await prisma.report.delete({
    where: { id },
  }).catch(error => {
    throwApiError('Failed to delete report', 500, error);
  });

  return res.status(200).json({ message: 'Report deleted successfully' });
});

export const runReport = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`Running report with ID: ${id}`);
  
  // Parse the ID as a number
  const reportId = parseInt(id, 10);
  if (isNaN(reportId)) {
    throwApiError('Invalid report ID', 400);
  }
  
  // Find the report
  const report = await prisma.report.findUnique({
    where: { id: reportId }
  });
  
  // Check if report exists
  if (!report) {
    throwApiError('Report not found', 404);
  }
  
  // At this point, we know the report exists
  // Check if the user has access to this report
  const userId = (req as any).user?.id;
  if (report!.userId !== userId) {
    throwApiError('You do not have permission to access this report', 403);
  }
  
  console.log(`Executing API code for report: ${report!.name}`);
  console.log(`User ID: ${userId}`);
  
  // Check if the user has a Xero connection
  const xeroAccount = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'xero',
    },
  });
  
  if (!xeroAccount) {
    console.error(`No Xero connection found for user ${userId}`);
    throwApiError('No Xero connection found. Please connect your Xero account first.', 400);
  } else {
    console.log(`Found Xero account for user ${userId}: Account ID ${xeroAccount.id}`);
    console.log(`Xero token expires at: ${new Date(Number(xeroAccount.expires_at) * 1000).toISOString()}`);
  }
  
  // Execute the API code
  const result = await executeApiCode(report!.apiCode, req);
  
  // Check for execution errors
  if (result.error) {
    console.error(`Error executing report: ${result.error}`);
    if (result.stack) {
      console.error(`Error stack: ${result.stack}`);
    }
    throwApiError(`Error executing report: ${result.error}`, 500, { 
      reportId,
      stack: result.stack 
    });
  }
  
  console.log(`Successfully executed report. Data contains ${result.data?.length || 0} items.`);
  
  // Return the data and render code
  res.status(200).json({
    reportId: report!.id,
    name: report!.name,
    description: report!.description,
    data: result.data,
    metadata: result.metadata || {},
    renderCode: report!.renderCode
  });
});

export const modifyReport = asyncHandler(async (req: Request, res: Response) => {
  const reportId = parseInt(req.params.id);
  const { requestText, userId } = req.body;

  if (isNaN(reportId)) {
    throwApiError('Invalid report ID', 400);
  }
  if (!requestText) {
    throwApiError('Modification request text is required', 400);
  }
  if (!userId) {
    throwApiError('User ID is required', 400);
  }

  // Fetch the existing report
  const existingReport = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!existingReport) {
    throwApiError('Report not found', 404);
  }

  // Ensure the user owns the report (optional but recommended)
  if (existingReport!.userId !== userId) {
    throwApiError('Forbidden: You do not own this report', 403);
  }

  // Prepare the prompt for Gemini modification
  const systemInstructions = `You are a helpful assistant that modifies existing dashboard report code based on user requests.
You will be given the original user query, the current API code, the current render code, and a new user request for modification.
Your task is to update the API code and/or Render code based on the user's request. Keep the overall structure and functionality unless the request specifically asks for major changes.

${promptGuidance}`;

  const modificationPrompt = `${systemInstructions}

Original Query: ${existingReport!.query}

Current API Code:
\`\`\`javascript
${existingReport!.apiCode}
\`\`\`

Current Render Code:
\`\`\`jsx
${existingReport!.renderCode}
\`\`\`

User Modification Request: ${requestText}`;

  try {
    console.log(`Sending modification request to Gemini model: ${modelName}`);
    // Use generateContent with the combined prompt and JSON output config
    const result = await model.generateContent(modificationPrompt);
    const response = result.response;

    // Since we requested JSON output, parse the text directly
    const responseText = response.text();
    console.log("Raw Gemini Modification Response Text:", responseText); // Log raw response

    let reportData;
     try {
      reportData = JSON.parse(responseText);
    } catch (parseError) {
        console.error("Failed to parse Gemini JSON modification response:", responseText, parseError);
        throwApiError('Failed to parse AI modification response', 500);
    }


    if (reportData.needsMoreInfo) {
      return res.status(400).json(reportData);
    }

    // Validate the structure of the successful response
    if (!reportData.name || !reportData.description || !reportData.apiCode || !reportData.renderCode) {
        console.error("Gemini modification response missing required fields:", reportData);
        throwApiError('AI modification response was incomplete or malformed', 500);
    }

    // Transform the JSX in renderCode
    const transformedRenderCode = transformJSX(reportData.renderCode);

    // Update the report in the database
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        name: reportData.name,
        description: reportData.description,
        apiCode: reportData.apiCode,
        renderCode: transformedRenderCode,
        updatedAt: new Date(),
      },
    });

    res.json(updatedReport);
  } catch (error) {
    console.error('Error modifying report with Gemini:', error);
    // Check if it's an API error we already threw
    if (error instanceof Error && (error as any).statusCode) {
        throw error; // Re-throw known API errors
    }
     // Check for potential safety blocks from Gemini
    if (error instanceof Error && error.message.includes('SAFETY')) {
       throwApiError('AI request blocked due to safety settings.', 400);
    }
    throwApiError('Failed to modify report using AI', 500);
  }
});

// NEW FUNCTION: answerReportQuestion
export const answerReportQuestion = asyncHandler(async (req: Request, res: Response) => {
  const reportId = parseInt(req.params.id);
  const { questionText, userId } = req.body;

  if (isNaN(reportId)) {
    throwApiError('Invalid report ID', 400);
  }
  if (!questionText) {
    throwApiError('Question text is required', 400);
  }
  if (!userId) {
    throwApiError('User ID is required', 400); // Assuming we need user context or validation
  }

  // Fetch the existing report
  const existingReport = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!existingReport) {
    throwApiError('Report not found', 404);
  }

  // Ensure the user owns the report (optional but recommended)
  if (existingReport!.userId !== userId) {
    throwApiError('Forbidden: You do not own this report', 403);
  }

  // Prepare the prompt for Gemini to answer the question
  // Note: We are NOT requesting JSON output here, just plain text.
  const questionModel = genAI.getGenerativeModel({
    model: modelName, // Use the same model
    // generationConfig: {}, // No specific responseMimeType needed
    safetySettings
  });

  const systemInstructions = `You are an expert code analyst. You will be given details about a dashboard report, including its original query, API code (fetches data), and render code (displays data). You will also be given a user's question about this report.
Your task is to analyze the provided code and context to answer the user's question accurately and concisely. Explain how the report works or how specific calculations are made based *only* on the provided code. Do not invent information or assume external factors not present in the code. If the code doesn't provide enough information to answer, state that clearly.`;

  const contextPrompt = `Report Name: ${existingReport!.name}
Report Description: ${existingReport!.description}
Original Query: ${existingReport!.query}

API Code (fetches data):
\`\`\`javascript
${existingReport!.apiCode}
\`\`\`

Render Code (displays data):
\`\`\`jsx
${existingReport!.renderCode}
\`\`\`

User Question: ${questionText}

Answer the user's question based on the provided report details and code:`;

  try {
    console.log(`Sending question to Gemini model: ${modelName}`);
    const result = await questionModel.generateContent(contextPrompt); // Use the model without JSON config
    const response = result.response;
    const answerText = response.text();

    console.log("Raw Gemini Answer Text:", answerText);

    // Return the plain text answer
    res.json({ answer: answerText });

  } catch (error) {
    console.error('Error answering question with Gemini:', error);
    // Check if it's an API error we already threw
    if (error instanceof Error && (error as any).statusCode) {
        throw error; // Re-throw known API errors
    }
     // Check for potential safety blocks from Gemini
    if (error instanceof Error && error.message.includes('SAFETY')) {
       throwApiError('AI request blocked due to safety settings.', 400);
    }
    throwApiError('Failed to get answer using AI', 500);
  }
}); 