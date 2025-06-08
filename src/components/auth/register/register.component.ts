import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../../../services/firebase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  formData = {
    name: '',
    email: '',
    field: '',
    location: '',
    password: '',
    acceptTerms: false
  };

  selectedFile: File | null = null;
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {
    // Check if user is already logged in
    this.firebaseService.currentUser$.subscribe(user => {
      if (user) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      if (file.size <= 5 * 1024 * 1024) { // 5MB limit
        this.selectedFile = file;
        this.errorMessage = '';
      } else {
        this.errorMessage = 'File size must be less than 5MB';
        event.target.value = '';
      }
    } else {
      this.errorMessage = 'Please select a PDF file';
      event.target.value = '';
    }
  }

  removeFile() {
    this.selectedFile = null;
    const fileInput = document.getElementById('cv-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  async onSubmit() {
    if (!this.formData.acceptTerms) {
      this.errorMessage = 'Please accept the terms and conditions';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      let cvBase64 = '';
      if (this.selectedFile) {
        cvBase64 = await this.convertFileToBase64(this.selectedFile);
      }

      const userData = {
        ...this.formData,
        cvBase64
      };

      const result = await this.firebaseService.register(userData);

      if (result.success) {
        this.successMessage = 'Account created successfully! Redirecting to dashboard...';
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      } else {
        this.errorMessage = result.error || 'Registration failed. Please try again.';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'An unexpected error occurred';
    } finally {
      this.isLoading = false;
    }
  }
} 