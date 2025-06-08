import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';

interface RecentActivity {
  id: string;
  type: 'application' | 'interview' | 'profile' | 'job_posted';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  actionUrl?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MainLayoutComponent, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userName = 'User';
  userPhoto = '';
  stats = {
    totalJobs: 0,
    myApplications: 0,
    interviews: 0,
    profileCompletion: 0
  };
  recentActivities: RecentActivity[] = [];
  isLoading = true;

  constructor(private firebaseService: FirebaseService) {}

  async ngOnInit() {
    this.isLoading = true;
    
    const user = this.firebaseService.getCurrentUser();
    if (user) {
        const userData = await this.firebaseService.getUserData(user.uid);
        if (userData.success && userData.data) {
          this.userName = userData.data['name'] || userData.data['displayName'] || user.displayName || 'User';
          this.userPhoto = userData.data['profilePhoto'] || user.photoURL || '';
          
        // Calculate stats
        await this.loadStats(userData.data, user.uid);
        
        // Load recent activities
        await this.loadRecentActivities(userData.data, user.uid);
        } else {
        // Fallback to Firebase Auth user data
        this.userName = user.displayName || user.email?.split('@')[0] || 'User';
        this.userPhoto = user.photoURL || '';
        
        // Load basic stats
        await this.loadBasicStats(user.uid);
      }
    }
    
    this.isLoading = false;
  }

  async loadStats(userData: any, userId: string) {
    try {
      // Load total available jobs
      const jobsResult = await this.firebaseService.getAvailableJobs();
      if (jobsResult.success && jobsResult.data) {
        this.stats.totalJobs = jobsResult.data.length;
      }

      // Load user applications
      const userApplications = userData['myApplications'] || [];
      this.stats.myApplications = userApplications.length;

      // Load interviews
      const interviewsResult = await this.firebaseService.getUserInterviews(userId);
      if (interviewsResult.success && interviewsResult.data) {
        this.stats.interviews = interviewsResult.data.asCandidate.length + interviewsResult.data.asEmployer.length;
      }

      // Calculate profile completion
      this.stats.profileCompletion = this.calculateProfileCompletion(userData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async loadBasicStats(userId: string) {
    try {
      // Load total available jobs
      const jobsResult = await this.firebaseService.getAvailableJobs();
      if (jobsResult.success && jobsResult.data) {
        this.stats.totalJobs = jobsResult.data.length;
      }

      // Load interviews
      const interviewsResult = await this.firebaseService.getUserInterviews(userId);
      if (interviewsResult.success && interviewsResult.data) {
        this.stats.interviews = interviewsResult.data.asCandidate.length + interviewsResult.data.asEmployer.length;
      }
    } catch (error) {
      console.error('Error loading basic stats:', error);
    }
  }

  async loadRecentActivities(userData: any, userId: string) {
    const activities: RecentActivity[] = [];

    try {
      // Add application activities
      const userApplications = userData['myApplications'] || [];
      userApplications.slice(-5).forEach((app: any) => {
        activities.push({
          id: `app_${app.jobId}`,
          type: 'application',
          title: 'Job Application',
          description: `Applied to ${app.jobTitle} at ${app.company}`,
          timestamp: new Date(app.appliedDate),
          icon: 'icon-file-text',
          actionUrl: '/job-search'
        });

        // Add interview activities if scheduled
        if (app.status === 'interview_scheduled' && app.interviewDate) {
          activities.push({
            id: `interview_${app.jobId}`,
            type: 'interview',
            title: 'Interview Scheduled',
            description: `Interview for ${app.jobTitle} at ${app.company}`,
            timestamp: new Date(app.interviewDate),
            icon: 'icon-calendar',
            actionUrl: '/interviews'
          });
        }
      });

      // Add job posting activities (if user has posted jobs)
      const userJobsResult = await this.firebaseService.getJobsByUser(userId);
      if (userJobsResult.success && userJobsResult.data) {
        userJobsResult.data.slice(-3).forEach((job: any) => {
          activities.push({
            id: `job_${job.id}`,
            type: 'job_posted',
            title: 'Job Posted',
            description: `Posted ${job.title} position at ${job.company}`,
            timestamp: new Date(job.postedDate),
            icon: 'icon-briefcase',
            actionUrl: '/my-jobs'
          });
        });
      }

      // Add profile update activity (if profile was recently updated)
      if (userData['lastUpdated']) {
        const lastUpdated = new Date(userData['lastUpdated']);
        const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceUpdate <= 7) {
          activities.push({
            id: 'profile_update',
            type: 'profile',
            title: 'Profile Updated',
            description: 'Profile information was updated',
            timestamp: lastUpdated,
            icon: 'icon-user',
            actionUrl: '/profile'
          });
        }
      }

      // Sort activities by timestamp (newest first) and take top 5
      this.recentActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

    } catch (error) {
      console.error('Error loading recent activities:', error);
    }
  }

  calculateProfileCompletion(userData: any): number {
    if (!userData) return 0;
    
    let completedFields = 0;
    const totalFields = 8; // Total number of profile fields we check
    
    // Check each profile field
    if (userData['name']) completedFields++;
    if (userData['email']) completedFields++;
    if (userData['location']) completedFields++;
    if (userData['field']) completedFields++;
    if (userData['skills'] && userData['skills'].length > 0) completedFields++;
    if (userData['experience']) completedFields++;
    if (userData['cvBase64']) completedFields++; // Resume uploaded
    if (userData['profilePhoto']) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(timestamp).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  }
} 