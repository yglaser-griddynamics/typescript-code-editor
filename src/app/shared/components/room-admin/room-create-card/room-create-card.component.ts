import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-room-create-card',
  templateUrl: './room-create-card.component.html',
  styleUrls: ['../room-admin.component.css'],
  standalone: false,
})
export class RoomCreateCardComponent {
  @Output() roomSelected = new EventEmitter<string>();
  inputRoomId = '';

  submit() {
    if (!this.inputRoomId.trim()) return;
    this.roomSelected.emit(this.inputRoomId);
    this.inputRoomId = '';
  }
}
