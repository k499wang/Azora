export const AI_POLICY_UPDATED = 'Last updated November 7, 2026';

export const AI_POLICY_SECTIONS: ReadonlyArray<{ title: string; paragraphs: readonly string[] }> = [
  {
    title: '1. You are in control',
    paragraphs: [
      'Azora was built to protect your information, and this policy explains exactly how we do that when you use our AI features. It covers what is shared, how it is protected, and the choices you have. It works together with our Privacy Policy and Terms of Use.',
      'Nothing is shared for these features unless you choose Allow. You can change your mind anytime in Settings, and the rest of Azora keeps working either way.',
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
    title: '3. Only what is needed is shared',
    paragraphs: [
      'When you use Ask Azo or Plan with Azo, we send Google Gemini the messages in your current conversation, the titles and schedule details of your to-dos, and today’s date so that suggestions fit your day.',
      'If you speak to Azo, your device’s speech recognition service turns your voice into text, and that text is what we send.',
      'When you make a photo cleaning plan, we send Google Gemini the photo you took or chose. Anything visible in the photo is included, so you can simply frame it around the space you want to tidy.',
      'Information is shared only when you ask Azo something, plan with Azo, or make a photo cleaning plan. You decide what goes into every message and photo, and you can leave out anything you would rather keep to yourself.',
    ],
  },
  {
    title: '4. What is never added',
    paragraphs: [
      'Your name, email address, and account ID are not added to these requests. Neither are your heart rate measurements, mood check-ins, exercise history, or onboarding answers. Information like this is only included if you type it into a message yourself or it appears in your photo.',
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
      'We save your messages to Azo, Azo’s replies, and the photos you use for cleaning plans with your Azora account, so they stay connected to you. Our service logs may also include generated cleaning plans, which we use to keep the feature working properly.',
      'To-dos are only added to your list when you choose to save them. Our Privacy Policy explains how we protect and retain account information, and how to request deletion.',
    ],
  },
  {
    title: '7. How your information is protected',
    paragraphs: [
      'Your Azo chats are locked to your account, and other Azora users cannot see them. Your cleaning plan photos are kept in private storage that is not publicly accessible.',
      'Your information is encrypted in transit whenever it moves between the app, Azora’s servers, and Google Gemini. Your saved chats and photos are also encrypted at rest on Azora’s servers.',
      'Google Gemini reads what we send so that it can create your answer or plan, which means this is not end-to-end encryption. Section 5 explains how Google handles that information.',
    ],
  },
  {
    title: '8. Accuracy and limits of AI',
    paragraphs: [
      'AI can make mistakes, so you always get the final say. Please review suggestions before relying on them. Nothing changes on your list until you confirm it.',
      'Azo and photo cleaning plans are for general wellness and everyday organization. They are not medical, mental health, legal, or safety advice, and they do not replace a qualified professional.',
      'If you are in danger or need urgent help, contact your local emergency services.',
    ],
  },
  {
    title: '9. Your choices',
    paragraphs: [
      'You can choose Don’t Allow on this screen and keep using the rest of Azora. Ask Azo, Plan with Azo, and photo cleaning plans need your permission to work, and you will be asked again if you try to use them.',
      'You can withdraw your permission anytime by turning off AI features in Settings. This stops new information from being shared right away. It does not recall information that was already sent.',
      'You can also delete your Azora account from Settings, which removes your saved Azo chats and cleaning plan photos from Azora.',
    ],
  },
  {
    title: '10. Changes to this policy',
    paragraphs: [
      'If we change our AI provider or the kind of information we share, we will update this policy and ask for your permission again.',
    ],
  },
  {
    title: '11. We are here to help',
    paragraphs: [
      'If you have any question about this policy or how Azora uses AI, email us at feedback@tryazora.app.',
    ],
  },
];
