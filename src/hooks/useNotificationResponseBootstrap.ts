import { useEffect } from 'react';
import {
  registerNotificationResponseHandler,
  unregisterNotificationResponseHandler,
} from '../services/notifications/notificationClient';

export function useNotificationResponseBootstrap() {
  useEffect(() => {
    registerNotificationResponseHandler();
    return unregisterNotificationResponseHandler;
  }, []);
}
