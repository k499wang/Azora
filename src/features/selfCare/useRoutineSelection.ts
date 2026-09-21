import { useRef, useState } from 'react';

/** Keep the displayed selection intact when a query refresh changes capacity. */
export function useRoutineSelection(
  ids: string[],
  availableSlots: number,
  ready: boolean,
  pending: boolean,
  initiallySelectAll = false,
) {
  const [selection, setSelection] = useState<string[]>(() => initiallySelectAll ? ids : []);
  const submitting = useRef(false);
  const selectedIds = selection.filter((id) => ids.includes(id));
  const locked = !ready || pending;
  const overCapacity = selectedIds.length > availableSlots;
  const allSelected = selectedIds.length > 0
    && selectedIds.length >= Math.min(ids.length, availableSlots);
  const canSubmit = !locked && selectedIds.length > 0 && !overCapacity;

  const toggle = (id: string) => {
    if (locked || submitting.current) return;
    setSelection((current) => {
      const valid = current.filter((entry) => ids.includes(entry));
      return valid.includes(id)
        ? valid.filter((entry) => entry !== id)
        : valid.length >= availableSlots ? valid : [...valid, id];
    });
  };
  const toggleAll = () => {
    if (locked || submitting.current) return;
    setSelection(allSelected ? [] : ids.slice(0, availableSlots));
  };
  const submit = async (action: () => Promise<unknown>) => {
    if (!canSubmit || submitting.current) return;
    submitting.current = true;
    try {
      await action();
      setSelection([]);
    } catch {
      // The mutation owns the error displayed by the screen.
    } finally {
      submitting.current = false;
    }
  };

  return { selectedIds, locked, overCapacity, allSelected, canSubmit, toggle, toggleAll, submit };
}
