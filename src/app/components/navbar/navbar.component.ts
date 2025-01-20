import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [RouterModule, CommonModule],
})
export class NavbarComponent implements OnInit {
  isLoggedIn: boolean = false;

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user) => {
      // Update the login status based on the current user
      this.isLoggedIn = !!user;
    });
  }

  logout(): void {
    this.auth.signOut().then(() => {
      localStorage.removeItem('loggedInUser'); // Clear logged-in user data from localStorage
      this.isLoggedIn = false; // Update the login status
      alert('You have been logged out.');
      this.router.navigate(['/signin']); // Navigate to the sign-in page
    }).catch((error) => {
      console.error('Logout error:', error);
      alert('An error occurred while logging out.');
    });
  }
}
