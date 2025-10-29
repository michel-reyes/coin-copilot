import { MMKV } from 'react-native-mmkv';

/**
 * MMKV storage instance for persistent data storage
 */
export const storage = new MMKV({ id: 'coin-copilotm-storage' });
