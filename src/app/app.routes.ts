import { Routes } from '@angular/router';
import { SigninComponent } from './components/signin/signin.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SignupComponent } from './components/signup/signup.component';
import { GroupsComponent } from './components/groups/groups.component';
import { ExpenseManagementComponent } from './components/expense-management/expense-management.component';
import { ExpenseTrackingComponent } from './components/expense-tracking/expense-tracking.component';
import { authGuard } from './auth.guard';


export const routes: Routes = [
  {
    path: '',
    component: SigninComponent,
  },
  {
    path: 'signin',
    component: SigninComponent,
  },
  {
    path: 'signup',
    component: SignupComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'groups',
    component: GroupsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'expense-management',
    component: ExpenseManagementComponent,
    canActivate: [authGuard],
  },
  {
    path: 'expense-tracking',
    component: ExpenseTrackingComponent,
    canActivate: [authGuard],
  },
];
