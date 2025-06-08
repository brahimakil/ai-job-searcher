import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { AiService } from '../../services/ai.service';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';

@Component({
  selector: 'app-job-search',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, DatePipe],
  template: `
    <app-main-layout>
      <div class="job-search-container">
        <div class="page-header">
          <h1>AI Job Search Assistant</h1>
          <p>Find your perfect job with AI-powered recommendations</p>
        </div>
        
        <div class="search-content">
          <div class="chat-container">
            <div class="chat-header">
              <i class="icon-cpu"></i>
              <h3>AI Assistant</h3>
            </div>
            
            <div class="chat-messages" #chatMessages>
              <div *ngIf="messages.length === 0" class="empty-chat">
                <i class="icon-cpu"></i>
                <p>Hi! I'm your AI job search assistant. Ask me about jobs, career advice, or anything related to your job search!</p>
              </div>
              
              <div *ngFor="let message of messages" class="message" 
                   [ngClass]="{'user-message': message.isUser, 'ai-message': !message.isUser}">
                <div class="message-content">
                  {{message.content}}
                  <span class="message-time">{{message.timestamp | date:'short'}}</span>
                </div>
              </div>
              
              <div *ngIf="isLoading" class="message ai-message">
                <div class="message-content">
                  <i class="icon-loader"></i> AI is typing...
                </div>
              </div>
            </div>
            
            <div class="chat-input">
              <input 
                type="text" 
                [(ngModel)]="userMessage" 
                (keyup.enter)="sendMessage()"
                placeholder="Ask me about jobs, skills, or career advice..."
                class="message-input"
                [disabled]="isLoading"
              >
              <button 
                (click)="sendMessage()" 
                class="send-btn"
                [disabled]="!userMessage.trim() || isLoading"
              >
                <i class="icon-search"></i>
                {{isLoading ? 'Sending...' : 'Send'}}
              </button>
            </div>
          </div>
          
          <div class="available-jobs">
            <div class="jobs-header">
              <h3>
                <i class="icon-briefcase"></i>
                Job Listings ({{filteredJobs.length}})
              </h3>
              
              <div class="job-filters">
                <div class="filter-group">
                  <label>Show:</label>
                  <select [(ngModel)]="jobFilter" (change)="applyFilters()" class="filter-select">
                    <option value="available">Available Jobs Only</option>
                    <option value="all">All Jobs (Including Filled)</option>
                    <option value="my-jobs">My Posted Jobs</option>
                    <option value="filled">Filled Jobs Only</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="jobs-grid">
              <div *ngFor="let job of filteredJobs" class="job-card">
                <div class="job-header">
                  <h4>{{job.title}}</h4>
                  <div class="job-badges">
                    <span class="job-type">{{job.jobType}}</span>
                    <span *ngIf="job.status === 'filled'" class="status-badge filled">Filled</span>
                    <span *ngIf="isMyJob(job)" class="status-badge my-job">My Job</span>
                  </div>
                </div>
                
                <div class="job-details">
                  <p><strong>Company:</strong> {{job.company}}</p>
                  <p><strong>Location:</strong> {{job.location}}</p>
                  <p><strong>Salary:</strong> {{job.salary || 'Not specified'}}</p>
                  <p *ngIf="job.status === 'filled'"><strong>Status:</strong> <span class="filled-status">Position Filled</span></p>
                </div>
                
                <div class="job-description">
                  {{job.description | slice:0:150}}{{job.description?.length > 150 ? '...' : ''}}
                </div>
                
                <div class="job-actions">
                  <button 
                    *ngIf="!isMyJob(job) && job.status !== 'filled'"
                    (click)="applyToJob(job)" 
                    class="btn btn-primary"
                    [disabled]="hasApplied(job.id)"
                  >
                    <i class="icon-file-text"></i>
                    {{hasApplied(job.id) ? 'Applied' : 'Apply Now'}}
                  </button>
                  
                  <button 
                    *ngIf="isMyJob(job)"
                    (click)="viewMyJobApplications(job)" 
                    class="btn btn-success"
                  >
                    <i class="icon-users"></i>
                    View Applications ({{job.applications?.length || 0}})
                  </button>
                  
                  <button (click)="viewJobDetails(job)" class="btn btn-secondary">
                    <i class="icon-eye"></i>
                    View Details
                  </button>
                </div>
              </div>
              
              <div *ngIf="filteredJobs.length === 0" class="empty-state">
                <div class="empty-content">
                  <i class="icon-briefcase"></i>
                  <h4>No jobs found</h4>
                  <p *ngIf="jobFilter === 'available'">No available jobs match your criteria. Try changing the filter or ask the AI assistant for recommendations!</p>
                  <p *ngIf="jobFilter === 'my-jobs'">You haven't posted any jobs yet. <a routerLink="/post-job">Post your first job</a>!</p>
                  <p *ngIf="jobFilter === 'filled'">No filled positions found.</p>
                  <p *ngIf="jobFilter === 'all'">No jobs found. Try asking the AI assistant for help!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Job Details Modal -->
        <div *ngIf="showJobModal" class="job-modal" (click)="closeJobModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{selectedJob?.title}}</h3>
              <div class="modal-badges">
                <span *ngIf="selectedJob?.status === 'filled'" class="status-badge filled">Filled</span>
                <span *ngIf="isMyJob(selectedJob)" class="status-badge my-job">My Job</span>
              </div>
              <button (click)="closeJobModal()" class="close-btn">&times;</button>
            </div>
            
            <div class="modal-body">
              <div class="job-info">
                <p><strong>Company:</strong> {{selectedJob?.company}}</p>
                <p><strong>Location:</strong> {{selectedJob?.location}}</p>
                <p><strong>Job Type:</strong> {{selectedJob?.jobType}}</p>
                <p><strong>Salary:</strong> {{selectedJob?.salary || 'Not specified'}}</p>
                <p *ngIf="selectedJob?.applicationDeadline"><strong>Deadline:</strong> {{selectedJob?.applicationDeadline?.toDate() | date:'mediumDate'}}</p>
                <p *ngIf="selectedJob?.status === 'filled'"><strong>Status:</strong> <span class="filled-status">Position Filled</span></p>
              </div>
              
              <div class="job-section">
                <h4>Requirements</h4>
                <p>{{selectedJob?.requirements}}</p>
              </div>
              
              <div class="job-section">
                <h4>Description</h4>
                <p>{{selectedJob?.description}}</p>
              </div>
              
              <div class="modal-actions">
                <button 
                  *ngIf="!isMyJob(selectedJob) && selectedJob?.status !== 'filled'"
                  (click)="applyToJob(selectedJob)" 
                  class="btn btn-primary" 
                  [disabled]="hasApplied(selectedJob?.id)"
                >
                  {{hasApplied(selectedJob?.id) ? 'Applied' : 'Apply Now'}}
                </button>
                
                <button 
                  *ngIf="isMyJob(selectedJob)"
                  (click)="viewMyJobApplications(selectedJob)" 
                  class="btn btn-success"
                >
                  View Applications ({{selectedJob?.applications?.length || 0}})
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styleUrls: ['./job-search.component.css']
})
export class JobSearchComponent implements OnInit {
  userMessage = '';
  isLoading = false;
  userLocation = '';
  userField = '';
  userSkills: string[] = [];
  messages: any[] = [];
  allJobs: any[] = [];
  filteredJobs: any[] = [];
  showJobModal = false;
  selectedJob: any = null;
  appliedJobs: string[] = [];
  currentUserId: string = '';
  
  // Filter options
  jobFilter: 'available' | 'all' | 'my-jobs' | 'filled' = 'available';
  includeMyJobs: boolean = true;

  constructor(
    private firebaseService: FirebaseService,
    private aiService: AiService
  ) {}

  async ngOnInit() {
    console.log('JobSearchComponent initialized');
    
    const user = this.firebaseService.getCurrentUser();
    if (user) {
      this.currentUserId = user.uid;
      try {
        const userData = await this.firebaseService.getUserData(user.uid);
        if (userData.success) {
          this.userLocation = userData.data['location'] || '';
          this.userField = userData.data['field'] || '';
          this.userSkills = userData.data['skills'] || [];
          this.appliedJobs = (userData.data['myApplications'] || []).map((app: any) => app.jobId);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }

    await this.loadJobs();
    this.applyFilters();
    this.scrollToBottom();

    // Add welcome message
    setTimeout(() => {
      this.messages.push({
        content: `Hello! I'm your AI job search assistant. I can help you find job opportunities${this.userLocation ? ' in ' + this.userLocation : ''}${this.userField ? ' for ' + this.userField : ''}. What kind of position are you looking for?`,
        isUser: false,
        timestamp: new Date()
      });
      console.log('Welcome message added:', this.messages);
    }, 500);
  }

  async loadJobs() {
    // Load ALL jobs (including filled ones) so we can filter them properly
    const result = await this.firebaseService.getAllJobs();
    if (result.success && result.data) {
      this.allJobs = result.data;
    }
  }

  applyFilters() {
    let jobs = [...this.allJobs];
    
    switch (this.jobFilter) {
      case 'available':
        jobs = jobs.filter(job => job.status !== 'filled' && job.isActive !== false);
        if (!this.includeMyJobs) {
          jobs = jobs.filter(job => job.postedBy !== this.currentUserId);
        }
        break;
        
      case 'all':
        if (!this.includeMyJobs) {
          jobs = jobs.filter(job => job.postedBy !== this.currentUserId);
        }
        break;
        
      case 'my-jobs':
        jobs = jobs.filter(job => job.postedBy === this.currentUserId);
        break;
        
      case 'filled':
        jobs = jobs.filter(job => job.status === 'filled');
        if (!this.includeMyJobs) {
          jobs = jobs.filter(job => job.postedBy !== this.currentUserId);
        }
        break;
    }
    
    this.filteredJobs = jobs;
  }

  isMyJob(job: any): boolean {
    return job && job.postedBy === this.currentUserId;
  }

  viewMyJobApplications(job: any) {
    // Navigate to my-jobs page or show applications modal
    // For now, let's show an alert with application count
    const applicationCount = job.applications?.length || 0;
    alert(`This job has ${applicationCount} applications. Go to "My Jobs" page to manage applications.`);
  }

  async sendMessage() {
    if (!this.userMessage.trim() || this.isLoading) return;

    console.log('Sending message:', this.userMessage);

    // Add user message
    this.messages.push({
      content: this.userMessage,
      isUser: true,
      timestamp: new Date()
    });

    const query = this.userMessage;
    this.userMessage = '';
    this.isLoading = true;

    try {
      // Get user location from profile
      const user = this.firebaseService.getCurrentUser();
      let userLocation = '';
      if (user) {
        const userData = await this.firebaseService.getUserData(user.uid);
        if (userData.success) {
          userLocation = userData.data['location'] || '';
        }
      }
      
      // Use the AI service to generate a response
      const response = await this.aiService.askAboutJobs(query, userLocation);
      
      this.messages.push({
        content: response,
        isUser: false,
        timestamp: new Date()
      });
      
      // Check if this was an application request and refresh data if needed
      const isApplicationRequest = query.toLowerCase().includes('apply') || 
                                  query.toLowerCase().includes('book');
      
      if (isApplicationRequest && response.includes('successfully submitted')) {
        // Refresh applied jobs list and job data
        await this.refreshUserApplications();
        await this.loadJobs();
        this.applyFilters();
      }
      
      console.log('AI response added:', response);
    } catch (error) {
      console.error('Error generating AI response:', error);
      this.messages.push({
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      });
    }

    this.isLoading = false;
    this.scrollToBottom();
  }

  private async refreshUserApplications() {
    const user = this.firebaseService.getCurrentUser();
    if (user) {
      try {
        const userData = await this.firebaseService.getUserData(user.uid);
        if (userData.success) {
          this.appliedJobs = (userData.data['myApplications'] || []).map((app: any) => app.jobId);
        }
      } catch (error) {
        console.error('Error refreshing user applications:', error);
      }
    }
  }

  viewJobDetails(job: any) {
    this.selectedJob = job;
    this.showJobModal = true;
  }

  closeJobModal() {
    this.showJobModal = false;
    this.selectedJob = null;
  }

  async applyToJob(job: any) {
    if (!job || this.hasApplied(job.id) || this.isMyJob(job) || job.status === 'filled') return;

    const user = this.firebaseService.getCurrentUser();
    if (user) {
      try {
        const userData = await this.firebaseService.getUserData(user.uid);
        if (userData.success) {
          const applicationData = {
            userId: user.uid,
            name: userData.data['name'] || 'User',
            email: userData.data['email'] || user.email,
            location: userData.data['location'] || '',
            field: userData.data['field'] || '',
            skills: userData.data['skills'] || [],
            cvBase64: userData.data['cvBase64'] || '',
            cvFileName: userData.data['cvFileName'] || '',
            appliedDate: new Date(),
            status: 'pending'
          };

          const result = await this.firebaseService.applyToJob(job.id, applicationData);
          
          if (result.success) {
            this.appliedJobs.push(job.id);
            alert('Application submitted successfully!');
            this.closeJobModal();
            
            // Add to chat
            this.messages.push({
              content: `Great! I've submitted your application for the <strong>${job.title}</strong> position at ${job.company}. The employer will review your application and get back to you soon.`,
              isUser: false,
              timestamp: new Date()
            });
            this.scrollToBottom();
          } else {
            alert('Failed to submit application. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error applying to job:', error);
        alert('Failed to submit application. Please try again.');
      }
    }
  }

  hasApplied(jobId: string): boolean {
    return this.appliedJobs.includes(jobId);
  }

  scrollToBottom() {
    setTimeout(() => {
      const chatMessages = document.querySelector('.chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 100);
  }
} 