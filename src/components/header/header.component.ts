import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { filter } from 'rxjs/operators';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'application' | 'interview' | 'job' | 'system';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  showUserMenu = false;
  showNotifications = false;
  userName = 'User';
  userPhoto = '';
  pageTitle = 'Dashboard';
  notifications: Notification[] = [];
  unreadCount = 0;
  isLoadingNotifications = false;

  private routeTitles: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/job-search': 'Job Search',
    '/interviews': 'Interviews',
    '/profile': 'My Profile',
    '/resume': 'My Resume',
    '/post-job': 'Post Job',
    '/my-jobs': 'My Jobs'
  };

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const notificationContainer = target.closest('.notifications-container');
    const userMenuContainer = target.closest('.user-menu');
    
    if (!notificationContainer) {
      this.showNotifications = false;
    }
    
    if (!userMenuContainer) {
      this.showUserMenu = false;
    }
  }

  async ngOnInit() {
    // Get user data
    this.firebaseService.currentUser$.subscribe(async (user) => {
      if (user) {
        try {
          const userData = await this.firebaseService.getUserData(user.uid);
          if (userData.success && userData.data) {
            this.userName = userData.data['name'] || userData.data['displayName'] || user.displayName || 'User';
            this.userPhoto = userData.data['profilePhoto'] || user.photoURL || '';
          } else {
            // Fallback to Firebase Auth user data
            this.userName = user.displayName || user.email?.split('@')[0] || 'User';
            this.userPhoto = user.photoURL || '';
          }
          
          // Load notifications
          await this.loadNotifications();
        } catch (error) {
          console.error('Error loading user data:', error);
          // Fallback to Firebase Auth user data
          this.userName = user.displayName || user.email?.split('@')[0] || 'User';
          this.userPhoto = user.photoURL || '';
        }
      }
    });

    // Update page title based on route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.pageTitle = this.routeTitles[event.url] || 'Dashboard';
      });

    // Set initial page title
    const currentUrl = this.router.url;
    this.pageTitle = this.routeTitles[currentUrl] || 'Dashboard';
  }

  async loadNotifications() {
    const user = this.firebaseService.getCurrentUser();
    if (!user) return;

    this.isLoadingNotifications = true;

    try {
      // Get user data for applications
      const userData = await this.firebaseService.getUserData(user.uid);
      const notifications: Notification[] = [];

      if (userData.success && userData.data) {
        const userApplications = userData.data['myApplications'] || [];
        
        // Create notifications for recent application status changes
        userApplications.forEach((app: any) => {
          if (app.status === 'interview_scheduled') {
            notifications.push({
              id: `interview_${app.jobId}`,
              title: 'Interview Scheduled',
              message: `Interview scheduled for ${app.jobTitle} at ${app.company}`,
              type: 'interview',
              timestamp: app.interviewDate ? new Date(app.interviewDate) : new Date(app.appliedDate),
              read: false,
              actionUrl: '/interviews'
            });
          } else if (app.status === 'accepted') {
            notifications.push({
              id: `accepted_${app.jobId}`,
              title: 'Application Accepted',
              message: `Your application for ${app.jobTitle} at ${app.company} was accepted`,
              type: 'application',
              timestamp: new Date(app.appliedDate),
              read: false,
              actionUrl: '/interviews'
            });
          }

          // Add application notification
          notifications.push({
            id: `app_${app.jobId}`,
            title: 'Application Submitted',
            message: `Applied to ${app.jobTitle} at ${app.company}`,
            type: 'application',
            timestamp: new Date(app.appliedDate),
            read: true, // Mark as read since it's their own action
            actionUrl: '/job-search'
          });
        });

        // Get interviews for additional notifications
        try {
          const interviewsResult = await this.firebaseService.getUserInterviews(user.uid);
          if (interviewsResult.success && interviewsResult.data) {
            const upcomingInterviews = [
              ...interviewsResult.data.asCandidate,
              ...interviewsResult.data.asEmployer
            ].filter((interview: any) => {
              const interviewDate = new Date(interview.scheduledDate);
              const today = new Date();
              const timeDiff = interviewDate.getTime() - today.getTime();
              const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
              return daysDiff >= 0 && daysDiff <= 7; // Next 7 days
            });

            upcomingInterviews.forEach((interview: any) => {
              notifications.push({
                id: `upcoming_${interview.id}`,
                title: 'Upcoming Interview',
                message: `Interview for ${interview.jobTitle} at ${interview.company} on ${new Date(interview.scheduledDate).toLocaleDateString()}`,
                type: 'interview',
                timestamp: new Date(interview.scheduledDate),
                read: false,
                actionUrl: '/interviews'
              });
            });
          }
        } catch (interviewError) {
          console.error('Error loading interviews for notifications:', interviewError);
        }
      }

      // Remove duplicates and sort notifications by timestamp (newest first)
      const uniqueNotifications = notifications.filter((notification, index, self) =>
        index === self.findIndex(n => n.id === notification.id)
      );

      this.notifications = uniqueNotifications
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // Keep only latest 10

      this.unreadCount = this.notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.notifications = [];
      this.unreadCount = 0;
    } finally {
      this.isLoadingNotifications = false;
    }
  }

  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
    this.showNotifications = false;
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    this.showUserMenu = false;
    
    // Load notifications when opening dropdown
    if (this.showNotifications && this.notifications.length === 0) {
      this.loadNotifications();
    }
  }

  markNotificationAsRead(notification: Notification, event: Event) {
    event.stopPropagation();
    
    if (!notification.read) {
      notification.read = true;
      this.unreadCount = this.notifications.filter(n => !n.read).length;
    }
    
    if (notification.actionUrl) {
      this.router.navigate([notification.actionUrl]);
    }
    this.showNotifications = false;
  }

  markAllAsRead(event: Event) {
    event.stopPropagation();
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
  }

  toggleMobileMenu() {
    // Add mobile menu logic here if needed
    console.log('Mobile menu toggled');
  }

  async logout() {
    this.showUserMenu = false;
    await this.firebaseService.logout();
    this.router.navigate(['/login']);
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(timestamp).getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  }
} 