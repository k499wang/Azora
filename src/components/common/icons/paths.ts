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
} as const;

export type IconName = keyof typeof ICON_PATHS;
