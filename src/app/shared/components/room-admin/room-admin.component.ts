import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';

@Component({
  selector: 'app-room-admin',
  templateUrl: './room-admin.component.html',
  styleUrls: ['./room-admin.component.css'],
  standalone: false,
})
export class RoomAdminComponent implements OnInit {
  inputRoomId: string = '';
  rooms$;

  constructor(private roomService: RoomService, private router: Router) {
    this.rooms$ = this.roomService.rooms$;
  }

  ngOnInit() {
    this.roomService.leaveRoom();
    this.roomService.ensureDefaultRoom();
  }

  enterRoom(roomId: string) {
    const roomIdWithoutSpaces = roomId.replace(/\s/g, '-').toLowerCase();

    if (!roomId.trim()) return;
    this.roomService.enterRoom(roomIdWithoutSpaces);
    this.router.navigate(['/', roomIdWithoutSpaces]);
    this.inputRoomId = '';
  }
}
