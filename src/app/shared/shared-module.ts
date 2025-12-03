import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomAdminComponent } from './components/room-admin/room-admin';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [RoomAdminComponent],
  imports: [CommonModule, FormsModule],
  exports: [RoomAdminComponent, FormsModule, CommonModule],
})
export class SharedModule {}
