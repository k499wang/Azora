export interface CleanupPlan {
  title: string;
  objects: string[];
  safetyNote: string | null;
}

function shortText(value: unknown, maximum: number): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximum ? normalized : null;
}

/** The Edge Function is untrusted input too; a bad model response never reaches UI. */
export function parseCleanupPlan(value: unknown): CleanupPlan | null {
  if (value == null || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  // The slideshow never renders the model's title. Keep a safe local fallback
  // so an overly long or omitted title cannot discard a valid object queue.
  const title = shortText(record.title, 240) ?? 'Your cleaning plan';
  if (!Array.isArray(record.objects)) {
    return null;
  }
  const objects = record.objects.map((object) => shortText(object, 120));
  if (objects.length < 1 || objects.length > 20 || objects.some((object) => object == null)) {
    return null;
  }
  const safetyNote = record.safetyNote === '' || record.safetyNote == null
    ? null
    : shortText(record.safetyNote, 220);
  if (record.safetyNote != null && record.safetyNote !== '' && safetyNote == null) return null;
  return { title, objects: objects as string[], safetyNote };
}
