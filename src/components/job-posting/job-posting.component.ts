import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';

@Component({
  selector: 'app-job-posting',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="job-posting-container">
        <div class="page-header">
          <h1>Post a Job</h1>
          <p>Create a new job opportunity</p>
        </div>
        
        <div class="job-form">
          <form (ngSubmit)="postJob()" #jobForm="ngForm">
            <div class="form-group">
              <label>Job Title *</label>
              <input 
                type="text" 
                [(ngModel)]="jobData.title" 
                name="title"
                class="form-input" 
                required
              >
            </div>

            <div class="form-group">
              <label>Company *</label>
              <input 
                type="text" 
                [(ngModel)]="jobData.company" 
                name="company"
                class="form-input" 
                required
              >
            </div>

            <div class="form-group">
              <label>Location *</label>
              <input 
                type="text" 
                [(ngModel)]="jobData.location" 
                name="location"
                class="form-input" 
                required
              >
            </div>

            <div class="form-group">
              <label>Job Type *</label>
              <select [(ngModel)]="jobData.jobType" name="jobType" class="form-input" required>
                <option value="">Select job type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div class="form-group">
              <label>Salary Range</label>
              <input 
                type="text" 
                [(ngModel)]="jobData.salary" 
                name="salary"
                class="form-input" 
                placeholder="e.g., $80,000 - $120,000"
              >
            </div>

            <div class="form-group">
              <label>Requirements *</label>
              <textarea 
                [(ngModel)]="jobData.requirements" 
                name="requirements"
                class="form-textarea" 
                rows="4"
                placeholder="List the required skills, experience, education, etc."
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label>Job Description *</label>
              <textarea 
                [(ngModel)]="jobData.description" 
                name="description"
                class="form-textarea" 
                rows="6"
                placeholder="Describe the role, responsibilities, and what you're looking for..."
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label>Application Deadline</label>
              <input 
                type="date" 
                [(ngModel)]="jobData.applicationDeadline" 
                name="deadline"
                class="form-input"
              >
            </div>

            <div class="form-actions">
              <button 
                type="submit" 
                [disabled]="!jobForm.form.valid || isPosting"
                class="btn btn-primary"
              >
                {{isPosting ? 'Posting...' : 'Post Job'}}
              </button>
              <button 
                type="button" 
                (click)="cancel()"
                class="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </app-main-layout>
  `,
  styleUrls: ['./job-posting.component.css']
})
export class JobPostingComponent {
  jobData = {
    title: '',
    company: '',
    location: '',
    jobType: '',
    salary: '',
    requirements: '',
    description: '',
    applicationDeadline: ''
  };

  isPosting = false;

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  async postJob() {
    if (this.isPosting) return;

    this.isPosting = true;
    const user = this.firebaseService.getCurrentUser();
    
    if (user) {
      const result = await this.firebaseService.createJob({
        ...this.jobData,
        postedBy: user.uid,
        postedDate: new Date(),
        applicationDeadline: this.jobData.applicationDeadline ? new Date(this.jobData.applicationDeadline) : null,
        applications: []
      });

      if (result.success) {
        alert('Job posted successfully!');
        this.router.navigate(['/my-jobs']);
      } else {
        alert('Failed to post job. Please try again.');
      }
    }

    this.isPosting = false;
  }

  cancel() {
    this.router.navigate(['/dashboard']);
  }
} 