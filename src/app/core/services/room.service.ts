import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Room } from '../models/rooms.model';

@Injectable({
  providedIn: 'root',
})
export class RoomService implements OnDestroy {
  private DEFAULT_ROOM_ID = 'default';

  private roomsSubject = new BehaviorSubject<Room[]>([]);
  rooms$ = this.roomsSubject.asObservable();

  private currentRoomId: string | null = null;
  private isInitialUserAdded = false;

  constructor(private router: Router) {
    this.setupRouteListener();
    this.setupStorageListeners();

    this.ensureDefaultRoom();

    const initialUrl = this.router.url;
    this.handleNavigation(initialUrl);
  }

  public ensureDefaultRoom() {
    const rooms = this.roomsSubject.value;
    if (!rooms.find((r) => r.id === this.DEFAULT_ROOM_ID)) {
      this.updateState([
        ...rooms,
        { id: this.DEFAULT_ROOM_ID, name: this.DEFAULT_ROOM_ID, users: 0 },
      ]);
    }
  }

  private setupRouteListener() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.ensureDefaultRoom();
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
      const existing = this.getRooms().find((r) => r.id === possibleRoomId);

      if (existing) {
        this.enterRoom(possibleRoomId);
      }
    } else {
      this.leaveRoom();
    }
  }

  private setupStorageListeners() {
    window.addEventListener('beforeunload', () => {
      this.leaveRoom(true);
    });
  }

  ngOnDestroy() {
    this.leaveRoom();
  }

  enterRoom(roomId: string) {
    if (this.currentRoomId && this.currentRoomId !== roomId) {
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
      rooms[roomIndex].users = Math.max(0, rooms[roomIndex].users - 1);
    }
    this.updateState(rooms);
  }

  private getRooms(): Room[] {
    return this.roomsSubject.value.map((r) => ({ ...r }));
  }

  private updateState(rooms: Room[]) {
    this.roomsSubject.next(rooms);
  }
}
