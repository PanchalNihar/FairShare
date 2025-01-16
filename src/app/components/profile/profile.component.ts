import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from "../navbar/navbar.component";
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [NavbarComponent, FormsModule, CommonModule],
})
export class ProfileComponent implements OnInit {
  user: any;
  profileImage: string | ArrayBuffer | null = null;
  isEditing: boolean = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || 'null');
    
    if (loggedInUser) {
      this.user = loggedInUser;
      this.profileImage = loggedInUser.profileImage || null;
    } else {
      this.router.navigate(['/signin']);
    }
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
  }

  onUpdateProfile(): void {
    if (this.user.username && this.user.email) {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const currentUser = users.find((u: any) => u.email === this.user.email);

      if (currentUser) {
        currentUser.username = this.user.username;
        currentUser.email = this.user.email;
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
      }

      alert('Profile updated successfully!');
      this.isEditing = false;
    } else {
      alert('Please fill out all fields.');
    }
  }

  triggerImageUpload(): void {
    const fileInput = document.getElementById('profileImageInput') as HTMLInputElement;
    fileInput?.click();
  }

  onImageUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const render = new FileReader();
      render.onload = () => {
        this.profileImage = render.result;
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const currentUser = users.find((user: any) => user.email === this.user.email);

        if (currentUser) {
          currentUser.profileImage = this.profileImage;
          localStorage.setItem('users', JSON.stringify(users));
        }

        event.target.value = ''; // Reset the input value
      };
      render.readAsDataURL(file);
    }
  }
  backToDashboard(){
    this.router.navigate(['/dashboard']);
  }
}
