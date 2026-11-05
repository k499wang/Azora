import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
  trackEnjoymentPromptAnswered,
  trackEnjoymentPromptShown,
  type EnjoymentPromptAnswer,
} from '../../services/analytics/tracking';
import {
  isEnjoymentPromptDue,
  loadEnjoymentPromptRecord,
  markEnjoymentPromptShown,
  type EnjoymentPromptRecord,
} from './enjoymentPromptState';

// Lets Routine land, and lets a modal that just closed finish its native dismissal.
const SETTLE_MS = 800;
// Off until the sheet is ready for users. The dev preview in Settings still works.
const LIVE_FOR_USERS = false;

let forced = false;
const listeners = new Set<() => void>();

/** Dev only: the prompt needs a calendar day to pass, so Settings can skip the wait. */
export function forceEnjoymentPrompt(): void {
  if (!__DEV__) return;
  forced = true;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readForced(): boolean {
  return __DEV__ ? forced : false;
}

/**
 * Asks once, on the first Routine visit of a later day. Being "due" looks only at
 * the calendar. `active` only delays the sheet until nothing else is on screen.
 */
export function useEnjoymentPrompt({
  userId,
  todayLocalDate,
  active,
}: {
  userId: string | null;
  todayLocalDate: string;
  active: boolean;
}) {
  const [record, setRecord] = useState<EnjoymentPromptRecord | null>(null);
  const [visible, setVisible] = useState(false);
  const isForced = useSyncExternalStore(subscribe, readForced, readForced);

  useEffect(() => {
    if (!LIVE_FOR_USERS || userId == null) return;
    let cancelled = false;
    void loadEnjoymentPromptRecord(userId, todayLocalDate).then((next) => {
      if (!cancelled) setRecord(next);
    });
    return () => {
      cancelled = true;
    };
    // Today is excluded: the stored date is only written on the first visit.
  }, [userId]);

  const due = record != null && isEnjoymentPromptDue(record, todayLocalDate);

  useEffect(() => {
    if (userId == null || !active || !(due || isForced)) return;
    const timer = setTimeout(() => {
      forced = false;
      setRecord(null);
      setVisible(true);
      trackEnjoymentPromptShown();
      // Written on show, so closing the app with the sheet up does not ask again.
      void markEnjoymentPromptShown(userId);
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [active, due, isForced, userId]);

  // The sheet can still report a close during its exit, after the real answer.
  const answer = useCallback((value: EnjoymentPromptAnswer) => {
    if (!visible) return;
    setVisible(false);
    trackEnjoymentPromptAnswered(value);
  }, [visible]);

  return { visible, answer };
}
