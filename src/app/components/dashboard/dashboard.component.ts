import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from "../navbar/navbar.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [NavbarComponent,CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  constructor(private router:Router) { }
  openGroup(){
    this.router.navigate(['/groups']);
  }
  openExpenseManagement(){
    this.router.navigate(['/expense-management']);
  }
  openExpenseTracking(){
    this.router.navigate(['/expense-tracking']);
  }
  openProfile(){
    this.router.navigate(['/profile']);
  }
}