import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.component.html',
  styleUrls: ['../room-admin.component.css'],
  standalone: false,
})
export class RoomListComponent {
  @Input() rooms: any[] | null = [];
  @Output() roomClicked = new EventEmitter<string>();
}
