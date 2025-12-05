import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { YjsWebsocketService } from './yjs-websocket.service';

vi.mock('y-websocket', () => {
  return {
    WebsocketProvider: class {
      shouldConnect = true;
      awareness = { getStates: () => new Map() };
      disconnect = vi.fn();
      destroy = vi.fn();
      on = vi.fn((event, cb) => {
        if (event === 'sync') cb(true);
      });
      off = vi.fn();
    },
  };
});

describe('YjsWebsocketService', () => {
  let service: YjsWebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(YjsWebsocketService);
  });

  afterEach(() => {
    vi.clearAllMocks();
    service.destroy();
  });

  it('should connect and create provider', async () => {
    await service.connect('room-1');
    expect(service.provider).toBeDefined();
    expect(service.ydoc).toBeDefined();
  });

  it('should not reconnect if already connected to same room', async () => {
    await service.connect('room-1');
    const pid = service.provider;

    await service.connect('room-1');
    expect(service.provider).toBe(pid);
  });

  it('should switch rooms correctly', async () => {
    await service.connect('room-1');
    const prevProvider = service.provider;

    await service.connect('room-2');

    expect(prevProvider?.disconnect).toHaveBeenCalled();
    expect(prevProvider?.destroy).toHaveBeenCalled();
    expect(service.provider).not.toBe(prevProvider);
  });

  it('should expose shared text', () => {
    const text = service.getSharedText('test');
    expect(text).toBeDefined();
  });
});
