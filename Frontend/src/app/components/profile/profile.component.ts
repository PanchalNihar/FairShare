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
  mobileNumber?: string;
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
    mobileNumber: '',
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
  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {

        if (!user) {
            this.router.navigate(['/signin']);
            return;
        }

        this.user = {
            username: user.username,
            email: user.email,
            profileImage: user.avatar || '',
            mobileNumber: user.mobileNumber || ''
        };

        this.profileImage = user.avatar || '';

    });
}

  toggleEditMode(): void {
    this.isEditing = !this.isEditing;
  }

  async onUpdateProfile(): Promise<void> {
    if (this.user.username && this.user.email) {
      if (this.user.mobileNumber && !/^[0-9]{10}$/.test(this.user.mobileNumber)) {
        this.openModal('Error', 'Please enter a valid 10-digit mobile number.', 'error');
        return;
      }
      try {
        await this.authService.updateUserProfile({
          username: this.user.username,
          email: this.user.email,
          mobileNumber: this.user.mobileNumber,
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

  async saveImage(): Promise<void> {
    try {
      await this.authService.updateUserProfile({
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
