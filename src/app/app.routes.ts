import { Routes } from '@angular/router';
import { SigninComponent } from './components/signin/signin.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SignupComponent } from './components/signup/signup.component';
import { GroupsComponent } from './components/groups/groups.component';
import { ExpenseManagementComponent } from './components/expense-management/expense-management.component';
import { ExpenseTrackingComponent } from './components/expense-tracking/expense-tracking.component';
import { authGuard } from './auth.guard';
import { noAuthGuard } from './no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: SigninComponent,
    // canActivate: [noAuthGuard],
  },
  {
    path: 'signin',
    component: SigninComponent,
    // canActivate: [noAuthGuard],
  },
  {
    path: 'signup',
    component: SignupComponent,
    // canActivate: [noAuthGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    // canActivate: [authGuard],
  },
  {
    path: 'groups',
    component: GroupsComponent,
    // canActivate: [authGuard],
  },
  {
    path: 'expense-management',
    component: ExpenseManagementComponent,
    // canActivate: [authGuard],
  },
  {
    path: 'expense-tracking',
    component: ExpenseTrackingComponent,
    // canActivate: [authGuard],
  },
];
