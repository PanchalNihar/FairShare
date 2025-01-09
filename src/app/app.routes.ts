import { Routes } from '@angular/router';
import { SigninComponent } from './components/signin/signin.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SignupComponent } from './components/signup/signup.component';
import { GroupsComponent } from './components/groups/groups.component';
import { ExpenseManagementComponent } from './components/expense-management/expense-management.component';
import { ExpenseTrackingComponent } from './components/expense-tracking/expense-tracking.component';

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
  },
  {
    path:'groups',
    component:GroupsComponent
  },
  {
    path:'expense-management',
    component:ExpenseManagementComponent
  },
  {
    path:'expense-tracking',
    component:ExpenseTrackingComponent
  }
];
