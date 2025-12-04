import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoomAdminComponent } from './room-admin.component';
import { RoomService } from '../../../core/services/room.service';
import { Router } from '@angular/router';
import { of, firstValueFrom } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { vi } from 'vitest';

describe('RoomAdminComponent', () => {
  let component: RoomAdminComponent;
  let fixture: ComponentFixture<RoomAdminComponent>;
  let mockRoomService: {
    enterRoom: ReturnType<typeof vi.fn>;
    leaveRoom: ReturnType<typeof vi.fn>;
    rooms$: any;
  };

  let mockRouter: {
    navigate: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockRoomService = {
      enterRoom: vi.fn(),
      leaveRoom: vi.fn(),
      rooms$: of([{ id: 'mock-room', name: 'Mock', users: 0 }]),
    };

    mockRouter = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      declarations: [RoomAdminComponent],
      providers: [
        { provide: RoomService, useValue: mockRoomService },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RoomAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should ensure user leaves any previous room on init', () => {
    expect(mockRoomService.leaveRoom).toHaveBeenCalled();
  });

  it('should initialize rooms$ from service', async () => {
    const rooms = await firstValueFrom(component.rooms$);

    expect(rooms.length).toBe(1);
    expect(rooms[0].id).toBe('mock-room');
  });

  it('enterRoom should do nothing if roomId is empty', () => {
    component.enterRoom('');
    expect(mockRoomService.enterRoom).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('enterRoom should enter room and navigate when roomId is valid', () => {
    const roomId = 'new-session';
    component.enterRoom(roomId);    
    expect(mockRoomService.enterRoom).toHaveBeenCalledWith(roomId);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/', roomId]);
    expect(component.inputRoomId).toBe('');
  });
});
