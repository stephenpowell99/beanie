import api from './api';

// Check if user has connected to Xero
export const checkXeroConnection = async () => {
  try {
    const response = await api.get('/api/xero/connection');
    return response.data;
  } catch (error) {
    console.error('Error checking Xero connection:', error);
    throw error;
  }
};

// Initiate Xero OAuth flow
export const initiateXeroAuth = async () => {
  try {
    const response = await api.get('/api/xero/auth');
    return response.data;
  } catch (error) {
    console.error('Error initiating Xero auth:', error);
    throw error;
  }
};

// Disconnect Xero
export const disconnectXero = async () => {
  try {
    const response = await api.delete('/api/xero/disconnect');
    return response.data;
  } catch (error) {
    console.error('Error disconnecting Xero:', error);
    throw error;
  }
};

// Get Xero customers
export const getXeroCustomers = async () => {
  try {
    const response = await api.get('/api/xero/customers');
    return response.data;
  } catch (error) {
    console.error('Error getting Xero customers:', error);
    throw error;
  }
};

// Get Xero monthly financial data
export const getXeroMonthlyFinancials = async () => {
  try {
    const response = await api.get('/api/xero/monthly-financials');
    return response.data;
  } catch (error) {
    console.error('Error getting Xero monthly financials:', error);
    throw error;
  }
};

// Get top 5 customers by invoice amount
export const getTopInvoicedCustomers = async () => {
  try {
    const response = await api.get('/api/xero/top-invoiced-customers');
    return response.data;
  } catch (error) {
    console.error('Error getting top invoiced customers:', error);
    throw error;
  }
};