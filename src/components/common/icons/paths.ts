// Custom icon set. Each entry is a single SVG <path> / <g> body, already
// styled with stroke="currentColor" fill="none" so the wrapper can swap color.
// ViewBox is always 24x24 so the Icon component can render at any size.

export const ICON_PATHS = {
  'breath-hold': `
    <path fill="currentColor" opacity="0.14" d="M12 3.2c-4.1 0-7.3 3.2-7.3 7.2 0 2.1.9 4 2.3 5.3-.8.5-1.6 1.3-2.1 2.2-.6 1-.9 2-.9 3.1h16c0-1.1-.3-2.2-.9-3.1-.5-.9-1.3-1.7-2.1-2.2 1.4-1.3 2.3-3.2 2.3-5.3 0-4-3.2-7.2-7.3-7.2Z"/>
<path fill="currentColor" d="M12 4c-3.6 0-6.5 2.8-6.5 6.4 0 2.1 1 4 2.7 5.2.2.1.2.4.1.6l-.2.2c-.7.4-1.4 1-1.9 1.7-.5.7-.8 1.6-1 2.5a1 1 0 0 1-2-.2c.2-1.2.6-2.3 1.2-3.3.5-.8 1.2-1.5 2-2.1A8.3 8.3 0 0 1 3.5 10.4C3.5 5.7 7.3 2 12 2s8.5 3.7 8.5 8.4c0 1.8-.6 3.4-1.7 4.8-.5.7-1.1 1.3-1.8 1.8.8.5 1.5 1.3 2 2.1.6 1 1 2.1 1.2 3.3a1 1 0 0 1-2 .2c-.2-.9-.5-1.8-1-2.5s-1.2-1.3-1.9-1.7l-.2-.2c-.1-.2-.1-.5.1-.6 1.7-1.2 2.7-3.1 2.7-5.2C18.5 6.8 15.6 4 12 4Z"/>
<path fill="currentColor" opacity="0.18" d="M8 11.8c.9 0 1.6.6 1.6 1.4S8.9 14.6 8 14.6s-1.6-.6-1.6-1.4.7-1.4 1.6-1.4Zm8 0c.9 0 1.6.6 1.6 1.4s-.7 1.4-1.6 1.4-1.6-.6-1.6-1.4.7-1.4 1.6-1.4Z"/>
<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M8.1 9.8c.5.5 1.2.5 1.8 0m4.2 0c.5.5 1.2.5 1.8 0"/>
<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M10.9 13.8c.5-.5 1.1-.7 1.1-.7s.6.2 1.1.7c.4.4.6.8.6 1.2 0 .8-.8 1.4-1.7 1.4s-1.7-.6-1.7-1.4c0-.4.2-.8.6-1.2Z"/>
<path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M9.3 17.4c.8.5 1.7.8 2.7.8s1.9-.3 2.7-.8"/>
<path fill="currentColor" opacity="0.22" d="M17.4 6.1c.7.2 1.3.8 1.3 1.6 0 .9-.7 1.7-1.7 2-.2.1-.4-.1-.4-.3 0-.3-.1-.6-.2-.9-.1-.4-.3-.7-.5-1-.1-.2 0-.4.2-.5.4-.3.8-.8 1.3-.9Z"/>  `,

  meditation: `
    <circle cx="12" cy="6" r="2.2" stroke="currentColor" stroke-width="2" fill="none" />
    <path d="M9 11l3 2 3-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <path d="M6 20c0-2 1.5-4 3-5h6c1.5 1 3 3 3 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <path d="M5 20h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  `,

  streak: `
    <path d="M12 3c.2 3.2-2.8 4.6-2.8 8.2a4.2 4.2 0 0 0 8.4 0c0-1.7-.7-2.8-1.6-3.8-.5 1-1.2 1.4-2 1.4 0-2.5-2-4-2-5.8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none" />
    <path d="M10.5 16.5a1.8 1.8 0 1 0 3 0c0-1-.9-1.5-1.5-1.5s-1.5.5-1.5 1.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none" />
  `,

  timer: `
    <path d="M10 3h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    <path d="M12 3v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    <circle cx="12" cy="14" r="7" stroke="currentColor" stroke-width="2" fill="none" />
    <path d="M12 10v4l2.5 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  `,

  heart: `
    <path d="M12 20.5s-7.5-4.5-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 3c0 5.7-7.5 10.2-7.5 10.2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none" />
    <path d="M7.5 12.5h2l1.2-2 2 4 1.3-2h2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  `,

  moon: `
    <path d="M20.5 14.3A8 8 0 1 1 9.7 3.5 6.2 6.2 0 0 0 20.5 14.3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none" />
  `,

  sun: `
    <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" fill="none" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M5.1 18.9l1.4-1.4M17.5 6.5l1.4-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  `,

  waves: `
    <path d="M3 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <path d="M3 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
    <path d="M3 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  `,

  // --- Today's insights (stat rings) ---
  'heart-bpm': `
    <path d="M12 20.2c-.3 0-.6-.1-.8-.3C6.7 16.5 4 13.9 4 10.4 4 7.9 5.9 6 8.3 6c1.5 0 2.8.7 3.7 1.9C12.9 6.7 14.2 6 15.7 6 18.1 6 20 7.9 20 10.4c0 3.5-2.7 6.1-7.2 9.5-.2.2-.5.3-.8.3Z" fill="currentColor" opacity="0.18"/> <path d="M12 18.8c-4.1-3.1-6.6-5.4-6.6-8.4 0-1.9 1.4-3.3 3.1-3.3 1.3 0 2.4.7 3.1 1.9.2.3.5.5.8.5s.6-.2.8-.5c.7-1.2 1.8-1.9 3.1-1.9 1.7 0 3.1 1.4 3.1 3.3 0 3-2.5 5.3-6.6 8.4Z" fill="currentColor" opacity="0.25"/> <path d="M6.2 12h3.1l1.1-2.2 1.7 4.5 1.5-2.3h4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/> <path d="M12 18.8c-4.1-3.1-6.6-5.4-6.6-8.4 0-1.9 1.4-3.3 3.1-3.3 1.3 0 2.4.7 3.1 1.9.2.3.5.5.8.5s.6-.2.8-.5c.7-1.2 1.8-1.9 3.1-1.9 1.7 0 3.1 1.4 3.1 3.3 0 3-2.5 5.3-6.6 8.4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
  `,

  'breath-timer': `
   <path fill="currentColor" opacity="0.14" d="M12 5.2a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6Z"/>
<path fill="currentColor" d="M10.1 2.2c0-.6.5-1.1 1.1-1.1h1.6c.6 0 1.1.5 1.1 1.1S13.4 3.3 12.8 3.3h-1.6c-.6 0-1.1-.5-1.1-1.1Zm6.1 1.7c.4-.4 1-.4 1.4 0l1 1c.4.4.4 1 0 1.4s-1 .4-1.4 0l-1-1c-.4-.4-.4-1 0-1.4Z"/>
<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 4.2v1.3"/>
<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 5.2a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6Z"/>
<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 7.7v1.1m0 6.4v1.1m4.3-4.3h-1.1M8.8 12H7.7"/>
<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 12 12 9.4m0 2.6 2.2 1.7"/>
<path fill="currentColor" d="M12 10.9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z"/>
  `,

  'heart-glow': `
    <path fill="currentColor" opacity="0.14" d="M12 20.2c-.3 0-.6-.1-.9-.3C6.3 16.6 3.4 13.8 3.4 9.9c0-2.4 1.9-4.3 4.2-4.3 1.4 0 2.8.7 3.7 1.8.2.2.5.2.7 0 .9-1.1 2.3-1.8 3.7-1.8 2.3 0 4.2 1.9 4.2 4.3 0 3.9-2.9 6.7-7.7 10-.3.2-.6.3-.9.3Z"/>
<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 20.2c-.3 0-.6-.1-.9-.3C6.3 16.6 3.4 13.8 3.4 9.9c0-2.4 1.9-4.3 4.2-4.3 1.4 0 2.8.7 3.7 1.8.2.2.5.2.7 0 .9-1.1 2.3-1.8 3.7-1.8 2.3 0 4.2 1.9 4.2 4.3 0 3.9-2.9 6.7-7.7 10-.3.2-.6.3-.9.3Z"/>
<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 10.1v3.4m-1.7-1.7h3.4"/>
<path fill="currentColor" d="M18.1 2.9l.3 1.2c.1.3.3.5.6.6l1.2.3-1.2.3c-.3.1-.5.3-.6.6l-.3 1.2-.3-1.2a1 1 0 0 0-.6-.6L16 5l1.2-.3c.3-.1.5-.3.6-.6l.3-1.2Z"/>
  `,

  // --- Heart health section ---
  'heart-rmssd': `
<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" d="M5 14h3l1.4 2.2L12 9l2.6 7.2L16 14h3"/>
    `,

  'heart-sdnn': `
    <path fill="currentColor" opacity="0.14" d="M4 18c1.8 0 2.7-1.7 3.6-4 .9-2.4 1.9-5.2 4.4-5.2s3.5 2.8 4.4 5.2c.9 2.3 1.8 4 3.6 4v1H4Z"/>
<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3.5 18h17"/>
<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" d="M4.2 18c1.7 0 2.5-1.7 3.3-4 .9-2.5 2-5.4 4.5-5.4s3.6 2.9 4.5 5.4c.8 2.3 1.6 4 3.3 4"/>
<path fill="none" stroke="currentColor" opacity="0.7" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M12 8.6V18"/>
  `,

  // --- Breathing exercises ---
  'breath-box': `
    <!-- paste concentric rounded squares clipart here -->
  `,

  'breath-moon': `
    <!-- paste crescent moon + stars clipart here -->
  `,

  'breath-lightning': `
    <!-- paste lightning bolt + sparks clipart here -->
  `,

  'breath-wave': `
    <!-- paste stacked wave curves clipart here -->
  `,

  'breath-leaf': `
    <!-- paste leaf + dewdrop clipart here -->
  `,

  apple: `
    <path fill="currentColor" d="M16.37 12.6c-.02-2.34 1.91-3.46 2-3.52-1.09-1.6-2.79-1.81-3.4-1.84-1.45-.15-2.83.85-3.57.85-.74 0-1.88-.83-3.09-.81-1.59.02-3.06.92-3.88 2.34-1.65 2.86-.42 7.09 1.19 9.41.79 1.13 1.72 2.41 2.94 2.36 1.18-.05 1.62-.76 3.05-.76 1.42 0 1.83.76 3.07.74 1.27-.02 2.07-1.15 2.85-2.29.9-1.31 1.27-2.59 1.29-2.66-.03-.01-2.46-.94-2.49-3.74Zm-2.36-6.86c.65-.79 1.09-1.88.97-2.97-.94.04-2.07.62-2.74 1.4-.6.69-1.13 1.81-.99 2.87 1.05.08 2.12-.53 2.76-1.3Z"/>
  `,

  google: `
    <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.39a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.74 2.97-4.32 2.97-7.43Z"/>
    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.12H3.05v2.59A10 10 0 0 0 12 22Z"/>
    <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.81V7.5H3.05a10 10 0 0 0 0 9l3.35-2.6Z"/>
    <path fill="#EA4335" d="M12 5.97c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.95 2.99 14.7 2 12 2A10 10 0 0 0 3.05 7.5L6.4 10.1c.79-2.36 3-4.12 5.6-4.12Z"/>
  `,

  sparkle: `
    <path fill="currentColor" d="M12 2.5c.4 0 .76.27.88.66l1.2 4a3 3 0 0 0 2.06 2.06l4 1.2a.92.92 0 0 1 0 1.76l-4 1.2a3 3 0 0 0-2.06 2.06l-1.2 4a.92.92 0 0 1-1.76 0l-1.2-4a3 3 0 0 0-2.06-2.06l-4-1.2a.92.92 0 0 1 0-1.76l4-1.2a3 3 0 0 0 2.06-2.06l1.2-4A.92.92 0 0 1 12 2.5Z"/>
    <path fill="currentColor" opacity="0.55" d="M19 16.5c.2 0 .38.13.44.32l.45 1.45a1 1 0 0 0 .67.67l1.45.45a.46.46 0 0 1 0 .88l-1.45.45a1 1 0 0 0-.67.67l-.45 1.45a.46.46 0 0 1-.88 0l-.45-1.45a1 1 0 0 0-.67-.67l-1.45-.45a.46.46 0 0 1 0-.88l1.45-.45a1 1 0 0 0 .67-.67l.45-1.45A.46.46 0 0 1 19 16.5Z"/>
  `,

  flask: `
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M9 3h6"/>
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M10 3v5.3L6.5 16.8A2 2 0 0 0 8.3 20h7.4a2 2 0 0 0 1.8-3.2L14 8.3V3"/>
    <path fill="currentColor" opacity="0.14" d="M10.5 14h3l1.2 3H9.3l1.2-3Z"/>
  `,

  microscope: `
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6 18h12"/>
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M8 18v-3a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v3"/>
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 12V7"/>
    <circle cx="12" cy="5" r="2" stroke="currentColor" stroke-width="1.8" fill="none" />
    <path fill="currentColor" opacity="0.14" d="M10 18h4v2h-4z"/>
  `,

  'university-harvard': `
    <path fill="currentColor" opacity="0.14" d="M12 3 19 5 V11 C19 16 15.5 19.5 12 21 C8.5 19.5 5 16 5 11 V5 Z"/>
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 3 19 5 V11 C19 16 15.5 19.5 12 21 C8.5 19.5 5 16 5 11 V5 Z"/>
    <rect x="8" y="8.5" width="2.6" height="3" stroke="currentColor" stroke-width="1.4" fill="none"/>
    <rect x="11.4" y="8.5" width="2.6" height="3" stroke="currentColor" stroke-width="1.4" fill="none"/>
    <rect x="9.7" y="13" width="2.6" height="3" stroke="currentColor" stroke-width="1.4" fill="none"/>
  `,

  'university-stanford': `
    <path fill="currentColor" opacity="0.14" d="M12 3 C10 5 9 7 9 9 C7 9 6 11 7 13 C5.5 13 5 14.5 6 16 H18 C19 14.5 18.5 13 17 13 C18 11 17 9 15 9 C15 7 14 5 12 3 Z"/>
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 3 C10 5 9 7 9 9 C7 9 6 11 7 13 C5.5 13 5 14.5 6 16 H18 C19 14.5 18.5 13 17 13 C18 11 17 9 15 9 C15 7 14 5 12 3 Z"/>
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 16 V21"/>
  `,

  'research-paper': `
    <path fill="currentColor" opacity="0.14" d="M6.5 3 H14 L18 7 V20 A1 1 0 0 1 17 21 H6.5 A1 1 0 0 1 5.5 20 V4 A1 1 0 0 1 6.5 3 Z"/>
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6.5 3 H14 L18 7 V20 A1 1 0 0 1 17 21 H6.5 A1 1 0 0 1 5.5 20 V4 A1 1 0 0 1 6.5 3 Z"/>
    <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M14 3 V7 H18"/>
    <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M9 13.5 V17 M12 11.5 V17 M15 14.5 V17"/>
  `,

  journal: `
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
    <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M8 4v16"/>
    <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M11 9h5"/>
    <path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M11 13h4"/>
    <path fill="currentColor" opacity="0.12" d="M4 4h4v16H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
  `,
} as const;

export type IconName = keyof typeof ICON_PATHS;
