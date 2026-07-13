import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Renderer2, ViewEncapsulation } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CustomModalComponent } from '../../shared/custom-modal/custom-modal.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  imports: [RouterModule, CommonModule,CustomModalComponent],
  encapsulation: ViewEncapsulation.None,
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  isMobileMenuOpen = false;
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'warning' | 'info' = 'info';
  private routerSub?: Subscription;

  isConfirmMode: boolean = false;
  constructor(
    private router: Router,
    private auth: AuthService,
    private renderer: Renderer2,
  ) {}
  openModal(title: string, message: string, type: any = 'info') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.isConfirmMode = false;
    this.isModalOpen = true;
  }
  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
    });

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.closeMobileMenu();
    });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
    this.renderer.removeStyle(document.body, 'overflow');
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
  closeModal() {
    this.isModalOpen = false;
  }
  onModalConfirm() {
    this.closeModal();
    if (this.isConfirmMode) {
      this.executeLogout();
    }
  }
  logout(): void {
    this.modalTitle = 'Confirm Logout';
    this.modalMessage = 'Are you sure you want to logout?';
    this.modalType = 'warning';
    this.isConfirmMode = true;
    this.isModalOpen = true;
  }
  executeLogout(): void {
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
        this.openModal('Error', 'An error occurred while logging out. Please try again.', 'error');
      });
  }
}
