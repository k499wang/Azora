/** Goal timestamps are absolute, but the list is grouped by device-local day. */
export function selfCareGoalExistedOnLocalDate(
  row: { created_at: string; archived_at: string | null },
  localDate: string,
): boolean {
  const dayEnd = new Date(`${localDate}T23:59:59.999`).getTime();
  return new Date(row.created_at).getTime() <= dayEnd
    && (row.archived_at == null || new Date(row.archived_at).getTime() > dayEnd);
}
