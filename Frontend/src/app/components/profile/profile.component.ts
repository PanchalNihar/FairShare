import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CustomModalComponent } from '../../shared/custom-modal/custom-modal.component';

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
  imports: [NavbarComponent, FormsModule, CommonModule,CustomModalComponent],
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
   isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalType: 'success' | 'error' | 'warning' | 'info' = 'info';
  constructor(private router: Router, private authService: AuthService) {}
    openModal(title: string, message: string, type: any = 'info') {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalType = type;
    this.isModalOpen = true;
  }
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
        this.openModal('Success', 'Profile updated successfully!', 'success');
        this.isEditing = false;
      } catch (error) {
        this.openModal('Error', 'Error updating profile', 'error');
      }
    } else {
      this.openModal('Error', 'Please fill out all fields.', 'error');
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
        this.openModal('Error', 'File size too large. Please choose an image under 5MB.', 'error');
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
      this.openModal('Success', 'Profile image saved successfully!', 'success');
    } catch (error) {
      this.openModal('Error', 'Error saving profile image', 'error');
    }
  }
   closeModal() {
    this.isModalOpen = false;
  }
  backToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
