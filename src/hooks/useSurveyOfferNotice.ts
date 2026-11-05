import { useCallback, useEffect, useState } from 'react';
import {
  loadSurveyOfferDismissed,
  setSurveyOfferDismissed,
} from '../services/preferences/surveyOfferPreference';
import {
  setSurveyOfferForced,
  useSurveyOfferForced,
} from './devSurveyOfferOverride';

export interface SurveyOfferNoticeState {
  /** the offer has not been answered */
  visible: boolean;
  /** opens the feedback form */
  open: () => void;
  /** answered or closed — retires the offer for good */
  dismiss: () => void;
  /** pushed aside by something the app would rather say; comes back later */
  preempt: () => void;
}

/**
 * The feedback form Routine asks for, offered to everyone who opens the app. It
 * is shown once storage has answered and never again once taken or closed.
 */
export function useSurveyOfferNotice(openFeedback: () => void): SurveyOfferNoticeState {
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [preempted, setPreempted] = useState(false);
  const forced = useSurveyOfferForced();

  useEffect(() => {
    let cancelled = false;

    loadSurveyOfferDismissed().then((stored) => {
      if (!cancelled) setDismissed(stored);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const retire = useCallback(() => {
    setDismissed(true);
    setSurveyOfferForced(false);
    void setSurveyOfferDismissed();
  }, []);

  const open = useCallback(() => {
    // Navigation can unmount the notice before its exit animation finishes.
    retire();
    openFeedback();
  }, [openFeedback, retire]);

  return {
    visible: !preempted && (forced || dismissed === false),
    open,
    dismiss: retire,
    preempt: useCallback(() => setPreempted(true), []),
  };
}
