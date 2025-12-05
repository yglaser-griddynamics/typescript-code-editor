import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let store: Record<string, string> = {};

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageService);

    // Reset store
    store = {};

    // Mock Storage prototype for localStorage interaction
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => (store[key] = val));
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => delete store[key]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse JSON automatically', () => {
    const data = { foo: 'bar' };
    service.set('test', data);

    expect(store['test']).toBe(JSON.stringify(data));
    expect(service.get('test')).toEqual(data);
  });

  it('should return null for missing keys', () => {
    expect(service.get('ghost')).toBeNull();
  });

  it('should handle raw strings', () => {
    service.set('str', 'hello');
    expect(service.get('str')).toBe('hello');
  });

  it('should catch JSON parse errors', () => {
    store['broken'] = '{ bad }';
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(service.get('broken')).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
