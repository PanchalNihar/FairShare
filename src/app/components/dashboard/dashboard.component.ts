import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from "../navbar/navbar.component";

@Component({
  selector: 'app-dashboard',
  imports: [NavbarComponent],
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
}