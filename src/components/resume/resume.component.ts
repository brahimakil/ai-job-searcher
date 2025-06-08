import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-resume',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="resume-container">
        <div class="page-header">
          <h1>My Resume</h1>
          <p>Manage your resume and CV documents</p>
        </div>
        
        <div class="resume-content">
          <div class="upload-section">
            <h3>Upload New Resume</h3>
            <div class="file-upload">
              <input 
                type="file" 
                #fileInput
                (change)="onFileSelected($event)" 
                accept=".pdf,.doc,.docx"
                style="display: none"
              >
              <button 
                type="button" 
                (click)="fileInput.click()" 
                class="btn btn-secondary"
              >
                <i class="icon-upload"></i>
                Choose File
              </button>
              <span *ngIf="selectedFile" class="file-name">{{selectedFile.name}}</span>
            </div>
            <button 
              (click)="uploadResume()" 
              [disabled]="!selectedFile || isUploading"
              class="btn btn-primary"
            >
              {{isUploading ? 'Uploading...' : 'Upload Resume'}}
            </button>
          </div>
          
          <div class="current-resume" *ngIf="currentResume">
            <h3>Current Resume</h3>
            <div class="resume-info">
              <div class="resume-preview">
                <i class="icon-file-text"></i>
                <div class="resume-details">
                  <p class="resume-filename">{{currentResume.fileName}}</p>
                  <p class="resume-date">Uploaded: {{currentResume.uploadDate | date:'medium'}}</p>
                </div>
              </div>
            </div>
            <div class="resume-actions">
              <button (click)="viewResume()" class="btn btn-primary">
                <i class="icon-eye"></i>
                View Resume
              </button>
              <button (click)="downloadResume()" class="btn btn-secondary">
                <i class="icon-download"></i>
                Download
              </button>
              <button (click)="deleteResume()" class="btn btn-danger">
                <i class="icon-x"></i>
                Delete
              </button>
            </div>
          </div>

          <div class="no-resume" *ngIf="!currentResume && !isLoading">
            <div class="empty-state">
              <i class="icon-file-text"></i>
              <h3>No resume uploaded</h3>
              <p>Upload your first resume to get started with job applications.</p>
            </div>
          </div>

          <div *ngIf="isLoading" class="loading">
            <p>Loading your resume...</p>
          </div>

          <!-- PDF Viewer Modal -->
          <div *ngIf="showPdfViewer" class="pdf-modal" (click)="closePdfViewer()">
            <div class="pdf-modal-content" (click)="$event.stopPropagation()">
              <div class="pdf-modal-header">
                <h3>Resume Preview - {{currentResume?.fileName}}</h3>
                <div class="modal-actions">
                  <button (click)="downloadResume()" class="btn btn-secondary">
                    <i class="icon-download"></i>
                    Download
                  </button>
                  <button (click)="closePdfViewer()" class="close-btn">&times;</button>
                </div>
              </div>
              <div class="pdf-viewer">
                <div *ngIf="!pdfViewerUrl" class="pdf-loading">
                  <p>Loading PDF...</p>
                </div>
                <iframe 
                  *ngIf="pdfViewerUrl"
                  [src]="pdfViewerUrl" 
                  width="100%" 
                  height="700px"
                  frameborder="0"
                  class="pdf-iframe">
                  <p>Your browser doesn't support PDF viewing. <a (click)="downloadResume()">Download the file</a> instead.</p>
                </iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styleUrls: ['./resume.component.css']
})
export class ResumeComponent implements OnInit {
  selectedFile: File | null = null;
  currentResume: any = null;
  isUploading = false;
  isLoading = true;
  showPdfViewer = false;
  pdfViewerUrl: SafeResourceUrl | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    await this.loadCurrentResume();
  }

  async loadCurrentResume() {
    const user = this.firebaseService.getCurrentUser();
    if (user) {
      try {
        const userData = await this.firebaseService.getUserData(user.uid);
        if (userData.success && userData.data && userData.data['cvBase64']) {
          this.currentResume = {
            fileName: userData.data['cvFileName'] || 'resume.pdf',
            uploadDate: userData.data['cvUploadDate']?.toDate() || new Date(),
            base64Data: userData.data['cvBase64']
          };
        }
      } catch (error) {
        console.error('Error loading resume:', error);
      }
    }
    this.isLoading = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PDF, DOC, or DOCX file');
        return;
      }

      this.selectedFile = file;
    }
  }

  async uploadResume() {
    if (!this.selectedFile) return;

    this.isUploading = true;
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      const user = this.firebaseService.getCurrentUser();
      
      if (user) {
        const updateData = {
          cvBase64: base64Data,
          cvFileName: this.selectedFile!.name,
          cvUploadDate: new Date()
        };
        
        try {
          const result = await this.firebaseService.updateUserData(user.uid, updateData);
          
          if (result.success) {
            alert('Resume uploaded successfully!');
            await this.loadCurrentResume();
            this.selectedFile = null;
            // Reset file input
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          } else {
            alert('Failed to upload resume. Please try again.');
          }
        } catch (error) {
          console.error('Error uploading resume:', error);
          alert('Failed to upload resume. Please try again.');
        }
      }
      
      this.isUploading = false;
    };
    
    reader.readAsDataURL(this.selectedFile);
  }

  viewResume() {
    if (this.currentResume && this.currentResume.base64Data) {
      try {
        // Check if it's a PDF
        if (this.currentResume.fileName.toLowerCase().endsWith('.pdf')) {
          // For PDF files, create a blob URL
          const base64Data = this.currentResume.base64Data.includes(',') 
            ? this.currentResume.base64Data.split(',')[1] 
            : this.currentResume.base64Data;
          
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          this.pdfViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          this.showPdfViewer = true;
        } else {
          // For non-PDF files, just download them
          alert('This file type cannot be previewed. It will be downloaded instead.');
          this.downloadResume();
        }
      } catch (error) {
        console.error('Error viewing resume:', error);
        alert('Error viewing resume. Please try downloading it instead.');
      }
    }
  }

  downloadResume() {
    if (this.currentResume && this.currentResume.base64Data) {
      try {
        const link = document.createElement('a');
        link.href = this.currentResume.base64Data;
        link.download = this.currentResume.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading resume:', error);
        alert('Error downloading resume. Please try again.');
      }
    }
  }

  async deleteResume() {
    if (confirm('Are you sure you want to delete your current resume?')) {
      const user = this.firebaseService.getCurrentUser();
      if (user) {
        const updateData = {
          cvBase64: '',
          cvFileName: '',
          cvUploadDate: null
        };
        
        try {
          const result = await this.firebaseService.updateUserData(user.uid, updateData);
          
          if (result.success) {
            this.currentResume = null;
            alert('Resume deleted successfully!');
          } else {
            alert('Failed to delete resume. Please try again.');
          }
        } catch (error) {
          console.error('Error deleting resume:', error);
          alert('Failed to delete resume. Please try again.');
        }
      }
    }
  }

  closePdfViewer() {
    this.showPdfViewer = false;
    if (this.pdfViewerUrl) {
      // Clean up the blob URL
      const url = (this.pdfViewerUrl as any).changingThisBreaksApplicationSecurity;
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      this.pdfViewerUrl = null;
    }
  }
} 