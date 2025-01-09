import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports:[RouterModule,CommonModule]
})
export class NavbarComponent implements OnInit {
  isLoggedIn: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.checkLoginStatus();
  }

  checkLoginStatus(): void {
    // Check if a user is logged in by verifying localStorage
    this.isLoggedIn = !!localStorage.getItem('loggedInUser');
  }

  logout(): void {
    localStorage.removeItem('loggedInUser');
    this.isLoggedIn = false;
    alert('You have been logged out.');
    this.router.navigate(['/signin']);
  }
}
