import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Room {
  id: string;
  name: string;
  users: number;
}

@Injectable({
  providedIn: 'root', // Singleton service
})
export class RoomService implements OnDestroy {
  private STORAGE_KEY = 'webstudio_rooms';

  // Reactive state of all rooms
  private roomsSubject = new BehaviorSubject<Room[]>([]);
  rooms$ = this.roomsSubject.asObservable();

  // Track which room THIS specific browser tab is currently in
  private currentRoomId: string | null = null;

  constructor() {
    this.loadFromStorage();

    // 1. Listen for updates from OTHER tabs
    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEY) {
        this.loadFromStorage();
      }
    });

    // 2. Listen for "Tab Close" or "Refresh" events
    window.addEventListener('beforeunload', () => {
      this.leaveRoom(); // Automatically remove user when tab closes
    });
  }

  ngOnDestroy() {
    this.leaveRoom();
  }

  enterRoom(roomId: string) {
    if (this.currentRoomId && this.currentRoomId !== roomId) {
      this.leaveRoom();
    }

    if (this.currentRoomId === roomId) return;

    const rooms = this.getRooms();
    const existingRoom = rooms.find((r) => r.id === roomId);

    if (existingRoom) {
      existingRoom.users++;
    } else {
      rooms.push({ id: roomId, name: roomId, users: 1 });
    }

    this.currentRoomId = roomId;
    this.updateState(rooms);
  }

  leaveRoom() {
    if (!this.currentRoomId) return;

    const rooms = this.getRooms();
    const roomIndex = rooms.findIndex((r) => r.id === this.currentRoomId);

    if (roomIndex !== -1) {
      rooms[roomIndex].users--;
    }

    this.currentRoomId = null;
    this.updateState(rooms);
  }

  private getRooms(): Room[] {
    return this.roomsSubject.value.map((r) => ({ ...r }));
  }

  private updateState(rooms: Room[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rooms));
    this.roomsSubject.next(rooms);
  }

  private loadFromStorage() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        this.roomsSubject.next(JSON.parse(data));
      } catch (e) {
        console.error('Error parsing rooms', e);
      }
    }
  }
}
