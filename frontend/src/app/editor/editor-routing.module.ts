import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'default',
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
