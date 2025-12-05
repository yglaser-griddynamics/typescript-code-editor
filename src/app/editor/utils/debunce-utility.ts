export function debouncePromise<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number
): T {
  let timeoutTimer: ReturnType<typeof setTimeout> | undefined;
  let currentResolve: ((result: any) => void) | undefined;
  let currentReject: ((reason?: any) => void) | undefined;

  return function (this: any, ...args: Parameters<T>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
      }
      currentResolve = resolve;
      currentReject = reject;

      timeoutTimer = setTimeout(async () => {
        try {
          const result = await func.apply(this, args);
          if (currentResolve === resolve) {
            resolve(result);
          }
        } catch (error) {
          if (currentReject === reject) {
            reject(error);
          }
        }
        timeoutTimer = undefined;
      }, delay);
    });
  } as T;
}
