import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

interface UserProfile {
  username: string;
  email: string;
  profileImage?: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [NavbarComponent, FormsModule, CommonModule],
  encapsulation: ViewEncapsulation.None
})
export class ProfileComponent implements OnInit {
  user: UserProfile = {
    username: '',
    email: '',
    profileImage: '',
  };
  
  profileImage: string | ArrayBuffer | null = null;
  isEditing: boolean = false;
  showSaveButton: boolean = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    try {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const userData = JSON.parse(currentUser);
        this.user = {
          username: userData.username || '',
          email: userData.email || '',
          profileImage: userData.profileImage || '',
        };
        console.log("UserData:", userData);
        this.profileImage = userData.profileImage || null;
      } else {
        this.router.navigate(['/signin']);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      this.router.navigate(['/signin']);
    }
  }

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
  }

  onUpdateProfile(): void {
    if (this.user.username && this.user.email) {
      try {
        const updatedProfile = this.authService.updateUserProfile({
          username: this.user.username,
          email: this.user.email,
        });
        alert('Profile updated successfully!');
        this.isEditing = false;
      } catch (error) {
        alert('Error updating profile');
      }
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
      if (file.size > 5000000) {
        // 5MB limit
        alert('File size too large. Please choose an image under 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.profileImage = reader.result;
        this.showSaveButton = true;
      };
      reader.readAsDataURL(file);
    }
  }

  saveImage(): void {
    try {
      const updatedProfile = this.authService.updateUserProfile({
        profileImage: this.profileImage as string,
      });
      this.showSaveButton = false;
      alert('Profile image saved successfully!');
    } catch (error) {
      alert('Error saving profile image');
    }
  }

  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
