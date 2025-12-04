import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Room } from '../models/rooms.model';

@Injectable({
  providedIn: 'root',
})
export class RoomService implements OnDestroy {
  private STORAGE_KEY = 'webstudio_rooms';
  private DEFAULT_ROOM_ID = 'default';

  private roomsSubject = new BehaviorSubject<Room[]>([
    { id: this.DEFAULT_ROOM_ID, name: this.DEFAULT_ROOM_ID, users: 0 },
  ]);
  rooms$ = this.roomsSubject.asObservable();

  private currentRoomId: string | null = null;
  private isInitialUserAdded = false;

  constructor(private router: Router) {
    this.loadFromStorage();
    this.setupRouteListener();
    this.setupStorageListeners();

    const initialUrl = this.router.url;
    this.handleNavigation(initialUrl);
  }

  private setupRouteListener() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        this.handleNavigation(url);
      });
  }

  private handleNavigation(url: string) {
    if (url === '/' || url === '') {
      this.leaveRoom();
      return;
    }

    const possibleRoomId = url.substring(1).split('?')[0].split('#')[0];

    if (possibleRoomId) {
      console.log(`Navigating to room: ${possibleRoomId}`);
      this.enterRoom(possibleRoomId);
    } else {
      this.leaveRoom();
    }
  }

  private setupStorageListeners() {
    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEY) {
        this.loadFromStorage();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.leaveRoom(true);
    });
  }

  ngOnDestroy() {
    this.leaveRoom();
  }

  enterRoom(roomId: string) {
    if (this.currentRoomId && this.currentRoomId !== roomId) {
      console.log(`Leaving previous room: ${this.currentRoomId}`);
      this.decrementUserCount(this.currentRoomId);
    }

    if (this.currentRoomId === roomId && this.isInitialUserAdded) return;

    const rooms = this.getRooms();
    let existingRoom = rooms.find((r) => r.id === roomId);

    if (existingRoom) {
      existingRoom.users++;
    } else {
      rooms.push({ id: roomId, name: roomId, users: 1 });
    }

    this.currentRoomId = roomId;
    this.isInitialUserAdded = true;
    this.updateState(rooms);
  }

  leaveRoom(isHardLeave: boolean = false) {
    if (!this.currentRoomId) return;

    this.decrementUserCount(this.currentRoomId);

    if (!isHardLeave) {
      this.currentRoomId = null;
    }

    this.isInitialUserAdded = false;
  }

  private decrementUserCount(roomId: string) {
    const rooms = this.getRooms();
    const roomIndex = rooms.findIndex((r) => r.id === roomId);

    if (roomIndex !== -1) {
      const currentUsers = rooms[roomIndex].users;

      rooms[roomIndex].users = Math.max(0, currentUsers - 1);
    }

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
        const loadedRooms: Room[] = JSON.parse(data);

        if (!loadedRooms.find((r) => r.id === this.DEFAULT_ROOM_ID)) {
          loadedRooms.push({ id: this.DEFAULT_ROOM_ID, name: this.DEFAULT_ROOM_ID, users: 0 });
        }
        this.roomsSubject.next(loadedRooms);
      } catch (e) {
        console.error('Error parsing rooms', e);
      }
    }
  }
}
