import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-my-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent, FormsModule, DatePipe],
  template: `
    <app-main-layout>
      <div class="my-jobs-container">
        <div class="page-header">
          <h1>My Job Postings</h1>
          <p>Manage your job postings and view applications</p>
          <button routerLink="/post-job" class="btn btn-primary">
            <i class="icon-plus"></i>
            Post New Job
          </button>
        </div>
        
        <div class="jobs-content" *ngIf="!isLoading">
          <div *ngIf="jobs.length === 0" class="no-jobs">
            <div class="empty-state">
              <i class="icon-briefcase"></i>
              <h3>No job postings yet</h3>
              <p>Start by posting your first job opportunity</p>
              <button routerLink="/post-job" class="btn btn-primary">Post a Job</button>
            </div>
          </div>

          <div *ngIf="jobs.length > 0" class="jobs-grid">
            <div *ngFor="let job of jobs" class="job-card">
              <div class="job-header">
                <h3>{{job.title}}</h3>
                <span class="job-type">{{job.jobType}}</span>
              </div>
              
              <div class="job-details">
                <p><strong>Company:</strong> {{job.company}}</p>
                <p><strong>Location:</strong> {{job.location}}</p>
                <p><strong>Posted:</strong> {{job.postedDate?.toDate() | date:'mediumDate'}}</p>
                <p><strong>Applications:</strong> {{job.applications?.length || 0}}</p>
                <p><strong>Status:</strong> 
                  <span [ngClass]="'status-' + (job.status || 'active')">
                    {{job.status === 'filled' ? 'Filled' : 'Active'}}
                  </span>
                </p>
              </div>

              <div class="job-actions">
                <button (click)="viewApplications(job)" class="btn btn-primary">
                  View Applications ({{job.applications?.length || 0}})
                </button>
                <button (click)="editJob(job)" class="btn btn-secondary">Edit</button>
                <button (click)="deleteJob(job)" class="btn btn-danger">Delete</button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="isLoading" class="loading">
          <p>Loading your job postings...</p>
        </div>

        <!-- Edit Job Modal -->
        <div *ngIf="showEditModal" class="edit-modal" (click)="closeEditModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Edit Job Posting</h3>
              <button (click)="closeEditModal()" class="close-btn">&times;</button>
            </div>
            
            <div class="modal-body">
              <div class="form-group">
                <label>Job Title</label>
                <input type="text" [(ngModel)]="editJobData.title" class="form-input">
              </div>
              
              <div class="form-group">
                <label>Company</label>
                <input type="text" [(ngModel)]="editJobData.company" class="form-input">
              </div>
              
              <div class="form-group">
                <label>Location</label>
                <input type="text" [(ngModel)]="editJobData.location" class="form-input">
              </div>
              
              <div class="form-group">
                <label>Job Type</label>
                <select [(ngModel)]="editJobData.jobType" class="form-input">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Salary</label>
                <input type="text" [(ngModel)]="editJobData.salary" class="form-input" placeholder="e.g., $50,000 - $70,000">
              </div>
              
              <div class="form-group">
                <label>Requirements</label>
                <textarea [(ngModel)]="editJobData.requirements" class="form-textarea" rows="3"></textarea>
              </div>
              
              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="editJobData.description" class="form-textarea" rows="5"></textarea>
              </div>
              
              <div class="form-group">
                <label>Application Deadline</label>
                <input type="date" [(ngModel)]="editJobData.applicationDeadline" class="form-input">
              </div>
              
              <div class="modal-actions">
                <button (click)="saveJobChanges()" class="btn btn-primary" [disabled]="isUpdating">
                  {{isUpdating ? 'Saving...' : 'Save Changes'}}
                </button>
                <button (click)="closeEditModal()" class="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Applications Modal -->
        <div *ngIf="showApplicationsModal" class="applications-modal" (click)="closeApplicationsModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Applications for {{selectedJob?.title}}</h3>
              <button (click)="closeApplicationsModal()" class="close-btn">&times;</button>
            </div>
            
            <div class="modal-body">
              <div *ngIf="selectedJob?.applications?.length === 0" class="no-applications">
                <p>No applications received yet.</p>
              </div>

              <div *ngFor="let application of selectedJob?.applications" class="application-card">
                <div class="applicant-info">
                  <div class="applicant-header">
                    <h4>{{application.name || application.userName}}</h4>
                    <span class="application-status" [class]="application.status">
                      {{application.status | titlecase}}
                    </span>
                  </div>
                  
                  <div class="applicant-details">
                    <p><strong>Email:</strong> {{application.email || application.userEmail}}</p>
                    <p><strong>Location:</strong> {{application.location}}</p>
                    <p><strong>Field:</strong> {{application.field}}</p>
                    <p><strong>Applied:</strong> {{application.appliedDate?.toDate() | date:'medium'}}</p>
                    <p *ngIf="application.skills?.length"><strong>Skills:</strong> {{application.skills.join(', ')}}</p>
                  </div>

                  <div class="applicant-actions">
                    <button 
                      *ngIf="application.cvBase64" 
                      (click)="viewResume(application.cvBase64)"
                      class="btn btn-secondary"
                    >
                      View Resume
                    </button>
                    
                    <div *ngIf="application.status === 'pending'" class="status-actions">
                      <div class="interview-scheduling">
                        <h5>Schedule Interview</h5>
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
                          (click)="acceptAndScheduleInterview(application.userId, application.selectedDate, application.selectedTime)"
                          class="btn btn-success"
                          [disabled]="!application.selectedDate || !application.selectedTime"
                        >
                          Accept & Schedule Interview
                        </button>
                      </div>
                      
                      <button 
                        (click)="updateApplicationStatus(application.userId, 'rejected')"
                        class="btn btn-danger"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resume Viewer Modal -->
        <div *ngIf="showResumeViewer" class="resume-modal" (click)="closeResumeViewer()">
          <div class="resume-modal-content" (click)="$event.stopPropagation()">
            <div class="resume-modal-header">
              <h3>Applicant Resume</h3>
              <button (click)="closeResumeViewer()" class="close-btn">&times;</button>
            </div>
            <div class="resume-viewer">
              <iframe 
                *ngIf="pdfViewerUrl"
                [src]="pdfViewerUrl" 
                width="100%" 
                height="600px"
                frameborder="0">
              </iframe>
            </div>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styleUrls: ['./my-jobs.component.css']
})
export class MyJobsComponent implements OnInit {
  jobs: any[] = [];
  isLoading = true;
  isUpdating = false;
  showApplicationsModal = false;
  showResumeViewer = false;
  showEditModal = false;
  selectedJob: any = null;
  pdfViewerUrl: SafeResourceUrl | null = null;
  editJobData: any = {};

  constructor(
    private firebaseService: FirebaseService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    await this.loadMyJobs();
  }

  async loadMyJobs() {
    const user = this.firebaseService.getCurrentUser();
    if (user) {
      const result = await this.firebaseService.getJobsByUser(user.uid);
      if (result.success) {
        this.jobs = result.data || [];
      }
    }
    this.isLoading = false;
  }

  viewApplications(job: any) {
    this.selectedJob = job;
    this.showApplicationsModal = true;
  }

  closeApplicationsModal() {
    this.showApplicationsModal = false;
    this.selectedJob = null;
  }

  editJob(job: any) {
    this.selectedJob = job;
    this.editJobData = {
      title: job.title,
      company: job.company,
      location: job.location,
      jobType: job.jobType,
      salary: job.salary,
      requirements: job.requirements,
      description: job.description,
      applicationDeadline: job.applicationDeadline?.toDate()?.toISOString().split('T')[0] || ''
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedJob = null;
    this.editJobData = {};
  }

  async saveJobChanges() {
    if (!this.selectedJob) return;
    
    this.isUpdating = true;
    
    try {
      const updateData = {
        ...this.editJobData,
        applicationDeadline: this.editJobData.applicationDeadline ? new Date(this.editJobData.applicationDeadline) : null
      };
      
      const result = await this.firebaseService.updateJobData(this.selectedJob.id, updateData);
      
      if (result.success) {
        await this.loadMyJobs(); // Reload jobs
        this.closeEditModal();
        alert('Job updated successfully!');
      } else {
        alert('Failed to update job. Please try again.');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      alert('Failed to update job. Please try again.');
    }
    
    this.isUpdating = false;
  }

  async deleteJob(job: any) {
    if (confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      const result = await this.firebaseService.deleteJob(job.id);
      if (result.success) {
        await this.loadMyJobs(); // Reload jobs
        alert('Job deleted successfully!');
      } else {
        alert('Failed to delete job. Please try again.');
      }
    }
  }

  viewResume(cvBase64: string) {
    if (!cvBase64) {
      alert('No resume available for this applicant.');
      return;
    }

    try {
      // Handle base64 data properly - check if it includes data URL prefix
      const base64Data = cvBase64.includes(',') ? cvBase64.split(',')[1] : cvBase64;
      
      // Validate base64 data
      if (!base64Data || base64Data.trim() === '') {
        alert('Invalid resume data.');
        return;
      }

      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      this.pdfViewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.showResumeViewer = true;
    } catch (error) {
      console.error('Error viewing resume:', error);
      alert('Error viewing resume. The file may be corrupted or in an unsupported format.');
    }
  }

  closeResumeViewer() {
    this.showResumeViewer = false;
    if (this.pdfViewerUrl) {
      // Clean up the blob URL
      const url = (this.pdfViewerUrl as any).changingThisBreaksApplicationSecurity;
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
      this.pdfViewerUrl = null;
    }
  }

  async acceptAndScheduleInterview(applicantId: string, date: string, time: string) {
    if (!date || !time || !this.selectedJob) return;
    
    const interviewDate = new Date(date);
    const result = await this.firebaseService.acceptApplicationAndScheduleInterview(
      this.selectedJob.id, 
      applicantId, 
      interviewDate, 
      time
    );
    
    if (result.success) {
      await this.loadMyJobs(); // Reload jobs
      this.closeApplicationsModal();
      alert('Interview scheduled successfully! Job has been marked as filled.');
    } else {
      alert('Error scheduling interview: ' + result.error);
    }
  }

  async updateApplicationStatus(applicantId: string, status: 'accepted' | 'rejected') {
    if (this.selectedJob) {
      const result = await this.firebaseService.updateApplicationStatus(
        this.selectedJob.id, 
        applicantId, 
        status
      );
      
      if (result.success) {
        // Update local data
        const application = this.selectedJob.applications.find((app: any) => app.userId === applicantId);
        if (application) {
          application.status = status;
        }
        alert(`Application ${status} successfully!`);
      } else {
        alert('Failed to update application status. Please try again.');
      }
    }
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
} 