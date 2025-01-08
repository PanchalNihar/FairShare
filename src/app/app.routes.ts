import { Routes } from '@angular/router';
import { SigninComponent } from './components/signin/signin.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SignupComponent } from './components/signup/signup.component';

export const routes: Routes = [
  {
    path: '',
    component: SigninComponent,
  },
  {
    path:'dashboard',
    component:DashboardComponent
  },
  {
    path: 'signin',
    component:SigninComponent
  },
  {
    path:'signup',
    component:SignupComponent
  }
];
