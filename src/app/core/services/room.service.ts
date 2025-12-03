import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Room } from '../models/rooms.model';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private mockRooms: Room[] = [
    { id: 'room-one', name: 'Project 1', users: 3 },
    { id: 'room-beta', name: 'Beta Testing', users: 1 },
  ];

  private roomsSubject = new BehaviorSubject<Room[]>(this.mockRooms);

  get rooms$(): Observable<Room[]> {
    return this.roomsSubject.asObservable();
  }

  addRoom(roomId: string): void {
    const exists = this.mockRooms.find((r) => r.id === roomId);
    if (exists) return;

    const newRoom: Room = {
      id: roomId,
      name: roomId,
      users: 1,
    };

    this.mockRooms = [...this.mockRooms, newRoom];

    this.roomsSubject.next(this.mockRooms);
  }
}
