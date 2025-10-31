export const DEV_MODE = true; // on / off mock data
export const LM_API_KEY = '4d40cf0325cd82d400bbac4d8d95b1cb3885d327654bf3473b';
export const LM_BASE_URL = 'https://dev.lunchmoney.app/v1';
export const MOCK_BASE_URL = 'http://localhost:3005';
export const PRISMA_BASE_URL = 'https://coin-copilot-m.expo.app';

// --------------------------------------------

export const LUNCH_MONEY_ENDPOINTS = {
    ASSETS: '/assets',
    BUDGETS: '/budgets',
    CATEGORIES: '/categories',
    PLAID_ACCOUNTS: '/plaid_accounts',
    RECURRING_ITEMS: '/recurring_items',
    TRANSACTIONS: '/transactions',
};

// --------------------------------------------

export const LUNCH_MONEY_KEYS = {
    assets: 'assets',
    budget: 'budget',
    categories: 'categories',
    plaid: 'plaid',
    recurringItems: 'recurringItems',
    transactions: 'transactions',
};

// --------------------------------------------

export const PRISMA_ENDPOINTS = {
    ACCOUNT_SETTINGS: 'account-settings',
    TRANSACTIONS_ANOMALY: 'transactions-anomaly',
    APP_SETTINGS: 'app-settings',
    MESSAGE_ALERTS: 'message-alerts',
};

// --------------------------------------------

export const SUPABASE_KEYS = {
    accountSettings: 'accountSettings',
    transactionsAnomaly: 'transactionsAnomaly',
    appSettings: 'appSettings',
    messageAlerts: 'messageAlerts',

    PRISMA_PARAMS: {
        markAllRead: 'mark-all-read',
    },
};
