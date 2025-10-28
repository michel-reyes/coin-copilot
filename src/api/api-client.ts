import {
  DEV_MODE,
  LM_API_KEY,
  LM_BASE_URL,
  MOCK_BASE_URL,
} from '@/src/api/constants/apiSettings';
import axios from 'axios';

// --------------------------------------------

export const lunchMoneyClient = axios.create({
  baseURL: DEV_MODE ? MOCK_BASE_URL : LM_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${LM_API_KEY}`,
  },
});
