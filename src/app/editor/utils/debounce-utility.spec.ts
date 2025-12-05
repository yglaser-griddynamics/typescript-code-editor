import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { debouncePromise } from './debunce-utility';

describe('debouncePromise', () => {
  vi.useFakeTimers();
  // Explicitly type these to satisfy TypeScript
  let mockFn: Mock;
  let debouncedFn: (...args: any[]) => Promise<any>;

  beforeEach(() => {
    mockFn = vi.fn().mockResolvedValue('success');
    debouncedFn = debouncePromise(mockFn, 100);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  it('should wait for the delay before executing', async () => {
    const promise = debouncedFn();

    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    await expect(promise).resolves.toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should only resolve the last call when typed rapidly', async () => {
    const p1 = debouncedFn(1);
    const p2 = debouncedFn(2);
    const p3 = debouncedFn(3);

    vi.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(3);

    await expect(p3).resolves.toBe('success');
  });

  it('should handle errors gracefully', async () => {
    mockFn.mockRejectedValue(new Error('Network Error'));

    const promise = debouncedFn();
    vi.advanceTimersByTime(100);

    await expect(promise).rejects.toThrow('Network Error');
  });

  it('should preserve the "this" context', async () => {
    const context = { id: 'editor-1' };
    const contextFn = vi.fn(function (this: { id: string }) {
      return Promise.resolve(this.id);
    });
    const debouncedContext = debouncePromise(contextFn, 100);

    const promise = debouncedContext.call(context);
    vi.advanceTimersByTime(100);

    await expect(promise).resolves.toBe('editor-1');
  });
});
