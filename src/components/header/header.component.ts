import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  showUserMenu = false;
  userName = 'User';
  userPhoto = '';
  pageTitle = 'Dashboard';

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

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
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
} 