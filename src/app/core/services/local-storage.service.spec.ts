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
    spyOn(localStorage, 'getItem').and.callFake((key) => store[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key, val) => (store[key] = val));
    spyOn(localStorage, 'removeItem').and.callFake((key) => delete store[key]);
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
    const consoleSpy = spyOn(console, 'error');

    expect(service.get('broken')).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
  });
});
