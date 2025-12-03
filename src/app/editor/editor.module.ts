import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorRoutingModule } from './editor-routing.module';
import { Editor } from './editor/editor';

@NgModule({
  declarations: [Editor],
  imports: [CommonModule, EditorRoutingModule],
})
export class EditorModule {}
