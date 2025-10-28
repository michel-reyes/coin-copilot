import axios from 'axios';
import { DEV_MODE, MOCK_BASE_URL, LM_BASE_URL, LM_API_KEY } from './constants/apiSettings';

// --------------------------------------------

export const lunchMoneyClient = axios.create({
    baseURL: DEV_MODE ? MOCK_BASE_URL : LM_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LM_API_KEY}`,
    },
});
