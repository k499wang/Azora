/**
 * The agreement answers, without the screen that used to collect them.
 *
 * Onboarding no longer asks these three statements, but the answers are still
 * part of the saved assessment: profiles written before the screen was removed
 * carry them, and the score and plan still read them when they are there. The
 * type lives here rather than on a screen so nothing has to import a step to
 * understand a stored profile.
 */
export type AgreementValue = 'agree' | 'disagree';
