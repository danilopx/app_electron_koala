import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginService } from '../../service/login.service';

import { GridFormComponent } from './grid-form/grid-form.component';
import { GridListComponent } from './grid-list/grid-list.component';
import { GridViewComponent } from './grid-view/grid-view.component';

const routes: Routes = [
  { path: '', component: GridListComponent,canActivate: [LoginService]  },
  { path: 'new', component: GridFormComponent ,canActivate: [LoginService] },
  { path: 'view/:id', component: GridViewComponent,canActivate: [LoginService]  },
  { path: 'edit/:id', component: GridFormComponent,canActivate: [LoginService]  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]

})
export class GridRoutingModule { }
