import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,FormsModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'], 
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup; 

  constructor(private formBuilder: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.signupForm = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onRegister() {
    if (this.signupForm.valid) {
      const registeredData = this.signupForm.value;
  
      // Prevent duplicate emails
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const emailExists = users.some((user: any) => user.email === registeredData.email);
  
      if (emailExists) {
        alert('This email is already registered. Please use a different email.');
        return;
      }
  
      // Add new user
      users.push(registeredData);
      localStorage.setItem('users', JSON.stringify(users));
  
      alert('Registration successful! Redirecting to sign-in page...');
      this.router.navigate(['signin']);
    } else {
      alert('Invalid form. Please check your inputs.');
    }
  }
  
}
