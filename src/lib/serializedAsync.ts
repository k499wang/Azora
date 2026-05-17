export interface SerializedAsync {
  run<T>(task: () => Promise<T>): Promise<T>;
}

export function createSerializedAsync(): SerializedAsync {
  let tail: Promise<unknown> = Promise.resolve();

  return {
    run<T>(task: () => Promise<T>): Promise<T> {
      const next = tail.then(task, task);
      tail = next.catch(() => undefined);
      return next;
    },
  };
}
