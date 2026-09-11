# Font preview lab

The preview switch changes the whole app while preserving its existing type sizes,
line heights, and `fonts.*` API. It is development-only; production always uses
Balsamiq Sans.

Open `src/theme/fontPreview.ts` and change `ACTIVE_FONT_PREVIEW` to one of:

```ts
export const ACTIVE_FONT_PREVIEW: FontPreviewName = 'fredoka';
```

Valid values are `balsamiq`, `fredoka`, and `outfit` (the app's original font).
Save the file and Fast Refresh will update the running app; no Expo restart or
native rebuild is needed. Production builds always use Balsamiq Sans regardless
of this value. Fredoka maps light body copy to its Regular 400 face so descriptions
remain readable while its title emphasis stays deliberately softer.

Capture the same screens at the same device size for each candidate. After choosing
a winner, map it permanently in `src/theme/typography.ts`, remove
`src/theme/fontPreview.ts` and this file, remove unused font imports/packages, and
keep only the winning faces in `App.tsx`.
