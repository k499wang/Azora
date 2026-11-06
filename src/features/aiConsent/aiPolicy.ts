import type { ComponentProps } from 'react';
import type TaskIllustration from '../../components/common/icons/TaskIllustration';

export const AI_POLICY_UPDATED = 'Last updated November 6, 2026';

export const AI_POLICY_SUMMARY: ReadonlyArray<{
  art: ComponentProps<typeof TaskIllustration>['name'];
  title: string;
  detail: string;
}> = [
  {
    art: 'message',
    title: 'What’s shared',
    detail: 'What you type or say to Azo, your to-do list, and any photo you choose for a cleaning plan.',
  },
  {
    art: 'sparkle',
    title: 'Who receives it',
    detail: 'Google Gemini, a third-party AI service, uses it to create your answer or plan.',
  },
  {
    art: 'clock',
    title: 'When it’s shared',
    detail: 'Only when you ask Azo something, plan with Azo, or make a photo cleaning plan.',
  },
  {
    art: 'lock-outline',
    title: 'Private and encrypted',
    detail: 'Your chats and photos are private to your account and encrypted in transit and at rest.',
  },
  {
    art: 'settings',
    title: 'You’re in control',
    detail: 'Turn this off anytime in Settings. These features won’t work while it’s off.',
  },
];

export const AI_POLICY_SECTIONS: ReadonlyArray<{ title: string; paragraphs: readonly string[] }> = [
  {
    title: '1. About this policy',
    paragraphs: [
      'This policy explains how Azora uses artificial intelligence, what information is shared with our AI provider, and the choices you have. It applies to the AI features described below and works together with our Privacy Policy and Terms of Use.',
      'We ask for your permission before any of your information is shared with our AI provider. Nothing is shared for these features unless you choose Allow.',
    ],
  },
  {
    title: '2. Features that use AI',
    paragraphs: [
      'Ask Azo answers your questions in a chat and can suggest to-dos or changes to your list.',
      'Plan with Azo turns what you say or type into a set of suggested to-dos.',
      'Photo cleaning plans look at a photo of a space and create a list of small steps for tidying it.',
      'These features rely on Google Gemini, an AI service provided by Google. Google is a third party and is separate from Azora.',
    ],
  },
  {
    title: '3. Information we share',
    paragraphs: [
      'When you use Ask Azo or Plan with Azo, we send Google Gemini the messages in your current conversation, the titles and schedule details of your to-dos, and today’s date so that suggestions fit your day.',
      'If you speak to Azo, your device’s speech recognition service turns your voice into text, and that text is what we send.',
      'When you make a photo cleaning plan, we send Google Gemini the photo you took or chose. Anything visible in the photo is included, so please avoid capturing people, documents, or other details you would rather not share.',
      'Please think before including sensitive details, such as health information or information about other people, in your messages.',
    ],
  },
  {
    title: '4. Information not included',
    paragraphs: [
      'Your heart rate measurements, mood check-ins, exercise history, and onboarding answers are not part of these requests. Your name and email address are not added to them either. Information like this is only included if you type it into a message yourself or it appears in your photo.',
    ],
  },
  {
    title: '5. How Google Gemini handles your information',
    paragraphs: [
      'Google Gemini processes what we send in order to generate your answer, suggestions, or plan, and returns the result to Azora. Google handles this information under the terms that apply to its Gemini API and under Google’s Privacy Policy.',
    ],
  },
  {
    title: '6. What Azora keeps',
    paragraphs: [
      'We save your messages to Azo, Azo’s replies, and the photos you use for cleaning plans with your Azora account. Our service logs may also include generated cleaning plans, which we use to keep the feature working properly.',
      'To-dos you choose to add are saved to your list like any other to-do. Our Privacy Policy explains how we protect and retain account information, and how to request deletion.',
    ],
  },
  {
    title: '7. Privacy and encryption',
    paragraphs: [
      'Your Azo chats and cleaning plan photos are private to your account. Your account can read its own chats, and your photos are kept in private storage that is not publicly accessible.',
      'Your information is encrypted in transit whenever it moves between the app, Azora’s servers, and Google Gemini. Your saved chats and photos are also encrypted at rest on Azora’s servers.',
      'Google Gemini needs to read what we send in order to create your answer or plan, so this is not end-to-end encryption. Section 5 explains how Google handles that information.',
    ],
  },
  {
    title: '8. Accuracy and limits of AI',
    paragraphs: [
      'AI can make mistakes. Answers and plans may be incomplete or wrong, so please review suggestions before relying on them. To-dos are only added to your list when you choose to save them.',
      'Azo and photo cleaning plans are for general wellness and everyday organization. They are not medical, mental health, legal, or safety advice, and they do not replace a qualified professional.',
      'If you are in danger or need urgent help, contact your local emergency services.',
    ],
  },
  {
    title: '9. Your choices',
    paragraphs: [
      'You can choose Don’t Allow on this screen and keep using the rest of Azora. Ask Azo, Plan with Azo, and photo cleaning plans will not work without your permission, and you will be asked again if you try to use them.',
      'You can withdraw your permission anytime by turning off AI features in Settings. This stops new information from being shared. It does not recall information that was already sent.',
      'You can also delete your Azora account from Settings, which removes your saved Azo chats and cleaning plan photos from Azora.',
    ],
  },
  {
    title: '10. Changes to this policy',
    paragraphs: [
      'We may update this policy as our features change. If we change our AI provider or the kind of information we share, we will update this policy and ask for your permission again.',
    ],
  },
  {
    title: '11. Contact us',
    paragraphs: [
      'If you have questions about this policy or how Azora uses AI, email us at feedback@tryazora.app.',
    ],
  },
];
