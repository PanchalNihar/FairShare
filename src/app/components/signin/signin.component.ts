import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css'], 
})
export class SigninComponent implements OnInit {
  loginForm!: FormGroup; 

  constructor(private formBuilder: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({ 
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      const loginData = this.loginForm.value;
  
      const registeredUsers = JSON.parse(localStorage.getItem('users') || '[]');
  
      const user = registeredUsers.find(
        (u: any) => u.email === loginData.email && u.password === loginData.password
      );
  
      if (user) {
        // Store logged-in user information
        localStorage.setItem('loggedInUser', JSON.stringify(user));
        alert('Login successful!');
        this.router.navigate(['/dashboard']);
      } else {
        alert('Invalid Email or Password. Please register if you are a new user.');
      }
    } else {
      alert('Please fill out all fields correctly.');
    }
  }
  

  onRegister(): void {
    this.router.navigate(['/signup']);
  }
}
