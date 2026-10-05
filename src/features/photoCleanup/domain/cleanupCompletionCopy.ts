/** Removed items clear the list but do not count as completed cleanup. */
export function cleanupCompletionCopy(completedCount: number) {
  if (completedCount === 0) {
    return {
      title: 'List cleared',
      subtitle: 'No items were marked done. You can try another spot whenever you’re ready.',
    };
  }
  return {
    title: 'You made a little space',
    subtitle: `You put away ${completedCount} ${completedCount === 1 ? 'thing' : 'things'}. That’s a real win.`,
  };
}
