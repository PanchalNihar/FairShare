import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomModalComponent } from '../../shared/custom-modal/custom-modal.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CustomModalComponent,
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  providers: [AuthService],
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
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
    this.signupForm = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onRegister() {
    if (this.signupForm.valid) {
      const { email, password, username } = this.signupForm.value;

      let result = await this.auth.signUp(email, password, username);
      if (result) {
        localStorage.setItem('signupResult', JSON.stringify(result));
        this.openModal('Success', 'Successfully registered!', 'success');
        this.router.navigate(['/signin']);
      }
    } else {
      this.openModal(
        'Error',
        'Invalid form. Please check your inputs.',
        'error',
      );
    }
  }
  onLogin() {
    this.router.navigate(['/signin']);
  }
  closeModal() {
    this.isModalOpen = false;
  }
}
