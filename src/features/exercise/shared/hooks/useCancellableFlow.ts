import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useCancellableFlow(onCancel: () => void) {
  const mountedRef = useRef(true);
  const activeRef = useRef(false);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  const cancel = useCallback(() => {
    activeRef.current = false;
    onCancelRef.current();
  }, []);

  const start = useCallback(() => {
    if (!mountedRef.current) return false;
    activeRef.current = true;
    return true;
  }, []);

  const isActive = useCallback(
    () => mountedRef.current && activeRef.current,
    [],
  );

  useFocusEffect(
    useCallback(() => cancel, [cancel]),
  );

  useEffect(
    () => () => {
      mountedRef.current = false;
      activeRef.current = false;
      onCancelRef.current();
    },
    [],
  );

  return useMemo(
    () => ({
      cancel,
      isActive,
      start,
    }),
    [cancel, isActive, start],
  );
}
