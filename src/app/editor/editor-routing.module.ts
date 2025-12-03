import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Editor } from './editor/editor';

const routes: Routes = [
  {
    path: '',
    component: Editor,
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditorRoutingModule {}
