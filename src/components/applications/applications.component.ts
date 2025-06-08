import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, FormsModule, DatePipe],
  template: `
    <app-main-layout>
      <div class="applications-container">
        <div class="page-header">
          <h1>Job Applications</h1>
          <p>Manage applications for your job postings</p>
        </div>
        
        <div class="applications-content">
          <!-- Job Applications for My Posts -->
          <div class="job-applications" *ngIf="myJobsWithApplications.length > 0">
            <div *ngFor="let job of myJobsWithApplications" class="job-section">
              <div class="job-header">
                <h2>{{job.title}} - {{job.company}}</h2>
                <span class="application-count">{{job.applications?.length || 0}} Applications</span>
              </div>
              
              <div class="applications-list">
                <div *ngFor="let application of job.applications" class="application-card">
                  <div class="applicant-info">
                    <h3>{{application.userName}}</h3>
                    <p>{{application.userEmail}}</p>
                    <p><strong>Applied:</strong> {{application.appliedDate?.toDate() | date:'mediumDate'}}</p>
                    <span class="status" [ngClass]="'status-' + application.status">
                      {{application.status | titlecase}}
                    </span>
                  </div>
                  
                  <div class="application-actions" *ngIf="application.status === 'pending'">
                    <div class="interview-scheduling">
                      <h4>Schedule Interview</h4>
                      <div class="schedule-form">
                        <input 
                          type="date" 
                          [(ngModel)]="application.selectedDate"
                          [min]="getTomorrowDate()"
                          class="date-input"
                        >
                        <input 
                          type="time" 
                          [(ngModel)]="application.selectedTime"
                          class="time-input"
                        >
                        <button 
                          (click)="acceptAndScheduleInterview(job.id, application.userId, application.selectedDate, application.selectedTime)"
                          class="btn btn-primary"
                          [disabled]="!application.selectedDate || !application.selectedTime"
                        >
                          Accept & Schedule Interview
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      (click)="rejectApplication(job.id, application.userId)"
                      class="btn btn-danger"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div class="empty-state" *ngIf="myJobsWithApplications.length === 0 && !isLoading">
            <i class="icon-inbox"></i>
            <h3>No applications yet</h3>
            <p>Applications for your job postings will appear here</p>
          </div>
          
          <!-- Loading State -->
          <div class="loading-state" *ngIf="isLoading">
            <i class="icon-loader"></i>
            <p>Loading applications...</p>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .applications-container {
      padding: 2rem;
    }
    
    .page-header h1 {
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }
    
    .job-section {
      margin-bottom: 3rem;
      background: var(--card-background);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: var(--card-shadow);
    }
    
    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }
    
    .job-header h2 {
      color: var(--primary-color);
      margin: 0;
    }
    
    .application-count {
      background: var(--primary-color);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
    }
    
    .applications-list {
      display: grid;
      gap: 1rem;
    }
    
    .application-card {
      background: var(--background-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1.5rem;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 1.5rem;
      align-items: start;
    }
    
    .applicant-info h3 {
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }
    
    .applicant-info p {
      margin: 0.25rem 0;
      color: var(--text-secondary);
    }
    
    .status {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 0.5rem;
    }
    
    .status-pending {
      background: #fff3cd;
      color: #856404;
    }
    
    .status-interview_scheduled {
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .status-rejected {
      background: #ffebee;
      color: #d32f2f;
    }
    
    .application-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 300px;
    }
    
    .interview-scheduling {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
    }
    
    .interview-scheduling h4 {
      margin: 0 0 1rem 0;
      color: var(--text-primary);
    }
    
    .schedule-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .date-input, .time-input {
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-size: 0.9rem;
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
      text-align: center;
    }
    
    .btn-primary {
      background: var(--primary-color);
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
    }
    
    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .btn-danger {
      background: #f44336;
      color: white;
    }
    
    .btn-danger:hover {
      background: #da190b;
    }
    
    .empty-state, .loading-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-secondary);
    }
    
    .empty-state i, .loading-state i {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
  `]
})
export class ApplicationsComponent implements OnInit {
  myJobsWithApplications: any[] = [];
  isLoading = true;

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit() {
    await this.loadJobApplications();
  }

  async loadJobApplications() {
    this.isLoading = true;
    const user = this.firebaseService.getCurrentUser();
    
    if (user) {
      const result = await this.firebaseService.getJobsByUser(user.uid);
      if (result.success && result.data) {
        // Filter jobs that have applications
        this.myJobsWithApplications = result.data.filter((job: any) => 
          job.applications && job.applications.length > 0
        );
      }
    }
    
    this.isLoading = false;
  }

  async acceptAndScheduleInterview(jobId: string, applicantId: string, date: string, time: string) {
    if (!date || !time) return;
    
    const interviewDate = new Date(date);
    const result = await this.firebaseService.acceptApplicationAndScheduleInterview(
      jobId, 
      applicantId, 
      interviewDate, 
      time
    );
    
    if (result.success) {
      await this.loadJobApplications(); // Reload applications
      alert('Interview scheduled successfully!');
    } else {
      alert('Error scheduling interview: ' + result.error);
    }
  }

  async rejectApplication(jobId: string, applicantId: string) {
    const result = await this.firebaseService.updateApplicationStatus(jobId, applicantId, 'rejected');
    if (result.success) {
      await this.loadJobApplications(); // Reload applications
    }
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
} 