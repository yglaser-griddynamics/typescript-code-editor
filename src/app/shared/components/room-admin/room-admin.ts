import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';

@Component({
  selector: 'app-room-admin',
  templateUrl: './room-admin.component.html',
  styleUrls: ['./room-admin.component.css'],
  standalone: false,
})
export class RoomAdminComponent {
  inputRoomId: string = '';
  rooms$;

  constructor(private roomService: RoomService, private router: Router) {
    this.rooms$ = this.roomService.rooms$;
  }

  enterRoom(roomId: string) {
    if (!roomId.trim()) return;
    this.roomService.addRoom(roomId);
    this.router.navigate(['/', roomId]);
    this.inputRoomId = '';
  }
}
