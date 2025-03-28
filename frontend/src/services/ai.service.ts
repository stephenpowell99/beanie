import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Report {
  id: number;
  name: string;
  description: string | null;
  query: string;
  apiCode: string;
  renderCode: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface NeedsMoreInfoResponse {
  needsMoreInfo: true;
  name: string;
  description: string;
  requiredInfo: string[];
}

export interface GenerateReportResponse {
  message: string;
  report: Report;
  needsMoreInfo?: false;
}

export interface ApiError {
  message: string;
  statusCode: number;
  stack?: string;
  details?: any;
}

export interface ReportResult {
  reportId: number;
  name: string;
  description: string | null;
  data: any[];
  metadata: {
    columns?: string[];
    totalCount?: number;
    [key: string]: any;
  };
  renderCode: string;
}

export interface AskQuestionResponse {
  answer: string;
}

export const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error) && error.response) {
    // Extract the API error from the response
    const apiError: ApiError = error.response.data.error;
    
    // Log detailed error in development
    console.error('API Error:', apiError);
    
    // Construct a more detailed error message
    let errorMessage = apiError.message || 'An unexpected error occurred';
    if (apiError.details) {
      // Add relevant details to the error message
      if (apiError.details.reportName) {
        errorMessage += `\nReport: ${apiError.details.reportName}`;
      }
      if (apiError.details.sandboxContext) {
        const ctx = apiError.details.sandboxContext;
        errorMessage += `\nError at line ${ctx.lineNumber}, column ${ctx.columnNumber}`;
        if (ctx.sourceFragment) {
          errorMessage += `\nCode: ${ctx.sourceFragment}`;
        }
      }
      if (apiError.details.cause) {
        errorMessage += `\nCause: ${apiError.details.cause}`;
      }
    }
    
    throw new Error(errorMessage);
  }
  
  // For non-axios errors or if the error structure is different
  console.error('Unexpected error:', error);
  throw new Error('An unexpected error occurred');
};

export const generateReport = async (
  query: string, 
  userId: number,
  model: 'gemini' | 'claude' = 'gemini'
): Promise<Report | NeedsMoreInfoResponse> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const endpoint = `${API_URL}/ai/reports`;
  console.log(`Making API request to: ${endpoint} with userId: ${userId} and model: ${model}`);
  
  try {
    const response = await axios.post(
      endpoint,
      { query, userId, model },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log('API Response:', response);
    
    if (response.data.needsMoreInfo) {
      return response.data as NeedsMoreInfoResponse;
    }
    
    return response.data as Report;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400 && error.response.data.needsMoreInfo) {
      return error.response.data as NeedsMoreInfoResponse;
    }
    return handleApiError(error);
  }
};

export const getUserReports = async (userId: number): Promise<Report[]> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  try {
    const response = await axios.get(
      `${API_URL}/ai/reports/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getReportById = async (id: number): Promise<Report> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  try {
    const response = await axios.get(
      `${API_URL}/ai/reports/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteReport = async (id: number, userId: number): Promise<void> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  try {
    await axios.delete(
      `${API_URL}/ai/reports/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { userId },
      }
    );
  } catch (error) {
    handleApiError(error);
  }
};

export const runReport = async (reportId: number): Promise<ReportResult> => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const endpoint = `${API_URL}/ai/reports/${reportId}/run`;
  console.log(`Making API request to run report: ${endpoint}`);
  
  try {
    const response = await axios.get(
      endpoint,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const modifyReport = async (
  reportId: number,
  requestText: string,
  userId: number,
  model: 'gemini' | 'claude' = 'gemini'
): Promise<Report | NeedsMoreInfoResponse> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const endpoint = `${API_URL}/ai/reports/${reportId}/modify`;
  console.log(`Making API request to modify report: ${endpoint} with model: ${model}`);

  try {
    const response = await axios.put(
      endpoint,
      { requestText, userId, model },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.needsMoreInfo) {
       return response.data as NeedsMoreInfoResponse;
    }

    return response.data as Report;
  } catch (error) {
     if (axios.isAxiosError(error) && error.response?.status === 400 && error.response.data.needsMoreInfo) {
       return error.response.data as NeedsMoreInfoResponse;
     }
    return handleApiError(error);
  }
};

export const askQuestionAboutReport = async (
  reportId: number,
  questionText: string,
  userId: number
): Promise<AskQuestionResponse> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  const endpoint = `${API_URL}/ai/reports/${reportId}/ask`;
  console.log(`Making API request to ask question about report: ${endpoint}`);

  try {
    const response = await axios.post(
      endpoint,
      { questionText, userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Expecting { answer: "..." }
    return response.data as AskQuestionResponse;
  } catch (error) {
    // Use the general error handler for errors
    // Note: We don't expect a "needsMoreInfo" response here, but handleApiError will catch other issues.
    return handleApiError(error);
  }
};

export const saveReportCode = async (
  reportId: number,
  apiCode: string,
  renderCode: string,
  userId: number
): Promise<Report> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await axios.put(
      `${API_URL}/ai/reports/${reportId}/code`,
      { apiCode, renderCode, userId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data as Report;
  } catch (error) {
    return handleApiError(error);
  }
}; 