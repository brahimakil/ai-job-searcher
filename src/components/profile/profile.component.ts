import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="profile-container">
        <div class="page-header">
          <h1>My Profile</h1>
          <p>Manage your personal information and preferences</p>
        </div>
        
        <div class="profile-content">
          <div class="profile-form">
            <div class="profile-photo-section">
              <div class="current-photo">
                <img 
                  *ngIf="userData.profilePhoto" 
                  [src]="userData.profilePhoto" 
                  alt="Profile Photo"
                  class="profile-image"
                >
                <div *ngIf="!userData.profilePhoto" class="no-photo">
                  <i class="icon-user"></i>
                  <p>No photo uploaded</p>
                </div>
              </div>
              
              <div class="photo-upload">
                <input 
                  type="file" 
                  #photoInput
                  (change)="onPhotoSelected($event)" 
                  accept="image/*"
                  style="display: none"
                >
                <button 
                  type="button" 
                  (click)="photoInput.click()" 
                  class="btn btn-secondary"
                >
                  Upload Photo
                </button>
                <button 
                  *ngIf="userData.profilePhoto" 
                  type="button" 
                  (click)="removePhoto()" 
                  class="btn btn-danger"
                >
                  Remove Photo
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Name</label>
              <input type="text" [(ngModel)]="userData.name" class="form-input">
            </div>
            
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="userData.email" class="form-input" readonly>
            </div>
            
            <div class="form-group">
              <label>Location</label>
              <input type="text" [(ngModel)]="userData.location" class="form-input">
            </div>
            
            <div class="form-group">
              <label>Field</label>
              <input type="text" [(ngModel)]="userData.field" class="form-input">
            </div>

            <div class="form-group">
              <label>Skills (comma separated)</label>
              <input 
                type="text" 
                [(ngModel)]="skillsString" 
                (ngModelChange)="updateSkills()"
                class="form-input"
                placeholder="JavaScript, React, Node.js, etc."
              >
            </div>
            
            <button (click)="updateProfile()" class="btn btn-primary" [disabled]="isUpdating">
              {{isUpdating ? 'Updating...' : 'Update Profile'}}
            </button>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userData = {
    name: '',
    email: '',
    location: '',
    field: '',
    skills: [] as string[],
    profilePhoto: ''
  };
  
  skillsString = '';
  isUpdating = false;

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit() {
    const user = this.firebaseService.getCurrentUser();
    if (user) {
      const userData = await this.firebaseService.getUserData(user.uid);
      if (userData.success && userData.data) {
        this.userData = {
          name: userData.data['name'] || '',
          email: userData.data['email'] || '',
          location: userData.data['location'] || '',
          field: userData.data['field'] || '',
          skills: userData.data['skills'] || [],
          profilePhoto: userData.data['profilePhoto'] || ''
        };
        this.skillsString = this.userData.skills.join(', ');
      }
    }
  }

  onPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.userData.profilePhoto = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto() {
    this.userData.profilePhoto = '';
  }

  updateSkills() {
    this.userData.skills = this.skillsString
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
  }

  async updateProfile() {
    const user = this.firebaseService.getCurrentUser();
    if (user) {
      this.isUpdating = true;
      const result = await this.firebaseService.updateUserData(user.uid, this.userData);
      this.isUpdating = false;
      
      if (result.success) {
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile. Please try again.');
      }
    }
  }
}