import { useRef, useState } from 'react';

/** Keep the displayed selection intact when a query refresh changes capacity. */
export function useRoutineSelection(
  ids: string[],
  ready: boolean,
  pending: boolean,
  initiallySelectAll = false,
) {
  const [selection, setSelection] = useState<string[]>(() => initiallySelectAll ? ids : []);
  const submitting = useRef(false);
  const selectedIds = selection.filter((id) => ids.includes(id));
  const locked = !ready || pending;
  const allSelected = selectedIds.length > 0 && selectedIds.length === ids.length;
  const canSubmit = !locked && selectedIds.length > 0;

  const toggle = (id: string) => {
    if (locked || submitting.current) return;
    setSelection((current) => {
      const valid = current.filter((entry) => ids.includes(entry));
      return valid.includes(id)
        ? valid.filter((entry) => entry !== id)
        : [...valid, id];
    });
  };
  const toggleAll = () => {
    if (locked || submitting.current) return;
    setSelection(allSelected ? [] : ids);
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

  return { selectedIds, locked, allSelected, canSubmit, toggle, toggleAll, submit };
}
