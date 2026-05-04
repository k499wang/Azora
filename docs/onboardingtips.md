 1. Reduce time-to-first-value. Get the user to a "wow" moment (a guided breath with their pulse showing) within 30 seconds. Defer
  email/account/notification asks until after they feel the product work.                                                              
  2. Soft-ask permissions in context. Don't trigger system prompts on the welcome screen. Show a custom pre-prompt explaining why ("we
  use heart rate to time your inhales") then trigger the OS prompt only on Yes — this dramatically cuts the deny rate which is         
  permanent on iOS.                                         
  3. Sticky progress bar. You already have one — add micro-animations on each step advance (Animated.spring on width) so users feel    
  forward motion. Also show "Step 1 of 4" copy; perceived shortness raises completion.                                                 
  4. Single primary action per screen. No secondary CTAs ("Skip", "Maybe later"). One button, one path. If they must skip, hide it as a
   small text link.                                                                                                                    
  5. Pre-select a default on multi-choice screens. A pre-checked option converts ~10–15% better than a blank state, because Continue is
   immediately tappable.                                                                                                               
  6. Personalize copy after the intent step. "Got it — Azora will focus on stress relief for you." Reflecting their answer back boosts
  perceived fit.                                                                                                                       
  7. Social proof + outcome promise. Right before the paywall or account creation: "Users see HRV improve in 7 days" with a quick
  3-star pattern of testimonials.                                                                                                      
  8. Animate transitions, not just elements. Use react-native-screens + @react-navigation/native-stack animation: 'slide_from_right'
  for nav-level moves; for the welcome stack of overlays, do crossfades (you now do). Avoid jarring snap cuts.                         
  9. Haptics ladder. Selection = selectionAsync, primary CTA = Medium impact, success states (e.g., account created) =
  notificationAsync(Success), errors = notificationAsync(Warning). You already use this pattern in DailyExercise — apply it            
  consistently.                                             
  10. Defer the paywall to after the first completed session, not during onboarding. Conversion on a "second-day" paywall typically    
  beats a Day-0 paywall by a wide margin for wellness apps.                                                                            
  11. Notification opt-in framing. Ask for notifications after they set a daily goal — "Want a gentle reminder at [time they picked]?"
  Yes-rate jumps because the ask is tied to their stated intent.                                                                       
  12. Measure with PostHog funnels. You already have it wired — instrument an event per onboarding step (onboarding_step_viewed,
  ..._completed) so you can A/B copy and order. Without the funnel you're guessing.                                                    
  13. Keep the orb breathing during decision screens. Subtle ambient motion lowers cognitive load and signals "the product is alive" —
  your existing pulse loop already does this on the intro; consider a tiny version in the corner of the intent screen too.     