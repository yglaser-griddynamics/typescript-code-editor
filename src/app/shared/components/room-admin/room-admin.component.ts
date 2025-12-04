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
  }

  enterRoom(roomId: string) {
    if (!roomId.trim()) return;
    this.router.navigate(['/', roomId]);
    this.inputRoomId = '';
  }
}
