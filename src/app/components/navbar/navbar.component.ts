import { CommonModule } from '@angular/common';
import { Component, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [RouterModule, CommonModule],
  encapsulation: ViewEncapsulation.None,
})
export class NavbarComponent implements OnInit {
  isLoggedIn: boolean = false;
  isMobileMenuOpen = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      this.renderer.setStyle(document.body, 'overflow', 'hidden');
    } else {
      this.renderer.removeStyle(document.body, 'overflow');
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    this.renderer.removeStyle(document.body, 'overflow');
  }

  logout(): void {
    const confirmed = confirm('Are you sure you want to logout?');
    if (!confirmed) {
      return;
    }

    this.auth
      .signOut()
      .then(() => {
        localStorage.removeItem('loggedInUser');
        this.isLoggedIn = false;
        this.closeMobileMenu();
        this.router.navigate(['/signin']);
      })
      .catch((error) => {
        console.error('Logout error:', error);
        alert('An error occurred while logging out. Please try again.');
      });
  }
}
