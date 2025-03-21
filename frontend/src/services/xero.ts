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