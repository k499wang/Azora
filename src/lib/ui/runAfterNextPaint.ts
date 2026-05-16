export function runAfterNextPaint<T>(task: () => T | Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          Promise.resolve()
            .then(task)
            .then(resolve, reject);
        }, 0);
      });
    });
  });
}
