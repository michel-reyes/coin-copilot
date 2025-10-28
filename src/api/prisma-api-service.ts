import type { TransactionAnomaly } from '@/src/api/prisma/generated/client/edge';
import {
  DEV_MODE,
  MOCK_BASE_URL,
  PRISMA_BASE_URL,
  PRISMA_ENDPOINTS,
  PRISMA_KEYS,
} from './constants/apiSettings';

export const BASE_URL = DEV_MODE
  ? MOCK_BASE_URL + '/'
  : PRISMA_BASE_URL + '/server/';

// ------------------------------------------------------------------
// Account Settings
// ------------------------------------------------------------------
export const accountSettingsEndpoint =
  BASE_URL + PRISMA_ENDPOINTS.ACCOUNT_SETTINGS;

export const fetchAccountSettings = async (accountId?: string) => {
  try {
    const queryParams = accountId ? `?accountId=${accountId}` : '';
    const response = await fetch(accountSettingsEndpoint + queryParams, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching account settings:', error);
    throw error;
  }
};

// ------------------------------------------------------------------

export const createAccountSetting = async (
  accountId: string,
  balanceLimit: number,
  dueDay: number
) => {
  try {
    const response = await fetch(accountSettingsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId, balanceLimit, dueDay }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating account setting:', error);
    throw error;
  }
};

// ------------------------------------------------------------------

export const updateAccountSetting = async (
  accountId: string,
  updateData: any
) => {
  try {
    const response = await fetch(accountSettingsEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId: accountId, ...updateData }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating account setting:', error);
    throw error;
  }
};

// ------------------------------------------------------------------
// Transaction Anomaly
// ------------------------------------------------------------------
const transactionsAnomalyEndpoint =
  BASE_URL + PRISMA_ENDPOINTS.TRANSACTIONS_ANOMALY;

/**
 * Creates multiple transaction anomalies.
 * @param anomalies An array of transaction anomaly objects to create.
 * @returns The response data from the API.
 * @throws Will throw an error if the API request fails.
 */
export const createTransactionAnomaly = async (
  anomalies: Omit<TransactionAnomaly, 'id' | 'createdAt' | 'updatedAt'>[]
) => {
  try {
    const response = await fetch(transactionsAnomalyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(anomalies), // Send the array directly
    });

    if (!response.ok) {
      // Attempt to get more detailed error information from the response body
      const errorBody = await response.text();
      console.error(
        'Error creating transaction anomalies. Status:',
        response.status,
        'Body:',
        errorBody
      );
      throw new Error(
        `API error: ${response.status} - ${errorBody || response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in createTransactionAnomaly service:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// ------------------------------------------------------------------

export const fetchTransactionsAnomaly = async () => {
  try {
    const response = await fetch(transactionsAnomalyEndpoint, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching transactions anomaly:', error);
    throw error;
  }
};

// ------------------------------------------------------------------

// Delete
export const deleteTransactionsAnomaly = async (cutoffDate: string) => {
  try {
    const response = await fetch(transactionsAnomalyEndpoint, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cutoffDate }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting transaction anomaly:', error);
    throw error;
  }
};

// ------------------------------------------------------------------

export const markAllTransactionAnomalyAsRead = async () => {
  try {
    const response = await fetch(
      `${transactionsAnomalyEndpoint}?action=${PRISMA_KEYS.PRISMA_PARAMS.markAllRead}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking all read transactions anomaly:', error);
    throw error;
  }
};

// ------------------------------------------------------------------
// App Settings
// ------------------------------------------------------------------

const appSettingsEndpoint = BASE_URL + PRISMA_ENDPOINTS.APP_SETTINGS;

// Get All
export const fetchAppSettings = async () => {
  try {
    const response = await fetch(appSettingsEndpoint);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching app settings:', error);
    throw error;
  }
};

// ------------------------------------------------------------------

// Update
export const updateAppSettings = async (updateData: any) => {
  try {
    const response = await fetch(appSettingsEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...updateData }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating app settings:', error);
    throw error;
  }
};

// ------------------------------------------------------------------
// Message Alerts
// ------------------------------------------------------------------

const messageAlertsEndpoint = BASE_URL + PRISMA_ENDPOINTS.MESSAGE_ALERTS;

// Get All
export const fetchMessageAlerts = async () => {
  try {
    const response = await fetch(messageAlertsEndpoint);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching message alerts:', error);
    throw error;
  }
};

// ------------------------------------------------------------------

// Create
export const createMessageAlert = async (messageAlertData: any) => {
  try {
    const response = await fetch(messageAlertsEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...messageAlertData }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating message alert:', error);
    throw error;
  }
};

// ------------------------------------------------------------------

// Update
export const updateMessageAlert = async (messageAlertData: any) => {
  try {
    const response = await fetch(messageAlertsEndpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...messageAlertData }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating message alert:', error);
    throw error;
  }
};

// ------------------------------------------------------------------

// Delete
export const deleteMessageAlert = async (messageAlertId: string) => {
  try {
    const response = await fetch(messageAlertsEndpoint + `/${messageAlertId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting message alert:', error);
    throw error;
  }
};

// ------------------------------------------------------------------
