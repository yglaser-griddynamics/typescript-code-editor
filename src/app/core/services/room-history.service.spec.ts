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
    spyOn(localStorage, 'getItem').and.callFake((key) => mockStore[key] || null);
    spyOn(localStorage, 'setItem').and.callFake((key, val) => (mockStore[key] = val));
    spyOn(localStorage, 'removeItem').and.callFake((key) => delete mockStore[key]);
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
