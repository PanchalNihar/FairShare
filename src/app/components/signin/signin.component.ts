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

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'],
})
export class SigninComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  private authSubscription?: Subscription;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    // Subscribe to authentication state changes
    // this.authSubscription = this.auth.currentUser$.subscribe(user => {
    //   if (user) {
    //     console.log('User is authenticated:', user.email);
    //     this.router.navigate(['/about']);
    //   }
    // });
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
        console.error('Login error:', error);
        let errorMessage = 'An error occurred during login.';

        if (error.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'Invalid password.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email format.';
        }

        alert(errorMessage);
      }
    } else {
      // Form validation error handling remains the same
    }
  }

  onRegister(): void {
    this.router.navigate(['/signup']);
  }
}
