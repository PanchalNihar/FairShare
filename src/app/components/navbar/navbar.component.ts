import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2 } from '@angular/core';
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
  isDarkMode = false;
  constructor(
    private router: Router,
    private auth: AuthService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user) => {
      // Update the login status based on the current user
      this.isLoggedIn = !!user;
    });
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark-theme';
    } else {
      const preferesDark = window.matchMedia(
        '(preferes-color-scheme:dark)'
      ).matches;
      this.isDarkMode = preferesDark;
    }
    if(this.isDarkMode){
      this.renderer.addClass(document.body,'dark-theme')
    }
  }
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      this.renderer.addClass(document.body, 'dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }
  logout(): void {
    this.auth
      .signOut()
      .then(() => {
        localStorage.removeItem('loggedInUser'); // Clear logged-in user data from localStorage
        this.isLoggedIn = false; // Update the login status
        alert('You have been logged out.');
        this.router.navigate(['/signin']); // Navigate to the sign-in page
      })
      .catch((error) => {
        console.error('Logout error:', error);
        alert('An error occurred while logging out.');
      });
  }
}
