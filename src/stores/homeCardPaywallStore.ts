import AsyncStorage from '@react-native-async-storage/async-storage';
import { createHomeCardPaywallStore } from './homeCardPaywallStoreCore';

export type { HomeCardPaywallRequest } from './homeCardPaywallStoreCore';

export const useHomeCardPaywallStore = createHomeCardPaywallStore(AsyncStorage);
