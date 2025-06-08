import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-interviews',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, DatePipe],
  template: `
    <app-main-layout>
      <div class="interviews-container">
        <div class="page-header">
          <h1>My Interviews</h1>
          <p>Manage your upcoming and past interviews</p>
        </div>
        
        <div class="interviews-content">
          <!-- As Employer Section -->
          <div class="interview-section" *ngIf="employerInterviews.length > 0">
            <h2>
              <i class="icon-briefcase"></i>
              Interviews for My Job Posts ({{employerInterviews.length}})
            </h2>
            
            <div class="interviews-grid">
              <div *ngFor="let interview of employerInterviews" class="interview-card">
                <div class="interview-header">
                  <h3>{{interview.jobTitle}}</h3>
                  <span class="interview-status" [ngClass]="'status-' + interview.status">
                    {{interview.status | titlecase}}
                  </span>
                </div>
                
                <div class="interview-details">
                  <p><strong>Candidate:</strong> {{interview.candidateName}}</p>
                  <p><strong>Date:</strong> {{interview.scheduledDate?.toDate() | date:'mediumDate'}}</p>
                  <p><strong>Time:</strong> {{interview.scheduledTime}}</p>
                  <p><strong>Location:</strong> {{interview.location}}</p>
                </div>
                
                <div class="interview-actions" *ngIf="interview.status === 'scheduled'">
                  <button (click)="updateInterviewStatus(interview.id, 'completed')" class="btn btn-success">
                    Mark Completed
                  </button>
                  <button (click)="updateInterviewStatus(interview.id, 'cancelled')" class="btn btn-danger">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- As Candidate Section -->
          <div class="interview-section" *ngIf="candidateInterviews.length > 0">
            <h2>
              <i class="icon-user"></i>
              My Job Interviews ({{candidateInterviews.length}})
            </h2>
            
            <div class="interviews-grid">
              <div *ngFor="let interview of candidateInterviews" class="interview-card">
                <div class="interview-header">
                  <h3>{{interview.jobTitle}}</h3>
                  <span class="interview-status" [ngClass]="'status-' + interview.status">
                    {{interview.status | titlecase}}
                  </span>
                </div>
                
                <div class="interview-details">
                  <p><strong>Company:</strong> {{interview.company}}</p>
                  <p><strong>Interviewer:</strong> {{interview.employerName}}</p>
                  <p><strong>Date:</strong> {{interview.scheduledDate?.toDate() | date:'mediumDate'}}</p>
                  <p><strong>Time:</strong> {{interview.scheduledTime}}</p>
                  <p><strong>Location:</strong> {{interview.location}}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div class="empty-state" *ngIf="employerInterviews.length === 0 && candidateInterviews.length === 0 && !isLoading">
            <i class="icon-calendar"></i>
            <h3>No interviews scheduled</h3>
            <p>Your interview schedule will appear here</p>
          </div>
          
          <!-- Loading State -->
          <div class="loading-state" *ngIf="isLoading">
            <i class="icon-loader"></i>
            <p>Loading interviews...</p>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .interviews-container {
      padding: 2rem;
    }
    
    .page-header h1 {
      color: var(--primary-color);
      margin-bottom: 0.5rem;
    }
    
    .interview-section {
      margin-bottom: 3rem;
    }
    
    .interview-section h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-primary);
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
    }
    
    .interviews-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    
    .interview-card {
      background: var(--card-background);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: var(--card-shadow);
      border: 1px solid var(--border-color);
    }
    
    .interview-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    
    .interview-header h3 {
      color: var(--primary-color);
      margin: 0;
      font-size: 1.2rem;
    }
    
    .interview-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-scheduled {
      background: #e3f2fd;
      color: #1976d2;
    }
    
    .status-completed {
      background: #e8f5e8;
      color: #2e7d32;
    }
    
    .status-cancelled {
      background: #ffebee;
      color: #d32f2f;
    }
    
    .interview-details p {
      margin: 0.5rem 0;
      color: var(--text-secondary);
    }
    
    .interview-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    
    .btn-success {
      background: #4caf50;
      color: white;
    }
    
    .btn-success:hover {
      background: #45a049;
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
export class InterviewsComponent implements OnInit {
  employerInterviews: any[] = [];
  candidateInterviews: any[] = [];
  isLoading = true;

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit() {
    await this.loadInterviews();
  }

  async loadInterviews() {
    this.isLoading = true;
    const user = this.firebaseService.getCurrentUser();
    
    if (user) {
      const result = await this.firebaseService.getUserInterviews(user.uid);
      if (result.success && result.data) {
        this.employerInterviews = result.data.asEmployer;
        this.candidateInterviews = result.data.asCandidate;
      }
    }
    
    this.isLoading = false;
  }

  async updateInterviewStatus(interviewId: string, status: 'completed' | 'cancelled') {
    const result = await this.firebaseService.updateInterviewStatus(interviewId, status);
    if (result.success) {
      await this.loadInterviews(); // Reload interviews
    }
  }
} 