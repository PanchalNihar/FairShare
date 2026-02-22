import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { CustomModalComponent } from '../../shared/custom-modal/custom-modal.component';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CustomModalComponent,
  ],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'],
})
export class SigninComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  private authSubscription?: Subscription;
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'warning' | 'info' = 'info';
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private auth: AuthService,
  ) {}
  openModal(title: string, message: string, type: any = 'info') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.isModalOpen = true;
  }
  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/about']);
    }
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.authSubscription = this.auth.currentUser$.subscribe((user) => {
      if (user) {
        this.router.navigate(['/about']);
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async onLogin() {
    if (this.loginForm.valid) {
      try {
        const { email, password } = this.loginForm.value;
        const result = await this.auth.signIn(email, password);
        if (result) {
          this.router.navigate(['/about']);
        }
      } catch (error: any) {
        this.handleError(error);
      }
    }
  }
  async onGoogleSignIn() {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('Google Sign-in sucessfull: ', user);
      this.router.navigate(['/about']);
    } catch (err) {
      console.error(err);
      this.openModal('Google Sign-in Failed', 'Failed to sign in with Google. Please try again later.', 'error');
    }
  }
  private handleError(error: any): void {
    let errorMessage = 'An error occurred during login.';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email format.';
    }
    this.openModal('Login Error', errorMessage, 'error');
  }
  onRegister(): void {
    this.router.navigate(['/signup']);
  }
  closeModal() {
    this.isModalOpen = false;
  }
}
