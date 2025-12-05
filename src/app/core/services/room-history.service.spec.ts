import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RoomHistoryService } from './room-history.service';

describe('RoomHistoryService', () => {
  let service: RoomHistoryService;
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoomHistoryService);

    // Mock storage
    mockStore = {};

    // In Vitest, spy on Storage.prototype to capture localStorage calls
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockStore[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => (mockStore[key] = val));
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => delete mockStore[key]);
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Important to clear spies between tests
  });

  it('should save snapshots', () => {
    service.saveSnapshot('room-1', 'content');
    const history = service.listSnapshots('room-1');
    expect(history[0].text).toBe('content');
  });

  it('should cap history at 50 items', () => {
    for (let i = 0; i < 55; i++) {
      service.saveSnapshot('room-1', `update-${i}`);
    }

    const history = service.listSnapshots('room-1');
    expect(history.length).toBe(50);
    expect(history[0].text).toBe('update-54'); // Most recent first
  });

  it('should restore snapshot by id', () => {
    service.saveSnapshot('room-1', 'important-code');
    const id = service.listSnapshots('room-1')[0].id;

    const text = service.restoreSnapshot('room-1', id);
    expect(text).toBe('important-code');
  });

  it('should handle corrupted localstorage data', () => {
    mockStore['editor_history_room-1'] = '{ bad json }';
    expect(service.listSnapshots('room-1')).toEqual([]);
  });

  it('should clear room history', () => {
    service.saveSnapshot('room-1', 'data');
    service.clearHistory('room-1');
    expect(localStorage.removeItem).toHaveBeenCalledWith('editor_history_room-1');
  });
});
