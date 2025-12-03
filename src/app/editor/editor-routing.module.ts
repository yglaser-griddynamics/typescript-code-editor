import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'default-room',
    pathMatch: 'full',
  },
  {
    path: ':roomId',
    loadComponent: () => import('./editor/editor').then((m) => m.Editor),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditorRoutingModule {}
