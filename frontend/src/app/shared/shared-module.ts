import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoomAdminComponent } from './components/room-admin/room-admin.component';

import { RoomCreateCardComponent } from './components/room-admin/room-create-card/room-create-card.component';
import { RoomListComponent } from './components/room-admin/room-list/room-list.component';
import { NavBar } from './components/nav-bar/nav-bar';
@NgModule({
  declarations: [NavBar,RoomAdminComponent, RoomCreateCardComponent, RoomListComponent],
  imports: [CommonModule, FormsModule],
  exports: [
    RoomAdminComponent,
    FormsModule,
    CommonModule,
    RoomCreateCardComponent,
    RoomListComponent,
    NavBar
  ],
})
export class SharedModule {}
